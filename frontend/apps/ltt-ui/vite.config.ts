import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    lib: {
      entry: './src/bootstrap.tsx',
      formats: ['es'],
      fileName: () => 'ltt-ui.js',
    },
  },
});
