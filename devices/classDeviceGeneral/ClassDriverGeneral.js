/** типовий драйвер приладу */

// запуск тестів
// mocha  ../tests/t_createDriverGeneral.js -w
const log = require("../../tools/log");

const ClassGeneral = require("../../ClassGeneral");
const ClassDriverRegisterGeneral = require("./ClassDriverRegisterGeneral");

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
  // -------------------------- getReg callback ---------------------------
  /** Функція зчитування 1 регістру з приладу
   * @param iface {module} -  налаштований та підготовлений об'єкт, який займається взаємодією з фізичними приладами має містити функції send = addTask (див RS485_v200.js)
   * @param id {integer} - адрес приладу в iface
   * @param regName {String} - назва регистру, як визначено в regs
   * @returns cb {callback} (err,data), де data = Array [{regName,value,note,timestamp},...]
   */
  getReg(iface, addr, regName, cb) {
    let trace = 0,
      ln = this.ln + `getReg(${iface.id},${addr},${regName})::`;
    //trace ? log('i',ln,`Started`) : null;
    // if (trace) {
    //   log("i", ln, `this=`);
    //   console.dir(this);
    // }
    if (!(typeof iface === "object" && typeof iface.send === "function")) {
      throw new Error(ln + `iface.send must be an async function!`);
    }
    if (!this.has(regName)) {
      throw new Error(ln + `regName=${regName} not defined!`);
    }
    let reg = this.regs.get(regName); // посилання на регістр
    let res = { regName, value: null }; // обєкт відповіді
    let req = reg._get(); // обєкт запиту
    req.timeout = this.timeout;
    req.id = addr;
    iface.send(req, function (err, data) {
      if (err) {
        trace ? log("e", ln, err) : null;
        return cb(err, data);
      }
      trace ? log("", ln, `data=${data}`) : null;
      res.value = reg.get_(data);
      return cb(null, [res]);
    });
  } //getReg(iface, addr, regName, cb)
};
