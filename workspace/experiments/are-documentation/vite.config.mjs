import {defineConfig} from 'vite';
import {areChatPlugin} from './server/http.mjs';

export default defineConfig({build:{manifest:true},plugins: [areChatPlugin()], server: {host: '127.0.0.1', port: 4193, strictPort: true}, preview: {host: '127.0.0.1', port: 4193, strictPort: true}});
