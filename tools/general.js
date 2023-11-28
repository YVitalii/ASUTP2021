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

if (!module.parent) {
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
  console.log(toTimeString(2 * 60 * 60 * 1000));
}

module.exports.getDateString = getDateString;
module.exports.toTimeString = toTimeString;
