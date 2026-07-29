import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
      manifest: false, // We already have manifest.json in public/
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/api/, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
        importScripts: ['/push-sw.js'],
        cleanupOutdatedCaches: true,
      }
    })
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          motion: ['motion/react'],
          icons: ['lucide-react'],
        }
      }
    }
  }
})
