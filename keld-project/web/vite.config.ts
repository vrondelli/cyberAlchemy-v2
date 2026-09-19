import {defineConfig} from 'vite';

export default defineConfig({
  base: '/',
  build: {
    manifest: true,
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  server: {
    host: '127.0.0.1',
    port: 4178,
    strictPort: true,
  },
});
