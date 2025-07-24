// src/main.js
import { createApp } from "vue";
import App from "../devices/OWEN_MB110-8A/vue/app.vue"; // Імпортуємо наш кореневий компонент

const app = createApp(App);

// Монтуємо додаток до елемента з id="vue-app" (або будь-якого іншого ID, який ти вибереш на своїй HTML-сторінці)
app.mount("#mb110_1"); // Змінити на ID елемента, де ти хочеш монтувати Vue додаток

console.log("Vue додаток запущено!");
