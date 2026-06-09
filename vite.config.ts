import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/my-voice/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      includeAssets: ['favicon.svg', 'icons/voice-180.png'],
      manifest: {
        name: 'My Voice',
        short_name: 'My Voice',
        description: 'Track your vocal range by recording your lowest and highest notes.',
        theme_color: '#0f766e',
        background_color: '#042f2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/my-voice/',
        scope: '/my-voice/',
        icons: [
          {
            src: 'icons/voice-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/voice-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/voice-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
