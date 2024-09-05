/** типовий драйвер приладу */

// запуск тестів
// mocha  ../tests/t_createDriverGeneral.js -w
const log = require("../../tools/log");

const ClassGeneral = require("../../ClassGeneral");
const ClassDriverRegisterGeneral = require("./ClassDriverRegisterGeneral");
const { setRegPromise } = require("../trp08/driver");

module.exports = class ClassDriverGeneral extends ClassGeneral {
  constructor(props) {
    super(props);

    // ---- timeout ----------
    this.timeout = props.timeout ? props.timeout : 1000;

    // обєкт зі списком регістрів
    this.regs = new Map();
  } //constructor

  /** true якщо регістр regName є в списку регістрів
   * @param {String} regName - id регістру
   */
  has(regName) {
    return this.regs.has(regName);
  }

  /**
   * Додає новий регістр до переліку регістрів
   * @param {*} props
   * @returns  Object of ClassDriverRegisterGeneral - при успішній операції, повертає створений регістр
   */
  addRegister(props) {
    let ln = this.ln + `addRegister(${props.id})` + "::",
      trace = 0;
    let reg = new ClassDriverRegisterGeneral(props);
    // if (trace) {
    //   log("i", ln, `reg=`);
    //   console.dir(reg);
    // }
    if (this.has(reg.id)) {
      throw new Error(
        `Register ${reg.id} alredy was declared! Try different "id".`
      );
    }
    this.regs.set(reg.id, reg);
    return reg;
  }
  /**
   * Функція перевіряє корректність запитів до getReg та setReg
   * Наразі це:  iface та regName
   * @param {Object} args
   * @param {Object} args.iface - instance of iface (must has method send())
   * @param {String} args.regName - valid regName
   * @returns {instance of DriverRegGeneral | Error} - this.regs.get(regName) / Error()
   */
  testRequest(args) {
    let trace = 0,
      ln = this.ln + `testRequest()::`;
    if (trace) {
      log("i", ln, `args=`);
      console.dir(args);
    }
    if (args === undefined) {
      throw new Error(ln + `args must be defined!`);
    }
    let iface = args.iface;
    let regName = args.regName;
    if (!(typeof iface === "object" && typeof iface.send === "function")) {
      throw new Error(ln + `iface.send must be an async function!`);
    }
    if (!this.has(regName)) {
      throw new Error(ln + `regName=${regName} not defined!`);
    }
    return this.regs.get(regName);
  }

  // -------------------------- getReg callback ---------------------------
  /** Функція зчитування 1 регістру з приладу
   * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
   * @param addr {integer} - адрес приладу в iface
   * @param regName {String} - назва регистру, як визначено в regs
   * @return cb {callback} (err,data), де data = Array [{regName, value, note, detail:{request,response,afterGet}},...]
   */
  getReg(iface, addr, regName, cb) {
    let trace = 0,
      ln = this.ln + `getReg(${iface.id},${addr},${regName})::`;
    trace ? log("i", ln, `Started`) : null;
    // if (trace) {
    //   log("i", ln, `this=`);
    //   console.dir(this);
    // }

    let reg = this.testRequest({ iface, regName }); // посилання на регістр
    // обєкт запиту
    let { err, data } = reg._get();
    if (err) {
      cb(err, data);
      return;
    }
    let req = data;
    req.timeout = this.timeout;
    req.id = addr;
    req.timestamp = new Date().getTime();
    // обєкт відповіді
    let res = { regName, value: null, detail: { request: req } };
    // запит
    iface.send(req, function (err, data) {
      if (err) {
        trace ? log("e", ln, err) : null;
        return cb(err, res);
      }
      trace ? log("", ln, `data=`, data) : null;
      res.detail.response = data;
      let afterGet = reg.get_(data);
      if (afterGet.err) {
        return cb(afterGet.err, res);
      }
      res.detail.afterGet = afterGet.data;
      res.value = afterGet.data.value;
      res.note = afterGet.data.note;
      return cb(null, [res]);
    });
  } //getReg(iface, addr, regName, cb)

  /** Промісифікована функція getReg() - див. її опис
   * @prop {Object} props - об'єкт з даними, що потрібні асинхронній функції {iface,addr,regName}
   * @returns {Ppomise}
   */
  getRegPromise(props = undefined) {
    let environ = this;
    return new Promise(function (resolve, reject) {
      let trace = 0,
        ln = environ.ln + `getRegPromise`;
      if (trace) {
        log("i", ln, `::environ=`);
        console.dir(environ);
      }
      if (!props) {
        reject(new Error(ln + "props must be defined!"));
      }
      ln += `(iface=${props.iface.id};id=${props.id};regName=${props.regName})::`;
      trace ? log("i", ln, `Started`) : null;

      // call function

      environ.getReg(props.iface, props.addr, props.regName, (err, data) => {
        if (err) {
          if (trace) {
            log("i", ln, `err=`);
            console.dir(err);
          }
          reject(err);
          return;
        }
        if (trace) {
          console.log(ln, "data=");
          console.dir(data);
        }
        resolve(data);
        return;
      });
    }); // getReg
  } //getRegPromise(props)

  // -------------------------- setReg callback ---------------------------
  /** Функція запису регістру в прилад
   * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
   * @param addr {String|Number} - адреса приладу в iface
   * @param regName {String} - назва регистру, як визначено в regs
   * @param value {String|Number} - значення, що потрібно записати
   * @returns cb {callback} (err,data), де data = {regName,value,note,detail:{duration,request,response,afterSet}}
   */
  setReg(iface, addr, regName, value, cb) {
    let trace = 0,
      ln = this.ln + `setReg(${iface.id},${addr},${regName}):`;
    let reg = this.testRequest({ iface, regName });
    // запит
    if ((value === undefined) | (value === null)) {
      throw new Error(ln + `value must be defined`);
    }
    let beforeSet = reg._set(value);
    if (beforeSet.err != null) {
      cd(beforeSet.err, null);
    }

    let req = beforeSet.data;
    req.timeout = this.timeout;
    req.id = addr;

    // шаблон відповіді
    let res = {
      regName: reg.id,
      detail: {
        timeStart: new Date().getTime(),
        request: req,
      },
    };
    iface.send(req, function (err, data) {
      if (err) {
        return cb(err, res);
      }
      res.detail.response = data;
      res.detail.afterSet = reg.set_(data);
      if (res.detail.afterSet.err) {
        return cb(res.detail.afterSet.err, null);
      }
      res.value = res.detail.afterSet.data.value;
      res.note = res.detail.afterSet.data.note;
      res.detail.duration =
        (new Date().getTime() - res.detail.timeStart) / 1000;
      return cb(null, res);
    });
  } // setReg(

  /** Промісифікована функція setReg() - див. її опис
   * @prop {Object} props - об'єкт з даними, що потрібні асинхронній функції {iface,id,regName,value}
   * @returns {Ppomise}
   */
  setRegPromise(props) {
    let environ = this;
    return new Promise(function (resolve, reject) {
      let trace = 0,
        ln = environ.ln + `setRegPromise`;
      if (!props) {
        reject(new Error(ln + "props must be defined!"));
      }
      ln += `(iface=${props.iface.id};id=${props.id};regName=${props.regName})::`;
      trace ? log("i", ln, `Started`) : null;
      environ.setReg(
        props.iface,
        props.addr,
        props.regName,
        props.value,
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(data);
        }
      ); //this.setReg
    });
  } //async setRegPromise

  getRegInfo(regName, headers) {
    if (!this.has(regName)) {
      return undefined;
    }
    let reg = this.regs.get(regName),
      l = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i].split(".");
      let val = key.length > 1 ? reg[key[0]][key[1]] : reg[key[0]];
      l[headers[i]] = val != undefined ? val : "???";
    }
    return l;
  } //getRegInfo(regName){

  printRegsDescription() {
    let table = [],
      headers = ["id", "addr", "units.en", "header.en", "comment.en"];
    for (let key of this.regs.keys()) {
      let line = this.getRegInfo(key, headers);
      if (line) {
        table.push(line);
      }
    }
    console.table(table);
  }
}; //class ClassDriverGeneral
