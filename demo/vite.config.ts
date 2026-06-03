import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@ant-design/icons')) return 'vendor-antd-icons'
          if (id.includes('/antd/')) return 'vendor-antd'
          if (id.includes('pixi-live2d-display') || id.includes('cubism') || id.includes('pixi.js')) {
            return 'vendor-live2d'
          }
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
            return 'vendor-react'
          }
          if (id.includes('zustand') || id.includes('immer')) return 'vendor-state'
          if (id.includes('posthog')) return 'vendor-analytics'
        }
      }
    }
  }
})
