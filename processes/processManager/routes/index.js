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
  const id = stepId == null ? "" : String(stepId).trim();
  try {
    const manager = req.entity && req.entity.processManager;
    if (!manager || typeof manager.start !== "function") {
      res.json({
        err: message("Немає програми", "No program", "Нет программы"),
        data: null,
      });
      return;
    }
    // Порожній stepId — крок 1. Інакше id на кшталт "st_1": номер дістає start().
    const stepN = id === "" ? 1 : id;
    log("w", ln, `start stepId=${id} stepN=${stepN}`);
    const result = await manager.start(stepN);
    res.json(result);
  } catch (error) {
    log("e", ln + (error && error.message ? error.message : error));
    res.json({ err: errorText(error), data: null });
  }
}

async function postStop(req, res) {
  const ln = `post("${req.originalUrl}")::`;
  try {
    log("w", ln, "stop");
    await req.entity.processManager.stop();
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
