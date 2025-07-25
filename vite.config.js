import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // Може знадобитися для resolution.alias
import fs from "fs"; // Для роботи з файловою системою, якщо потрібно
let trace = 1,
  ln = __filename + "::";
// *** НОВИЙ КОД: Визначення кореневої директорії для розробки ***
// `process.env.VITE_APP_ROOT` - це змінна оточення, яку ми будемо встановлювати
// Якщо змінна не встановлена, за замовчуванням буде корінь всього проєкту або 'devices/mb110/vue'
trace
  ? console.log(ln, `process.env.VITE_APP_ROOT=${process.env.VITE_APP_ROOT}`)
  : null;
const CURRENT_VUE_APP_ROOT = process.env.VITE_APP_ROOT
  ? path.resolve(__dirname, process.env.VITE_APP_ROOT)
  : path.resolve(__dirname, "./"); // Дефолтний корінь - поточна директорія
const vueEntryPoints = {
  device_mb110: path.resolve(
    __dirname,
    "./devices/OWEN_MB110-8A/vue",
    "main.js"
  ),
};

if (trace) {
  console.log(ln + `vueEntryPoints=`);
  console.dir(vueEntryPoints);
}

export default defineConfig(
  ({ command }) => {
    const config = {
      plugins: [vue()],
      publicDir: path.resolve(__dirname, "public"), // Папка для статичних ресурсів
      resolve: {
        alias: {
          // Alias '@' буде вказувати на кореневу папку Vue-додатка, що розробляється
          // Або на корінь всього проєкту під час збірки
          "@": CURRENT_VUE_APP_ROOT,
        },
      },
      server: {
        // Якщо потрібен проксі, його можна додати тут
        proxy: {
          "/entity": {
            target: "http://localhost:3033",
            changeOrigin: true,
            secure: false,
            // rewrite: (path) => path.replace(/^\/api/, ""),
          },
        },
      },
    };
    // *** Конфігурація для режиму розробки (`vite dev`) ***
    if (command === "serve") {
      config.root = CURRENT_VUE_APP_ROOT; // Встановлюємо root для dev сервера
      // Для dev сервера ми не використовуємо rollupOptions.input
      // Він автоматично шукає index.html у кореневій папці
    }

    // *** Конфігурація для режиму збірки (`vite build`) ***
    if (command === "build") {
      config.build = {
        outDir: path.resolve(__dirname, "dist/vue-apps"), // Загальна папка для всіх скомпільованих Vue-додатків
        emptyOutDir: true,
        rollupOptions: {
          input: vueEntryPoints, // Використовуємо динамічно знайдені точки входу для збірки всіх бандлів
          output: {
            entryFileNames: `[name]/[name].js`,
            chunkFileNames: `[name]/[name]-chunks.js`,
            assetFileNames: `[name]/assets/[name].[ext]`,
          },
        },
      };
    }
    console.log("Vite config for Vue app:");
    console.dir(config);
    return config;
  } //export default defineConfig({
);
