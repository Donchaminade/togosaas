import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

function injectSiteUrl(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/$/, '');
  return {
    name: 'inject-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', base);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl =
    env.VITE_SITE_URL ||
    (mode === 'production' ? 'https://togosaas.vercel.app' : 'http://localhost:3000');

  return {
    plugins: [react(), tailwindcss(), injectSiteUrl(siteUrl)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
