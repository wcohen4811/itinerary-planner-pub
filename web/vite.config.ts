import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/health': 'http://localhost:3001',
      '/ping': 'http://localhost:3001',
      '/itineraries': 'http://localhost:3001',
      '/providers': 'http://localhost:3001',
      '/destinations': 'http://localhost:3001',
      '/ai': 'http://localhost:3001',
      '/admin': 'http://localhost:3001',
      '/pricing': 'http://localhost:3001',
      '/clients': 'http://localhost:3001',
      '/proposals': 'http://localhost:3001',
    },
  },
});
