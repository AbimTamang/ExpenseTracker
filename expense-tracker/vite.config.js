import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'expensetracker.kushal-karki.com.np',
      '20.40.56.61',
      'localhost',
    ],
  },
})
