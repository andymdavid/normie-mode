import { afterEach, describe, expect, it, vi } from 'vitest';
import { canonicalRedirect, handleRequest, subscribe } from './index';

afterEach(() => vi.unstubAllGlobals());

function staticFile(content: string, type: string) {
  return Object.assign(new Blob([content], { type }), { exists: async () => true });
}

describe('newsletter subscription proxy', () => {
  it('passes the signup to Intelligence Snacks and preserves attribution', async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal('fetch', upstream);

    const response = await subscribe(new Request('https://normiemode.example/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://normiemode.example/' },
      body: JSON.stringify({ email: 'reader@example.com', website: '', source: 'normie-mode-footer' }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(upstream).toHaveBeenCalledWith('https://intelligencesnacks.com/api/subscribe', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'reader@example.com', website: '', source: 'normie-mode-footer' }),
    }));
  });

  it('returns Intelligence Snacks errors to the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { error: 'This email is already subscribed.' },
      { status: 409 },
    )));

    const response = await subscribe(new Request('https://normiemode.example/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: 'reader@example.com' }),
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'This email is already subscribed.' });
  });
});

describe('public URL canonicalization', () => {
  it.each([
    ['http://normiemode.com/models/example', {}, 'https://normiemode.com/models/example'],
    ['https://www.normiemode.com/models/example', {}, 'https://normiemode.com/models/example'],
    ['http://www.normiemode.com/models/example.html?from=test', {}, 'https://normiemode.com/models/example?from=test'],
    ['https://normiemode.com/models/example.html', {}, 'https://normiemode.com/models/example'],
    ['https://normiemode.com/models/example/index.html', {}, 'https://normiemode.com/models/example'],
    ['https://normiemode.com/index.html', {}, 'https://normiemode.com/'],
    [
      'http://normie-mode:3000/models/example',
      { 'X-Forwarded-Host': 'www.normiemode.com', 'X-Forwarded-Proto': 'https' },
      'https://normiemode.com/models/example',
    ],
  ])('permanently redirects %s to the preferred URL', (url, headers, destination) => {
    const response = canonicalRedirect(new Request(url, { headers }));

    expect(response?.status).toBe(308);
    expect(response?.headers.get('location')).toBe(destination);
  });

  it('does not redirect the canonical HTTPS URL', () => {
    expect(canonicalRedirect(new Request('https://normiemode.com/models/example'))).toBeUndefined();
  });

  it('does not redirect internal deployment hosts', () => {
    expect(canonicalRedirect(new Request('http://normie-mode:3000/healthz'))).toBeUndefined();
  });
});

describe('static response metadata', () => {
  it('gives HEAD the same status and representation headers as GET without a body', async () => {
    vi.stubGlobal('Bun', { file: () => staticFile('<h1>Normie Mode</h1>', 'text/html;charset=utf-8') });
    const headers = { 'Accept-Encoding': 'gzip' };

    const get = await handleRequest(new Request('https://normiemode.com/models/example', { headers }));
    const head = await handleRequest(new Request('https://normiemode.com/models/example', { method: 'HEAD', headers }));

    expect(head.status).toBe(get.status);
    for (const name of ['cache-control', 'content-type', 'content-encoding', 'vary']) {
      expect(head.headers.get(name)).toBe(get.headers.get(name));
    }
    expect(head.headers.get('content-encoding')).toBe('gzip');
    expect(await head.text()).toBe('');
    expect((await get.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('returns a stable content length when compression is not requested', async () => {
    const content = '<urlset></urlset>';
    vi.stubGlobal('Bun', { file: () => staticFile(content, 'application/xml') });

    const response = await handleRequest(new Request('https://normiemode.com/sitemap-0.xml', { method: 'HEAD' }));

    expect(response.headers.get('content-length')).toBe(String(new TextEncoder().encode(content).byteLength));
    expect(response.headers.get('cache-control')).toBe('public, max-age=300, must-revalidate');
  });

  it('respects an explicit refusal of gzip', async () => {
    vi.stubGlobal('Bun', { file: () => staticFile('<h1>Normie Mode</h1>', 'text/html;charset=utf-8') });

    const response = await handleRequest(new Request('https://normiemode.com/', {
      headers: { 'Accept-Encoding': 'br, gzip;q=0' },
    }));

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(response.headers.get('content-length')).not.toBeNull();
  });

  it('only marks fingerprinted build assets immutable', async () => {
    vi.stubGlobal('Bun', { file: () => staticFile('asset', 'image/jpeg') });

    const publicImage = await handleRequest(new Request('https://normiemode.com/norm-default.jpg'));
    const builtAsset = await handleRequest(new Request('https://normiemode.com/_astro/index.abc123.css'));

    expect(publicImage.headers.get('cache-control')).not.toContain('immutable');
    expect(builtAsset.headers.get('cache-control')).toContain('immutable');
  });
});

describe('crawler request logging', () => {
  it.each(['OAI-SearchBot/1.4', 'Claude-SearchBot/1.0', 'GPTBot/1.4', 'ClaudeBot/1.0'])(
    'logs privacy-minimal structured data for %s',
    async (userAgent) => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

      const response = await handleRequest(new Request('https://normiemode.com/healthz?private=value', {
        headers: { 'User-Agent': userAgent },
      }));

      expect(response.status).toBe(200);
      const entry = JSON.parse(String(info.mock.calls[0]?.[0]));
      expect(entry).toMatchObject({
        event: 'crawler_request',
        method: 'GET',
        path: '/healthz',
        status: 200,
        identity: 'unverified_user_agent',
      });
      expect(entry.crawler).toBe(userAgent.split('/')[0]);
      expect(info.mock.calls[0]?.[0]).not.toContain('private=value');
    },
  );

  it('does not log ordinary visitor requests', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await handleRequest(new Request('https://normiemode.com/healthz', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }));

    expect(info).not.toHaveBeenCalled();
  });
});
