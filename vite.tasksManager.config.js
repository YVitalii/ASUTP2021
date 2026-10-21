import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const appRoot = path.resolve(__dirname, "vueComponents/programEditor");

export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  base: "/src/tasksManager/",
  resolve: {
    alias: {
      "@": appRoot,
    },
  },
  build: {
    outDir: path.resolve(__dirname, "public/src/tasksManager"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(appRoot, "main.js"),
      output: {
        entryFileNames: "tasksManager.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames(info) {
          if (info.name && info.name.endsWith(".css")) {
            return "tasksManager.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
