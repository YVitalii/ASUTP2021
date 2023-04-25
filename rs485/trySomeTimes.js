/*  --------- мисссия   -----------------
    пытается получить положительный ответ от функции tryFunc(args,cb), повторяя ее вызов times раз
    между попытками делает перерыв nextTick
    при первой удачной попытке вызывает finish (null,data) при неудачной cb(err)

*/
const log = require("../tools/log.js"); // логер
let logName = "<" + __filename.replace(__dirname, "").slice(1) + ">:";
let gTrace = 0; //глобальная трассировка (трассируется все)

class TrySomeTimes {
  constructor(args, times, tryFunc, finish) {
    gTrace ? log("w", logName, "Constructor(", args, ")started") : null;
    this.args = args;
    this.tryFunc = tryFunc;
    this.finish = finish;
    this.iterate(times);
    this.err = null;
  }
  iterate(step) {
    // ----------- настройки логгера --------------
    let logN = logName + "iterate N" + step + ":[" + this.args + "]->";
    let trace = 0;
    trace = gTrace != 0 ? gTrace : trace;
    trace ? log("i", logN, "Started") : null;
    if (step <= 0) {
      // попыток больше нет
      let l = "Попытки исчерпались. Выход.";
      trace ? log("w", logN, l) : null;
      return this.finish(this.err, null);
    }

    this.tryFunc(this.args, (err, data) => {
      if (err) {
        // неудача
        trace ? log("w", logN, "Попытка №", step - 1) : null;
        this.err = err;
        process.nextTick(() => {
          // пробуем еще раз в следующем цикле
          this.iterate(step - 1);
        }); //nextTick
        return; //выход
      } // if err;
      // успешное выполнение, возвращаем результат
      return this.finish(null, data);
    }); //tryFunc
  }
}

module.exports = TrySomeTimes;

// ---------------  тестирование -----------------------
if (!module.parent) {
  function test(args, cb) {
    let i = parseInt(Math.random() * args);

    if (i / 2 - Math.round(i / 2)) {
      process.nextTick(() => {
        cb(null, "i=" + i);
      });
    } else {
      process.nextTick(() => {
        cb(new Error("Число четное i=" + i));
      });
    }
  } //test

  new TrySomeTimes(10, 2, test, (err, data) => {
    if (err) {
      //log("e",logName,"err=");
      console.error(err);
      return;
    }
    //log("e",logName,"err=");
    console.warn(data);
  });
} // if parent
