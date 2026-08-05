import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // API calls go to the Express server during local development.
      '/api': 'http://localhost:3000',
    },
  },
})
