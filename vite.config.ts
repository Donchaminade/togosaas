import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

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
    plugins: [
      react(),
      tailwindcss(),
      injectSiteUrl(siteUrl),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          // Le bundle principal peut depasser la limite par defaut (2 Mo).
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // IIFE => sortie "sw.js" (en "es" + package "type:module", le SW
          // serait emis en "sw.mjs" alors que l'enregistrement vise "/sw.js").
          rollupFormat: 'iife',
        },
        includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'TogoSaaS — Hub SaaS du Togo',
          short_name: 'TogoSaaS',
          description:
            'Le hub qui recense, valorise et connecte toutes les solutions SaaS togolaises — gratuites et payantes.',
          lang: 'fr',
          dir: 'ltr',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          theme_color: '#006a4e',
          background_color: '#ffffff',
          categories: ['business', 'productivity', 'directory'],
          icons: [
            {src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
            {src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
            {src: '/pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable'},
            {src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
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
