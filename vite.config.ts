import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // 1. Force the server to use port 5173 to fix the WebSocket error
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
    // 2. Map the correct environment variable
    define: {
      // We take 'GEMINI_API_KEY' from the file and expose it as 'process.env.API_KEY' to the app
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY) 
    },
    build: {
      outDir: 'dist',
    }
  };
});