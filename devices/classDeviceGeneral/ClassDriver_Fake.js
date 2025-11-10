// const ClassDriverGeneral = require("./ClassDriverGeneral");

function makeFake(driver = {}) {
  let trace = 0,
    ln = `ClassDriver_Fake.js::makeFake(${driver.id})::`;
  if (typeof driver.regs != "object") {
    throw new Error(ln + "Need have [driver.regs] for making fake. ");
  }
  if (!driver.regs instanceof Map) {
    throw new Error(ln + "[driver.regs] must be instance of [Map]! ");
  }
  driver.offline = false;
  driver.ln = driver.ln ? driver.ln : driver.id + "_fake::";
  // перевизначаємо всі функції
  driver.regs.forEach((value, key, map) => {
    let reg = value;
    trace ? console.log(ln + `key=` + key) : null;
    reg._set = (val = 0) => {
      return val;
    };
    reg.set_ = function (val = 0) {
      this.value = val;
      return val;
    };
    reg._get = function (val = 0) {
      return this.value;
    };
    reg.get_ = function (val = 0) {
      return this.value;
    };
    reg.value = null;
  });

  /**
   * Імітація запиту зчитування значення регістру
   * @param {*} iface -заглушка
   * @param {*} addr - заглушка
   * @param {*} regName - id регістру
   * @param {*} cb(err,data), де data=[{regName,value,note,detail:{request,response,..}}]
   */
  driver.getReg = async function (iface = 0, addr = 0, regName, cb) {
    let trace = 0,
      ln =
        this.ln +
        `getReg(${
          iface.id ? iface.id : "fakeIface"
        },addr=${addr},regName=${regName})::`;
    trace ? console.log("i", ln, `Started`) : null;
    // перевіряємо та отримуємо посилання на регістр
    let reg;
    try {
      reg = this.testRequest({ iface, regName });
    } catch (error) {
      cb(error, null);
      return;
    }
    // формуємо відповідь
    let data = {
      regName,
      value: reg.get_(reg.value),
      note: reg.note ? reg.note : "",
      detail: { request: "fake driver" },
    };
    let err = this.isOffline();
    process.nextTick(() => {
      cb(err, data);
    });
  };

  // getRegPromise(props = undefined){
  //    return new Promise(function (resolve, reject) {
  //     if (!props) {
  //         reject(new Error(ln + "props must be defined!"));
  //       }
  //    })
  // };

  /**
   * Імітація запиту запису значення регістру
   * @param {*} iface -заглушка
   * @param {*} addr - заглушка
   * @param {String} regName - id регістру
   * @param {Number} value - значення регістру
   * @param {*} cb(err,data), де data=[{regName,value,note,detail:{request,response,..}}]
   */
  driver.setReg = function (
    iface = 0,
    addr = 0,
    regName = "",
    value = null,
    cb
  ) {
    let trace = 0,
      ln = this.ln + `setReg(${iface.id},${addr},${regName})::`;

    if (value === null)
      throw new Error(ln + `Value must be defined!!? But value=${value}`);
    let reg;
    try {
      reg = this.testRequest({ iface, regName });
    } catch (error) {
      cb(error, null);
      return;
    }
    // формуємо відповідь
    let data = {
      regName,
      value: reg.set_(value),
      note: reg.note ? reg.note : "",
      detail: { request: "fake driver" },
    };
    let err = this.isOffline();
    if (err != null) {
      reg.value = data.value;
    }
    process.nextTick(() => {
      cb(err, data);
    });
  };

  /**
   * Перевіряє коректність запиту
   * @param {Object} args
   * @param {String} args.regName - назва регістру
   * @returns {Object} потрібний регістр або throw Error
   */
  driver.testRequest = function (args = {}) {
    if (!this.regs.has(args.regName)) {
      throw new Error(ln + `Not found register [${regName}]`);
    }
    return this.regs.get(args.regName);
  };

  /**
   * Для емуляції стану коли прилад не відповідає.
   * @returns Error = offline || null = online
   */
  driver.isOffline = function () {
    if (this.offline) {
      let messages = {
        ua: `Помилка timeout`,
        en: `Timeout error`,
        ru: `Ошибка Timeout.`,
      };
      let err = new Error(messages.ua);
      err.code = 13;
      err.messages = messages;
      return err;
    }
    return null;
  }; // driver.checkOffline()

  driver.setOffline = function (val) {
    this.offline = val ? true : false;
    return this.offline;
  };
} // function makeFake

module.exports = makeFake;

// class ClassDriverFake {
//   constructor(props = {}) {
//     if (!props.driver) {
//       throw new Error("Driver should be received")
//     }
//     // this=driver;
//     // super(props);
//     this.iface = () => {
//       return 1;
//     };
//   }
//   addRegister(props) {
//     // якщо props - масив, то додаємо кожен елемент масиву
//     if (Array.isArray(props)) {
//       let arr = [];
//       for (let i = 0; i < props.length; i++) {
//         // рекурсивно додаємо кожен елемент масиву
//         let res = this.addRegister(props[i]);
//         // реєструємо результат
//         arr.push(res);
//       }
//       return arr;
//     }
//     props._set =
//       typeof props._set == "function"
//         ? props._set
//         : () => {
//             return true;
//           };
//     props.set_ =
//       typeof props.set_ == "function"
//         ? props.set_
//         : (val) => {
//             return val;
//           };
//     props._get =
//       typeof props._get == "function"
//         ? props._set
//         : () => {
//             return true;
//           };
//     props.get_ =
//       typeof props.get_ == "function"
//         ? props.get_
//         : (val) => {
//             return val;
//           };
//     super.addRegister(props);
//     for (const key in this.regs) {
//       if (!Object.hasOwn(this.regs, key)) continue;
//       this.regs[key].value = null;
//     } // for in
//   } // addRegister

// } // class

// module.exports = ClassDriverFake;
