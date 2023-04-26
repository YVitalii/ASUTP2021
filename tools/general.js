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
 *
 * @param {*} value
 * @returns
 */

/**
 * проверяет строку на число, т.к. parseInt("12asd") возвращает 12
 * @param {String} value - тестируемая строка
 * @returns {Boolean} true/false
 */
function isInteger(value) {
  // источник https://overcoder.net/q/2602/%D0%B2%D1%81%D1%82%D1%80%D0%BE%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9-%D1%81%D0%BF%D0%BE%D1%81%D0%BE%D0%B1-%D0%B2-javascript-%D1%87%D1%82%D0%BE%D0%B1%D1%8B-%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D1%8C-%D1%8F%D0%B2%D0%BB%D1%8F%D0%B5%D1%82%D1%81%D1%8F-%D0%BB%D0%B8-%D1%81%D1%82%D1%80%D0%BE%D0%BA%D0%B0-%D0%B4%D0%BE%D0%BF%D1%83%D1%81%D1%82%D0%B8%D0%BC%D1%8B%D0%BC
  if (typeof value != "string") return false;
  return /^\d+$/.test(value);
}

if (!module.parent) {
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
}

module.exports.getDateString = getDateString;
module.exports.isInteger = isInteger;
