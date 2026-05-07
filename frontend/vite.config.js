import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          markdown: ["react-markdown"],
        },
      },
    },
  },
  server: {
    hmr: {
      clientPort: 5174,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5046',
        changeOrigin: true,
      },
    },
  },
});
