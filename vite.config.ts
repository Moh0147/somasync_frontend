import { fileURLToPath, URL } from 'node:url'

import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', not 'autoUpdate' -- a waiting service worker must never
      // take over silently mid-session (see src/sw.ts's message-based
      // skipWaiting). src/components/pwa/UpdatePrompt.tsx surfaces the
      // "A new version is available" banner and drives the actual update.
      registerType: 'prompt',
      // Enable the service worker in local development too, so installability
      // can be tested before deploying to production.
      devOptions: { enabled: true },
      // Custom service worker (src/sw.ts) instead of generateSW's
      // declarative config -- see that file for why: generateSW's
      // `navigateFallback` registers its NavigationRoute ahead of any
      // custom navigation runtimeCaching rule, which would silently
      // defeat "Network First" for navigation.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,webmanifest,woff,woff2}'],
      },
      manifest: {
        name: 'SomaSync',
        short_name: 'SomaSync',
        description: 'Offline-first school learning and assessment platform',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'soma-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'soma-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
