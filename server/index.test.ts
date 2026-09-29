import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribe } from './index';

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
