import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api/1.0': {
          target: 'https://autoliv-mx.leading2lean.com',
          changeOrigin: true,
          secure: false
        }
      }
    },
    base: './',

    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    define: {
      'process.env': {
        MSAL_CLIENT_ID: env.MSAL_CLIENT_ID,
        MSAL_AUTHORITY: env.MSAL_AUTHORITY,
        API_LEADING2LEAN_KEY: env.API_LEADING2LEAN_KEY,
        API_LEADING2LEAN_BASE_URL: mode === 'development'
          ? ''
          : (env.API_LEADING2LEAN_BASE_URL || '').trim()
      }
    }
  };
});
