import { createApp } from "vue";
import ProcessManager from "./ProcessManager.vue";

const container = document.getElementById("processManager");
if (container) {
  createApp(ProcessManager).mount(container);
} else {
  console.error("Контейнер #processManager не знайдено.");
}
