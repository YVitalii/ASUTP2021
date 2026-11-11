/**
 * Перетворює число з BCD в Decimal
 * @param {Buffer} buf - буфер
 * @returns {Object} - {err:null,data:{value}} - результат при успіху
 */
module.exports.fromBCD = function (buf) {
  let res = { err: null, data: null };
  let ln = `fromBCD`;
  if (!Buffer.isBuffer(buf)) {
    res.err = new Error(
      ln + "::Argument must be Instance of Buffer but buf=" + `${buf}`
    );
    return res;
  }
  ln = ln + `(${buf.toString("hex")})::`;
  let str = buf.toString("hex");
  let n1000 = str[0] * 1000;
  let n100 = str[1] * 100;
  let n10 = str[2] * 10;
  let n1 = str[3] * 1;
  let value = n1000 + n100 + n10 + n1;
  if (isNaN(value)) {
    res.err = new Error(ln + "::Fail translate to Number");
  } else {
    res.data = { value };
  }
  // let trace = 0,
  //   ln = `fromBCD(0x${buf.toString("hex")}) = ${value}`;
  // trace ? console.log(ln) : null;
  return res;
};

/**
 * Повертає число val у вигляді BCD (15 => 0x0015)
 * @param {Integer} val
 * @returns {Object} {err:null,data:{data:Number}}
 */
module.exports.toBCD = function (val) {
  let res = { data: null, err: null };
  let v = parseInt(val, 10);
  let line = ("0000" + String(v)).slice(-4);
  let data = parseInt(line, 16);
  if (isNaN(v) || isNaN(data)) {
    res.err = new Error(`Can't translate to Number arg=${val}`);
  } else {
    res.data = { data };
  }
  let trace = 0,
    ln = `toBCD(${val})::`;
  if (trace && res.err) {
    console.log(ln + `res=`);
    console.dir(res);
  } else {
    trace
      ? console.log(ln + `0x${("000" + res.data.data.toString(16)).slice(-4)}`)
      : null;
  }

  //console.log("toBCD:"+line);
  return res;
};

/**
 *
 * @param {Buffer} buf - "[0x01,0x22]" = "01:22"
 * @returns {Object} {err:null,data:{value:хвилини}}
 */

module.exports.fromClock = function (buf) {
  //  преобразует Buffer ([hours,minutes]) ->  минуты
  let ln = `fromClock(${buf.toString("hex")})::`;
  let res = this.fromBCD(buf);
  if (res.err) {
    res.err.message = ln + res.err.message;
    return res;
  }
  let hrs = parseInt(res.data.value / 100);
  let mins = res.data.value - hrs * 100;
  let val = hrs * 60 + mins;
  if (isNaN(val)) {
    res.err = new Error(ln + `Can't translate to Number`);
  } else {
    res.data.value = val;
  }

  return res;
};

/**
 * Перетворює хвилини в Buffer ([hours,minutes])
 * наприклад 129 хв → [0x02,0x09]
 * @param {Number} val
 * @returns {Buffer} - {err,data:{data:Number}}
 */
module.exports.toClock = function (val) {
  let ln = `toClock(${val})::`;
  let res = { data: null, err: null };
  val = parseInt(val, 10);
  if (isNaN(val)) {
    res.err = new Error(ln + `Can't translate to Number`);
    return res;
  }
  let hrs = parseInt(val / 60);
  let mins = val - hrs * 60;
  res = this.toBCD(hrs * 100 + mins);

  return res;
};
