import {defineConfig, loadEnv} from 'vite';
import {normalizeArePublicOrigin} from './src/config.ts';

export default defineConfig(({mode}) => {
  // Reject an unsafe or malformed destination during the build as well as at
  // browser startup. The generated storefront and the edge must agree on the
  // canonical ARE origin before a candidate is packaged.
  normalizeArePublicOrigin(loadEnv(mode, '.', 'VITE_').VITE_ARE_PUBLIC_ORIGIN);
  return {
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
  };
});
