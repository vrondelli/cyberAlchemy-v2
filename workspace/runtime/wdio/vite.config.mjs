import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "wdio-tauri-frontend-bootstrap",
      transformIndexHtml: {
        order: "pre",
        handler() {
          return [
            {
              tag: "script",
              attrs: {
                type: "module",
                src: "/wdio/frontend-bootstrap.ts",
              },
              injectTo: "head-prepend",
            },
          ];
        },
      },
    },
  ],
  resolve: { dedupe: ["react", "react-dom"] },
});
