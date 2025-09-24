// vitest.config.js

import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    // Вказуємо Vitest використовувати плагін для Vue
    vue(),
  ],

  test: {
    // Вказуємо папки, де потрібно шукати тести
    include: ["src/**/*.js", "src/**/*.test.js", "**/*_test.mjs"],
    // Налаштовуємо середовище
    environment: "happy-dom",
    // deps: {
    //   inline: ["@vue/test-utils"],
    // },
  },
});
