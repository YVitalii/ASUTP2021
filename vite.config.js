import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // Може знадобитися для resolution.alias

export default defineConfig({
  plugins: [vue()],
  root: "./devices/OWEN_MB110-8A/vue", // Вказуємо кореневу папку для Vite
  publicDir: path.resolve(__dirname, "public"), // Папка для статичних ресурсів
  build: {
    // Вказуємо точку входу для нашого Vue додатка
    rollupOptions: {
      outDir: path.resolve(__dirname, "public/vue-app"), // Папка, куди Vite буде збирати твій Vue-додаток
      emptyOutDir: true, // Очищати папку 'dist/vue-app' перед кожною збіркою
      input: "./main.js", // Або 'src/main.ts', якщо використовуєш TypeScript
      output: {
        // Визначаємо, як будуть називатися файли після збірки
        // 'entryFileNames': назва основного JS файлу
        // 'chunkFileNames': назва для асинхронно завантажуваних чанків
        // 'assetFileNames': назва для статичних ресурсів (CSS, шрифти, зображення)
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  resolve: {
    alias: {
      // Дозволяє використовувати @ як шлях до кореня src/, наприклад, @/components
      "@": path.resolve(__dirname, "./"),
    },
  },
});
