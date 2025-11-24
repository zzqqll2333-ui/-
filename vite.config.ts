import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // This allows us to see 'API_KEY' from .env files locally.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Get the key from the system environment (Vercel) OR the loaded .env file
  const apiKey = process.env.API_KEY || env.API_KEY;

  // Log status during build (Visible in Vercel Build Logs)
  console.log(`[Vite Build] API Key check: ${apiKey ? 'Present (Injecting...)' : 'MISSING'}`);

  return {
    plugins: [react()],
    // This is critical. It replaces 'process.env.API_KEY' in the client-side code 
    // with the actual string value found at BUILD time.
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-genai': ['@google/genai'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});