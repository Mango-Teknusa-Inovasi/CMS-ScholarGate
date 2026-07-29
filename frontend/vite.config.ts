import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Production build → dist/ untuk deployment ke smage.my.id (terpisah dari Laravel)
// Dev: npm run dev (proxy ke :8000)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
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
})
