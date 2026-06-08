import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure a single React instance is used everywhere (the repo root also has a
  // React copy); without this, deps like @auth0/auth0-react can load a second
  // React and trigger "Invalid hook call" crashes.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', '@auth0/auth0-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
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
