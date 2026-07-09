import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Production build → Laravel public/spa (satu document root untuk shared hosting)
// Dev: npm run dev (proxy ke :8000)
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Asset base path when served by Laravel as /spa/...
  base: command === 'build' ? '/spa/' : '/',
  build: {
    outDir: '../backend/public/spa',
    emptyOutDir: true,
    manifest: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/install': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/robots.txt': { target: 'http://localhost:8000', changeOrigin: true },
      '/sitemap.xml': { target: 'http://localhost:8000', changeOrigin: true },
      '/llms.txt': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
}))
