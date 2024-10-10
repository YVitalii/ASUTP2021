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

class ClassLinearFunction {
  /** Розраховує коєф-ти лінійної функції
   * @param {Object} twoPoints={ x1: 50, y1: 0, x2: 100, y2: 100} - координати 2-х точок прямої
   * @returns {Object} = {k,a}
   */
  constructor(twoPoints) {
    let { x1, y1, x2, y2 } = twoPoints;
    this.k = x2 - x1 == 0 ? 0 : (y2 - y1) / (x2 - x1);
    this.a = y2 - this.k * x2;
  }
  get(x) {
    return this.k * x + this.a;
  }
  f(x) {
    return this.get;
  }
}

module.exports.getDateString = getDateString;
module.exports.toTimeString = toTimeString;
module.exports.ClassLinearFunction = ClassLinearFunction;

if (!module.parent) {
  let dummy = require("./dummy").dummyPromise;
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
  console.log(toTimeString(2 * 60 * 60 * 1000));

  (async () => {
    let start = new Date().getTime();
    let end = start + 10 * 1000;
    let y1 = 100,
      y2 = 500;
    let props = { x1: start, x2: end, y1, y2 };
    console.log(`props=${JSON.stringify(props)}`);
    let f = new ClassLinearFunction(props);
    console.log(`Linear function: k=${f.k}; a=${f.a}.`);
    for (let i = 0; i < 15; i++) {
      let now = new Date(),
        x = now.getTime();
      console.log(
        `Linear function: f(${x})= ${parseInt(f.get(x))}. duration = ${(
          (x - start) /
          1000
        ).toFixed(2)}`
      );
      await dummy();
    }
  })();
}
