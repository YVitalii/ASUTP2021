import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const appRoot = path.resolve(__dirname, "processes/processManager/vue");

export default defineConfig({
  plugins: [vue()],
  publicDir: false,
  base: "/src/processManager/",
  resolve: {
    alias: {
      "@": appRoot,
    },
  },
  build: {
    outDir: path.resolve(__dirname, "public/src/processManager"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(appRoot, "mount.js"),
      output: {
        entryFileNames: "processManager.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames(info) {
          if (info.name && info.name.endsWith(".css")) {
            return "processManager.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
