import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: true,
    watch: { ignored: ['**/docs/**', '**/mobile/**', '**/backups/**', '**/tmp/**'] },
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.API_PORT || 3001}`,
        ws: true,
      },
    },
  },
})
