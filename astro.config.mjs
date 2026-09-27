// @ts-check
import { defineConfig } from 'astro/config';

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
  vite: { plugins: [refreshAstroStyles] },
});
