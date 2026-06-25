import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
// Export a plain config object to avoid importing from 'vite'
export default ({}) => ({
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8082,
    origin: 'http://localhost:8082',
    hmr: {
      port: process.env.PORT ? parseInt(process.env.PORT) : 8082,
      clientPort: process.env.PORT ? parseInt(process.env.PORT) : 8082,
    },
    watch: {
      usePolling: true,
    },
    strictPort: true,
  },
  preview: {
    port: 8082,
    host: '0.0.0.0',
    strictPort: true,
  },
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'jspdf',
      'jspdf-autotable',
      'xlsx',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
  },
  define: {
    global: 'globalThis',
  },
});
