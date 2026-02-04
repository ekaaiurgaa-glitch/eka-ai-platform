import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy API calls to the Python backend during development
          '/api': {
            target: env.BACKEND_URL || 'http://127.0.0.1:8001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      build: {
        outDir: 'dist',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
