import type { UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/game-kintsugi/';

const config: UserConfig = {
  base,
  server: { host: '0.0.0.0', port: 5173 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kintsugi-levels',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
      manifest: {
        name: 'Kintsugi: The Art of Repair',
        short_name: 'Kintsugi',
        description: 'Restore broken bowls by rearranging colored glaze fragments and sealing their seams with gold.',
        theme_color: '#1a1814',
        background_color: '#1a1814',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        orientation: 'portrait-primary',
        scope: base,
        start_url: `${base}index.html`,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
};

export default config;
