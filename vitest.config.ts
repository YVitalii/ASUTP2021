// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom", // або 'jsdom' для емуляції браузера у Vue
    // Вказуємо запускати тести ТІЛЬКИ всередині потрібної теки
    include: [
      "./vueComponents/ProgramEditor/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
});
