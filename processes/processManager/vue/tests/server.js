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

function sendState(_req, res) {
  try {
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
