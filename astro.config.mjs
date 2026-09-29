// @ts-check
import { defineConfig } from 'astro/config';
import { subscribe } from './server/index.ts';

/** @type {import('astro').AstroIntegration} */
const subscriptionDevRoute = {
  name: 'normie-subscription-dev-route',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/api/subscribe', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (typeof value === 'string') headers.set(key, value);
          else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
        }
        /** @type {RequestInit & { duplex: string }} */
        const requestInit = {
          method: 'POST', headers, body: Buffer.concat(chunks), duplex: 'half',
        };
        const result = await subscribe(new Request('http://localhost/api/subscribe', requestInit));
        response.statusCode = result.status;
        result.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await result.arrayBuffer()));
      });
    },
  },
};

/**
 * `astro dev` re-renders a page's markup when its .astro file changes, but keeps serving the
 * page's <style> block as it was when the server started. When an .astro file changes, drop every
 * cached module for it (including its ?astro&type=style parts) and reload the page.
 */
const refreshAstroStyles = {
  name: 'normie-refresh-astro-styles',
  apply: /** @type {const} */ ('serve'),
  /** @param {{ file: string, server: import('vite').ViteDevServer }} ctx */
  handleHotUpdate({ file, server }) {
    if (!file.endsWith('.astro')) return;
    // The legacy graph and each environment's graph have different node types; both have the same methods.
    /** @type {any[]} */
    const graphs = [server.moduleGraph, ...Object.values(server.environments ?? {}).map((e) => e.moduleGraph)].filter(Boolean);
    for (const graph of graphs) {
      for (const [id, mod] of graph.idToModuleMap) if (id === file || id.startsWith(`${file}?`)) graph.invalidateModule(mod);
    }
    server.ws.send({ type: 'full-reload' });
    return [];
  },
};

export default defineConfig({
  site: 'https://normiemode.example',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Hosting platforms serve the site under their own hostname; a static site has nothing to protect
  // by refusing unknown hosts, so accept any (`npm run serve` behind a proxy needs this).
  server: { allowedHosts: true },
  integrations: [subscriptionDevRoute],
  vite: { plugins: [refreshAstroStyles] },
});
