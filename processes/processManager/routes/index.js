var express = require("express");
var router = express.Router();
const pug = require("pug");
const log = require("../../../tools/log.js");

/**
 * Шляхи з processes/processManager/vue/settings.js:
 * POST /process/state, /process/start, /process/stop.
 * Відповідь: { err, data }. Стан: data.content = processManager.getStates().
 * Старт: тіло { stepId }.
 */

function message(ua, en, ru) {
  return { ua, en, ru: ru || en };
}

function errorText(error) {
  const text = error && error.message ? error.message : String(error);
  return message(`Помилка: '${text}'`, `Error: '${text}'`, `Ошибка: '${text}'`);
}

function taskHasId(task, id) {
  if (!task || typeof task !== "object") return false;
  if (task.id != null && String(task.id) === id) return true;
  if (!Array.isArray(task.tasks)) return false;
  return task.tasks.some((child) => taskHasId(child, id));
}

/**
 * stepId з клієнта — id кроку. program.start чекає індекс у program.tasks.
 * Порожній stepId — старт з початку (крок 1, як у ClassProcessManager.start).
 * @returns {number|null}
 */
function stepNumber(manager, stepId) {
  const id = stepId == null ? "" : String(stepId).trim();
  const tasks = manager && manager.program && manager.program.tasks;
  if (id === "") return 1;
  if (Array.isArray(tasks)) {
    const index = tasks.findIndex((task) => taskHasId(task, id));
    if (index >= 0) return index;
  }
  if (/^\d+$/.test(id)) return parseInt(id, 10);
  return null;
}

function mountProcessApi(target) {
  target.post("/process/state", postState);
  target.post("/process/start", postStart);
  target.post("/process/stop", postStop);
}

function postState(req, res) {
  const ln = `post("${req.originalUrl}")::`;
  try {
    const manager = req.entity && req.entity.processManager;
    if (!manager || typeof manager.getStates !== "function") {
      res.json({
        err: message("Немає програми", "No program", "Нет программы"),
        data: null,
      });
      return;
    }
    res.json({ err: null, data: { content: manager.getStates() } });
  } catch (error) {
    log("e", ln + (error && error.message ? error.message : error));
    res.json({ err: errorText(error), data: null });
  }
}

async function postStart(req, res) {
  const ln = `post("${req.originalUrl}")::`;
  const stepId = req.body && req.body.stepId;
  try {
    const manager = req.entity && req.entity.processManager;
    const stepN = stepNumber(manager, stepId);
    if (stepN == null) {
      const id = stepId == null ? "" : String(stepId);
      res.json({
        err: message(
          `Крок "${id}" не знайдено`,
          `Step "${id}" was not found`,
          `Шаг "${id}" не найден`,
        ),
        data: null,
      });
      return;
    }
    log("w", ln, `start stepId=${stepId == null ? "" : stepId} stepN=${stepN}`);
    const result = await manager.start(stepN);
    res.json(result);
  } catch (error) {
    log("e", ln + (error && error.message ? error.message : error));
    res.json({ err: errorText(error), data: null });
  }
}

function postStop(req, res) {
  const ln = `post("${req.originalUrl}")::`;
  try {
    log("w", ln, "stop");
    req.entity.processManager.stop();
    res.json({ err: null, data: null });
  } catch (error) {
    log("e", ln + (error && error.message ? error.message : error));
    res.json({ err: errorText(error), data: null });
  }
}

mountProcessApi(router);

/* main page  */
router.get("/", function (req, res, next) {
  let trace = 1,
    ln = 'tests/server/routes/index.js::get("/")::';
  if (trace) {
    log("i", ln, `req.entity.id=`);
    console.dir(req.entity.id);
  }
  let html = req.entity.processManager.getFullHtml(req);
  let pageTitle = {
    ua: `${req.entity.fullName["ua"]} <br> <small>Тестувальник processManager</small>`,
    en: `${req.entity.fullName["en"]} <br> <small>Testing for the processManager</small>`,
    ru: `${req.entity.fullName["ru"]} <br> <small>Тестирование processManager</small>`,
  };
  res.send(pug.renderFile(req.locals.mainPug, { pageTitle, body: html }));
});

module.exports = router;
module.exports.mountProcessApi = mountProcessApi;
