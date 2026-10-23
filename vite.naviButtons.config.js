import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const appRoot = path.resolve(__dirname, "vueComponents/naviButtons");

export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  base: "/src/naviButtons/",
  resolve: {
    alias: {
      "@": appRoot,
    },
  },
  build: {
    outDir: path.resolve(__dirname, "public/src/naviButtons"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(appRoot, "main.js"),
      output: {
        entryFileNames: "naviButtons.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames(info) {
          if (info.name && info.name.endsWith(".css")) {
            return "naviButtons.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
