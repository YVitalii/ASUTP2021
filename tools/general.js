function getDateString(d) {
  let date;
  if (d) {
    date = new Date(d);
  } else {
    date = new Date();
  }
  //console.log(date);
  return (
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2)
  );
}

/**
 * Повертає час у форматі "ГГ:ХХ"
 * @param {Number} ticks - мс
 * @returns
 */
function toTimeString(ticks) {
  let t = new Date(ticks).toISOString();
  return t.slice(11, 16);
}

/** Розраховує коєф-ти лінійної функції
 * @param {Object} twoPoints={ x1: 50, y1: 0, x2: 100, y2: 100} - координати 2-х точок прямої
 * @returns {Object} = {k,a}
 */
function parseLinearFunction(twoPoints = { x1: 50, y1: 0, x2: 100, y2: 100 }) {
  let { x1, y1, x2, y2 } = twoPoints;
  let k = x2 - x1 == 0 ? 0 : (y2 - y1) / (x2 - x1);
  let a = y2 - k * x2;
  return { k, a };
}

module.exports.getDateString = getDateString;
module.exports.toTimeString = toTimeString;
module.exports.parseLinearFunction = parseLinearFunction;

if (!module.parent) {
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
  console.log(toTimeString(2 * 60 * 60 * 1000));
  let { k, a } = parseLinearFunction();
  console.log(`Linear function: k=${k}; a=${a}.`);
}
