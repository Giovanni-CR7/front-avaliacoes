import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, /api/* vai para o back local. Troque a porta se o seu back usar outra.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://3.239.159.144:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});