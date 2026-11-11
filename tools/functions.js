// ------------ логгер  --------------------
const log = require("./log.js");
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null

/**
 * возвращает функцию f(x), которая вычисляет параболическую зависимость f(x),
 * парабола строится по двум точкам: x0;y0 - вершина параболы; x1;y1 - точка на параболе
 * например, f = getLinearRelation(20,30,1200,50)
 * при f(20)=30; при f(1200)=50;
 * @param {number} x0 вершина параболы
 * @param {number} y0 вершина параболы
 * @param {number} x1 точка на параболе
 * @param {number} y1 точка на параболе
 * @returns {function} функция параболической зависимости y от х
 */
function getParabolicRelation(x0, y0, x1, y1) {
  // ----------- настройки логгера локальные --------------
  let logN =
    logName +
    `getParabolicRelation(${x0.toFixed(2)},${y0.toFixed(2)},${x1.toFixed(
      2
    )},${y1.toFixed(2)}):`;
  let trace = 1;
  // -----------------------------

  let a = -(y0 - y1) / (x0 * x0 + x1 * x1 - 2 * x0 * x1);
  let c = y1 - a * x1 * x1 + 2 * a * x0 * x1;
  let b = -2 * a * x0;
  trace
    ? log(
        "w",
        logN,
        "; Коэфициенты параболы: ",
        "a=" + a.toFixed(6),
        "; b=" + b.toFixed(6),
        "; c=" + c.toFixed(6)
      )
    : null;
  return (t) => {
    return a * t * t + b * t + c;
  };
} // getParabolicRelation(x0, y0, x1, y1)

/**
 * возвращает функцию f(x)=getLinearRelation(x0,y0,x1,y1), которая вычисляет линейную зависимость f(x),
 * линия строится по двум точкам: где (x0,y0) (x1,y1) - точки на линии
 * например, f = getLinearRelation(20,30,1200,50)
 * при f(20)=30; при f(1200)=50;
 * @param {number} x0 точка 0
 * @param {number} y0 точка 0
 * @param {number} x1 точка 1
 * @param {number} y1 точка 1
 * @returns {function} функция линейной зависимости y от х
 */
function getLinearRelation(x0, y0, x1, y1) {
  // ----------- настройки логгера локальные --------------
  let logN =
    logName +
    `getLinearRelation(${x0.toFixed(2)},${y0.toFixed(2)},${x1.toFixed(
      2
    )},${y1.toFixed(2)}):`;
  let trace = 1;
  // -----------------------------
  var k = (y1 - y0) / (x1 - x0);
  var b = y0 - k * x0;
  trace ? log("w", logN, "k=", k.toFixed(4), "; b=", b.toFixed(4)) : null;
  return function (t) {
    return k * t + b;
  };
}

module.exports.getLinearRelation = getLinearRelation;
module.exports.getParabolicRelation = getParabolicRelation;
