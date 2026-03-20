import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/sandbox": {
        target: "https://api.sandbox.prodigi.com/v4.0",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sandbox/, ""),
      },
      "/api/production": {
        target: "https://api.prodigi.com/v4.0",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/production/, ""),
      },
      "/api/catalogue-proxy": {
        target: "https://product-api-app-live.azurewebsites.net/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalogue-proxy/, ""),
      },
    },
  },
});
