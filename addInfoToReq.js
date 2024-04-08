/**
 * 2024-03-29	Додає до запиту req загальні для всіх модулей налаштування
 * 		req.user.lang - мова "ua" / "en" / "ru"
 *		req.locals.homeDir - шлях до базової теки проекту (де app.js)
 *		req.locals.mainPug - шлях до базового шаблону main.pug
 */
const log = require("./tools/log.js");

module.exports = (req, res, next) => {
  // обєкт з локальною інформацією

  // шлях до базової теки проекту (де app.js)
  req.locals = {};
  req.locals.homeDir = __dirname;
  // шлях до базового шаблону main.pug
  req.locals.mainPug = req.locals.homeDir + "\\views\\main.pug";
  // милиця для  сумісності з попереднім кодом, при нагоді пропатчити код та видалити милицю
  req.info = {};
  req.info.homeDir = req.locals.homeDir;
  req.info.mainPug = req.locals.mainPug;
  let trace = 0,
    ln = "addInfoToReq.js::";
  trace
    ? log(
        "i",
        ln,
        `req.locals=`,
        req.locals,
        `;req.user.lang=`,
        req.user.lang,
        `;req.info=`,
        req.info
      )
    : null;
  next();
};
