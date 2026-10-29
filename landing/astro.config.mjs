import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// astro.config is evaluated before Astro injects import.meta.env, so the .env
// file must be loaded explicitly. Existing process env vars win over the file.
const envFile = fileURLToPath(new URL('.env', import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const site = process.env.PUBLIC_LANDING_URL ?? 'http://localhost:4321';
const apiTarget = process.env.PUBLIC_API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  site,
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/gracias') && !page.includes('/404'),
    }),
  ],
  vite: {
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  },
});
