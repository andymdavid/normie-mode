import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const Bun: {
  file(path: string): Blob & { exists(): Promise<boolean> };
  serve(options: { port: number; hostname: string; fetch(request: Request): Promise<Response> }): unknown;
};

const distDirectory = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 42001);
const intelligenceSnacksSubscribeUrl = 'https://intelligencesnacks.com/api/subscribe';
const canonicalHostname = 'normiemode.com';
const crawlerAgents = [
  ['OAI-SearchBot', /\bOAI-SearchBot\b/i],
  ['ChatGPT-User', /\bChatGPT-User\b/i],
  ['GPTBot', /\bGPTBot\b/i],
  ['Claude-SearchBot', /\bClaude-SearchBot\b/i],
  ['Claude-User', /\bClaude-User\b/i],
  ['ClaudeBot', /\bClaudeBot\b/i],
] as const;

function cacheControl(candidate: string) {
  if (/^_astro\/[^/]+\.[a-z0-9_-]{6,}\.(?:css|js)$/i.test(candidate)) return 'public, max-age=31536000, immutable';
  if (/\.(?:svg|png|jpe?g|webp|woff2?|otf)$/i.test(candidate)) return 'public, max-age=86400, stale-while-revalidate=604800';
  if (/^(?:robots\.txt|sitemap(?:-index|-\d+)?\.xml)$/i.test(candidate)) return 'public, max-age=300, must-revalidate';
  return 'public, max-age=0, must-revalidate';
}

function compressible(candidate: string) {
  return /\.(?:html?|css|js|json|xml|txt|svg)$/i.test(candidate);
}

function acceptsGzip(header: string) {
  return header.split(',').some((part) => {
    const [encoding, ...parameters] = part.trim().toLowerCase().split(';');
    if (encoding !== 'gzip' && encoding !== '*') return false;
    const quality = parameters.map((value) => value.trim()).find((value) => value.startsWith('q='));
    return quality ? Number(quality.slice(2)) > 0 : true;
  });
}

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
      const gzip = compressible(candidate) && acceptsGzip(request.headers.get('accept-encoding') ?? '');
      const headers = new Headers({ 'Cache-Control': cacheControl(candidate) });
      if (file.type) headers.set('Content-Type', file.type);
      if (gzip) {
        headers.set('Content-Encoding', 'gzip');
        headers.set('Vary', 'Accept-Encoding');
      } else {
        headers.set('Content-Length', String(file.size));
      }
      const body = request.method === 'HEAD'
        ? null
        : gzip
          ? file.stream().pipeThrough(new CompressionStream('gzip'))
          : file;
      return new Response(body, { headers });
    }
  }

  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-cache' } });
}

/**
 * Collapse public URL variants before serving content. CapRover terminates TLS in front of the
 * app, so prefer its forwarded host and protocol when they are present. Unknown/internal hosts
 * remain available for container health checks and local previews.
 */
export function canonicalRedirect(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const requestedHost = (forwardedHost ?? url.host).toLowerCase();
  const requestedHostname = requestedHost.replace(/:\d+$/, '');
  const requestedProtocol = (forwardedProtocol ?? url.protocol.replace(/:$/, '')).toLowerCase();
  const isPublicHost = requestedHostname === canonicalHostname || requestedHostname === `www.${canonicalHostname}`;

  if (!isPublicHost) return;

  let pathname = url.pathname;
  if (pathname === '/index.html') pathname = '/';
  else if (pathname.endsWith('/index.html')) pathname = pathname.slice(0, -'/index.html'.length) || '/';
  else if (pathname.endsWith('.html')) pathname = pathname.slice(0, -'.html'.length) || '/';

  const needsRedirect = requestedHostname !== canonicalHostname
    || requestedProtocol !== 'https'
    || pathname !== url.pathname;
  if (!needsRedirect) return;

  const destination = new URL(url);
  destination.protocol = 'https:';
  destination.hostname = canonicalHostname;
  destination.port = '';
  destination.pathname = pathname;
  return Response.redirect(destination, 308);
}

async function routeRequest(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname === '/healthz') return new Response('ok');

  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  if (pathname === '/api/subscribe') {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    return subscribe(request);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  return staticResponse(request);
}

/**
 * Emit a privacy-minimal record only for claimed OpenAI/Anthropic crawler user agents. This makes
 * crawler activity observable without retaining IP addresses, query strings or ordinary visits.
 * A user-agent match is not proof of crawler identity; verify published IP ranges where available.
 */
export async function handleRequest(request: Request) {
  const response = await routeRequest(request);
  const userAgent = request.headers.get('user-agent') ?? '';
  const crawler = crawlerAgents.find(([, pattern]) => pattern.test(userAgent))?.[0];
  if (crawler) {
    console.info(JSON.stringify({
      event: 'crawler_request',
      timestamp: new Date().toISOString(),
      crawler,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      identity: 'unverified_user_agent',
    }));
  }
  return response;
}

if (import.meta.main) {
  Bun.serve({
    port,
    hostname: '0.0.0.0',
    fetch: handleRequest,
  });

  console.log(`Normie Mode listening on port ${port}`);
}
