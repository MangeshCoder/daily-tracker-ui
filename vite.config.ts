import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    // Feature 8: PWA – Progressive Web App
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Employee Management System',
        short_name: 'EMS',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache API responses for offline use
        runtimeCaching: [ 
          {
            urlPattern: /^https?:\/\/localhost:7096\/api\/(dashboard|dailylog\/today|tasks\/today)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxAgeSeconds: 5 * 60 } // 5 minutes
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
});