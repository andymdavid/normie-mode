import { afterEach, describe, expect, it, vi } from 'vitest';
import { canonicalRedirect, handleRequest, subscribe } from './index';

afterEach(() => vi.unstubAllGlobals());

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
