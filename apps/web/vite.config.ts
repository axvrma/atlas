import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@xyflow') || id.includes('dagre')) return 'graph';
        },
      },
    },
  },
  server: { fs: { allow: ['../..'] } },
});
