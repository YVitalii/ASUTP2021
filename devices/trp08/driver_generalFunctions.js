/**
 * Перетворює BCD формат в число 0x0158 -> 158
 * @param {Buffer / Number} buf
 * @returns {Number} - число
 */
function fromBCD(buf) {
  let str = "";
  if (Buffer.isBuffer(buf)) {
    str = buf.toString("hex");
  } else if (typeof buf == "number") {
    str = ("0000" + buf.toString(16)).slice(-4);
  } else {
    throw new RangeError("Argument should be buffer or number");
  }
  let n1000 = str[0] * 1000;
  let n100 = str[1] * 100;
  let n10 = str[2] * 10;
  let n1 = str[3] * 1;
  let res = n1000 + n100 + n10 + n1;
  //console.log("T="+res+"C");
  return res;
}

/**
 * Перетворює число в BCD-формат 158 -> 0x0158
 * @param {Number} val
 * @returns {Number}
 */
function toBCD(val) {
  if (typeof val != "number") {
    throw new RangeError("Argument should be a number");
  }
  let line = ("0000" + String(val)).slice(-4);
  let arr;
  try {
    arr = parseInt(line, 16);
  } catch (error) {
    arr = null;
  }
  //console.log("toBCD:"+line);
  return arr;
}

/**
 * Перетворює з Clock формату в кількість хвилини 0xHHMM => 0x0120 => 60+20=80 minutes
 * @param {Buffer || Number } buf
 * @returns {Number} - кількість хвилин
 */
function fromClock(buf) {
  //  преобразует Buffer ([hours,minutes]) ->  минуты
  if (!Buffer.isBuffer(buf) && typeof buf != "number") {
    throw new RangeError("Argument should be buffer or number");
  }
  let val = fromBCD(buf);
  let hrs = parseInt(val / 100);
  let mins = val - hrs * 100;
  return hrs * 60 + mins;
}

function toClock(val) {
  if (typeof val != "number") {
    throw new RangeError("Argument should be a number");
  }
  // преобразует минуты -> Buffer ([hours,minutes]) например 01:22 = [0x01,0x22]
  let hrs = parseInt(val / 60);
  let mins = val - hrs * 60;
  let b = toBCD(hrs * 100 + mins); // преобразуем в десятичное число , где часы - сотни, минуты -десятки и единицы
  //console.log("toClock input=",val,", output=",b,", buffer",new Buffer([b]));
  // ------------- нужно ВОЗВРАЩАТЬ ЧИСЛО ----------------
  return b;
}

module.exports.fromBCD = fromBCD;
module.exports.toBCD = toBCD;
module.exports.fromClock = fromClock;
module.exports.toClock = toClock;
