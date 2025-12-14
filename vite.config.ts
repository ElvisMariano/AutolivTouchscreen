import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    base: './',

    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    define: {
      'process.env': {
        MSAL_CLIENT_ID: env.MSAL_CLIENT_ID,
        MSAL_AUTHORITY: env.MSAL_AUTHORITY
      }
    }
  };
});
