/**
 * Емулятор сервера менеджера процесу для Vue-компонента.
 * Запуск: node ./processes/processManager/vue/tests/server.js
 * Маршрути беруться з settings.url. GET і POST state повертають програму TRM-251.
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { settings } from "../settings.js";
import createTRM251StepsManager from "../../../../devices/OWEN_TRM251/tests/createTRM251StepsManager.js";

/** "./process/state" → "/process/state" */
function expressPath(url) {
  const clean = String(url).replace(/^\.\//, "").replace(/^\//, "");
  return "/" + clean;
}

const steps = createTRM251StepsManager();
const app = express();
const endStatuses = ["finished", "stoped", "error"];

/** waiting → going → випадково finished, stoped або error. Далі статус не змінюється. */
function nextStepStatus(current) {
  if (current === "waiting") return "going";
  if (current === "going") {
    return endStatuses[Math.floor(Math.random() * endStatuses.length)];
  }
  return current;
}

function listLeafSteps(task, out = []) {
  if (!task || typeof task !== "object") return out;
  if (Array.isArray(task.tasks) && task.tasks.length) {
    for (const child of task.tasks) listLeafSteps(child, out);
    return out;
  }
  if (task.state && task.id != null && task.state._id != null) out.push(task);
  return out;
}

/**
 * Один POST рухає лише один крок, щоб going встигав бути на діаграмі.
 * Поточний going → випадковий кінцевий статус, наступний waiting → going.
 */
function advanceProgramSteps() {
  const tasks = steps.program && steps.program.tasks;
  if (!Array.isArray(tasks)) return;
  const leaves = [];
  for (const task of tasks) listLeafSteps(task, leaves);
  const changes = [];
  const going = leaves.find((step) => step.state._id === "going");
  if (going) {
    const next = nextStepStatus(going.state._id);
    going.state._id = next;
    changes.push(`${going.id}: ${next}`);
  }
  const waiting = leaves.find((step) => step.state._id === "waiting");
  if (waiting) {
    waiting.state._id = "going";
    changes.push(`${waiting.id}: going`);
  }
  if (changes.length) console.log("Статуси кроків:", changes.join(", "));
}

app.use(express.json());
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function sendState(req, res) {
  try {
    if (req.method === "POST") advanceProgramSteps();
    const content = steps.program.getState();
    res.json({ err: null, data: { content } });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    res.json({
      err: {
        ua: `Не вдалося отримати стан програми: ${message}`,
        en: `Failed to get program state: ${message}`,
      },
      data: null,
    });
  }
}

const routes = {
  state: sendState,
};

for (const [name, url] of Object.entries(settings.url)) {
  const handler = routes[name];
  if (typeof handler !== "function") continue;
  const route = expressPath(url);
  app.get(route, handler);
  app.post(route, handler);
}

const thisFile = fileURLToPath(import.meta.url);
const startedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === thisFile;

if (startedDirectly) {
  const port = Number(process.env.PORT) || 3044;
  const paths = Object.values(settings.url).map(expressPath).join(", ");
  app.listen(port, "127.0.0.1", () => {
    console.log(`Емулятор процесу: http://127.0.0.1:${port}${paths}`);
  });
}

export default app;
