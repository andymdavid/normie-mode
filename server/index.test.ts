import { afterEach, describe, expect, it, vi } from 'vitest';
import { canonicalRedirect, subscribe } from './index';

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
