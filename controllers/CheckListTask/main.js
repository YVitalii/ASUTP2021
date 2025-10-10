// src/main.js
import { createApp } from "vue";

import App from "./app.vue"; // Імпортуємо наш кореневий компонент
const containerClass = "CheckListContainer";
const containers = document.querySelectorAll(`.${containerClass}`); // Знаходимо всі елементи з класом "MB110A8"
if (containers.length === 0) {
  console.error(`Контейнери з класом "${containerClass}" не знайдено.`);
}

containers.forEach((container) => {
  // Отримуємо унікальний id поточного контейнера
  const containerId = container.id;

  if (containerId) {
    // Створюємо новий екземпляр застосунку Vue для кожного контейнера
    const app = createApp(App, {
      // Передаємо id як властивість (props) до кореневого компонента
      containerId: containerId,
    });

    // Монтуємо застосунок до знайденого DOM-елемента
    app.mount(container);
    console.log(`Застосунок Vue змонтовано до #${containerId}`);
  } else {
    console.error(
      `Знайдено контейнер без id. Vue застосунок не буде змонтовано.`
    );
  }
});

console.log("Vue додаток запущено!");
