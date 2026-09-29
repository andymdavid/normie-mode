import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const Bun: {
  file(path: string): Blob & { exists(): Promise<boolean> };
  serve(options: { port: number; hostname: string; fetch(request: Request): Promise<Response> }): unknown;
};

const distDirectory = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 42001);
const intelligenceSnacksSubscribeUrl = 'https://intelligencesnacks.com/api/subscribe';

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

/**
 * Keep newsletter credentials in Intelligence Snacks. Normie Mode sends the same payload to that
 * service from its server, avoiding the browser CORS restriction while retaining Beehiiv source
 * attribution and Intelligence Snacks' validation, honeypot and rate limiting.
 */
export async function subscribe(request: Request) {
  let body: string;
  try {
    body = await request.text();
    JSON.parse(body);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
    ?? request.headers.get('x-real-ip');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (forwardedFor) headers.set('X-Forwarded-For', forwardedFor);
  const referer = request.headers.get('referer');
  if (referer) headers.set('Referer', referer);

  try {
    const response = await fetch(intelligenceSnacksSubscribeUrl, {
      method: 'POST',
      headers,
      body,
    });
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Intelligence Snacks subscription request failed.', error);
    return json({ error: 'Unable to subscribe right now. Please try again.' }, 502);
  }
}

async function staticResponse(request: Request) {
  const url = new URL(request.url);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
  const candidates = extname(safePath)
    ? [safePath]
    : [safePath ? `${safePath}.html` : 'index.html', join(safePath, 'index.html')];

  for (const candidate of candidates) {
    const file = Bun.file(join(distDirectory, candidate));
    if (await file.exists()) {
      const immutable = /\.(?:css|js|svg|png|jpe?g|webp|woff2?|otf)$/i.test(candidate);
      return new Response(request.method === 'HEAD' ? null : file, {
        headers: { 'Cache-Control': immutable ? 'public, max-age=2592000, immutable' : 'no-cache' },
      });
    }
  }

  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-cache' } });
}

if (import.meta.main) {
  Bun.serve({
    port,
    hostname: '0.0.0.0',
    async fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === '/healthz') return new Response('ok');
      if (pathname === '/api/subscribe') {
        if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        return subscribe(request);
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
      return staticResponse(request);
    },
  });

  console.log(`Normie Mode listening on port ${port}`);
}
