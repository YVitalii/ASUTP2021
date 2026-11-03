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
/** Індекс кроку, з якого йде програма. null — старт ще не натискали або програму зупинено. */
let runFrom = null;
/** Перший POST /state після старту лише віддає щойно ввімкнений стан. */
let holdAdvance = false;

/** going → випадково finished, stoped або error. Останній крок завжди finished. */
function nextStepStatus(isLast) {
  if (isLast) return "finished";
  return endStatuses[Math.floor(Math.random() * endStatuses.length)];
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

function programLeaves() {
  const tasks = steps.program && steps.program.tasks;
  const leaves = [];
  if (!Array.isArray(tasks)) return leaves;
  for (const task of tasks) listLeafSteps(task, leaves);
  return leaves;
}

const waitingNote = { ua: "Очікування", en: "Waiting", ru: "Ожидание" };

/** Поки програма going, duration = now − startTime. Після stop/finished значення лишається. */
function countDuration() {
  if (steps.program && typeof steps.program.duration === "function") {
    steps.program.duration();
  }
}

/** Крок після старту знову очікує: статус, час і тривалість. */
function resetStep(step) {
  if (!step || !step.state) return;
  step.state._id = "waiting";
  step.state.note = { ...waitingNote };
  step.state.startTime = null;
  step.state.duration = "00d00:00:00";
  step.currentDuration = 0;
}

/**
 * Після старту один POST /state рухає один крок від runFrom.
 * Поточний going → кінцевий статус, наступний waiting → going.
 * Останній крок стає finished, і стан програми теж.
 */
function advanceProgramSteps() {
  if (runFrom == null) return;
  const leaves = programLeaves();
  const slice = leaves.slice(runFrom);
  const goingIndex = slice.findIndex((step) => step.state._id === "going");
  if (goingIndex < 0) return;
  const going = slice[goingIndex];
  const absolute = runFrom + goingIndex;
  const isLast = absolute >= leaves.length - 1;
  const changes = [];
  if (isLast) {
    countDuration();
    going.state._id = "finished";
    changes.push(`${going.id}: finished`);
    if (steps.program.state) steps.program.state._id = "finished";
    runFrom = null;
    console.log("Статуси кроків:", changes.join(", "), "програма: finished");
    return;
  }
  const nextStatus = nextStepStatus(false);
  going.state._id = nextStatus;
  changes.push(`${going.id}: ${nextStatus}`);
  const next = slice[goingIndex + 1];
  if (next && next.state._id === "waiting") {
    next.state._id = "going";
    changes.push(`${next.id}: going`);
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
    if (req.method === "POST") {
      if (holdAdvance) holdAdvance = false;
      else advanceProgramSteps();
    }
    if (steps.program.state && steps.program.state._id === "going") countDuration();
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

function sendStart(req, res) {
  try {
    if (req.method !== "POST") {
      res.json({ err: null, data: null });
      return;
    }
    const stepId = req.body && req.body.stepId != null ? String(req.body.stepId) : "";
    const leaves = programLeaves();
    let index = leaves.findIndex((step) => String(step.id) === stepId);
    if (index < 0) index = 0;
    const step = leaves[index];
    if (step && step.state) step.state._id = "going";
    for (let i = index + 1; i < leaves.length; i++) resetStep(leaves[i]);
    if (steps.program.state) {
      steps.program.state._id = "going";
      steps.program.state.startTime = new Date();
      countDuration();
    }
    runFrom = index;
    holdAdvance = true;
    console.log("Старт програми, stepId:", step ? step.id : stepId);
    res.json({ err: null, data: { stepId: step ? String(step.id) : stepId } });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    res.json({ err: { ua: message, en: message }, data: null });
  }
}

function sendStop(req, res) {
  try {
    if (req.method !== "POST") {
      res.json({ err: null, data: null });
      return;
    }
    if (steps.program.state && steps.program.state._id === "going") countDuration();
    if (steps.program.state) steps.program.state._id = "stoped";
    runFrom = null;
    holdAdvance = false;
    console.log("Стоп програми");
    res.json({ err: null, data: null });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    res.json({ err: { ua: message, en: message }, data: null });
  }
}

const routes = {
  state: sendState,
  start: sendStart,
  stop: sendStop,
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
