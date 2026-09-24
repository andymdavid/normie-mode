// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://normiemode.example',
  trailingSlash: 'never',
  build: { format: 'file' },
});
