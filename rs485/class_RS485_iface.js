/**
 * 2023-10-20 Оновлена версія interfece RS485.
 * В попередній версії використовувався модуль, котрий брав налаштування з конфіг-файлу
 * iface_config.js, використання модуля унеможливлює використання двох інтерфейсів одночасно в 1 програмі
 * тому для виправлення цього положення була розроблена оновлена версія iface на базі класу
 * кожний інтерфейс буде обєктом зі своїми налаштуваннями
 */

const SerialPort = require("serialport");

// функція для перевірки вхідного буфера на помилки
const checkBuffer = require("./checkBuffer.js");

// функції для перетворення та розрахунку CRC
let { toTetrad, getCRC } = require("../tools/CRC.js");

// функція для форматування виводу буфера в консоль
const parseBuf = require("../tools/parseBuf.js");

// завантаження логера
const log = require("../tools/log.js");

class IfaceRS485 {
  /**
   * @param {String} path - шлях до порту в системі, наприклад '/dev/ttyUSB0' або 'COM3'
   * @param {Object} props - налаштування порту, повний опис https://serialport.io/docs/9.x.x/api-stream#openoptions
   * @param {Number} props.baudRate -  швидкість, бод
   * @param {Number} props.timeoutBetweenCalls=300 - мс, пауза між запитами, у випадку якщо котрийсь з приладів не закінчив передачу - будуть помилки
   */
  constructor(path, props, timeout = 300) {
    if (!path) {
      let err = {
        ua: `Не вказаний порт`,
        en: `Port don't specified`,
        ru: `Не указан порт`,
      };
      throw new Error(err);
    }

    if (!props.baudRate) {
      let err = {
        ua: `Не вазана швидкість порту`,
        en: `baudRate don't specified`,
        ru: `Не указана скорость порта`,
      };
      throw new Error(err);
    }

    // налаштування логера
    this.ln = `class_RS485_iface(${path})::`;
    let ln = this.ln + "constructor()::";
    let trace = 1;

    this.timeoutBetweenCalls = props.timeoutBetweenCalls
      ? props.timeoutBetweenCalls
      : 300;
    // черга запитів
    this.queue = [];

    // вимикаємо автоматиче відкриття порту, щоб поставити прослуховувача
    // порт відкривається далі в циклі
    props.autoOpen = false;

    /**
     * Поточна задача
     * @typedef {Object} Task
     * @property {Number} timeout=1000 - мс, термін очікування відповіді
     * @property {Number} resLength=6 - байт, очікуєма довжина відповіді
     * @property {Number} timer=0 - ідентифікатор таймера таймауту (для можливості його скасування)
     * @property {Number} start=0 -  відмітка часу старту запиту - використовується для розрахунку часу транзакції
     * @property {Buffer} req=[] -буфер запиту
     * @property {Buffer} res=[] - буфер відповіді
     * @property {Function} cb - callback клієнта, що сформував запит (err,data)
     */
    this.task = {
      timeout: 1000,
      resLength: 6, //
      req: new Buffer.alloc(0), // буфер запиту
      res: new Buffer.alloc(0), //
      timer: 0,
      start: 0,
      cb: null, //
    };

    // створюємо об'єкт порту
    this.serial = new SerialPort(path, props);

    // ---------- ставимо прослуховувача- збирача даних --------------
    this.serial.on("data", (data) => {
      let trace = 0,
        ln = this.ln + 'serial.on("data")::';
      // при отриманні шматка інформації, запамятовуємо їх в буфер відповіді
      this.task.res = Buffer.concat([this.task.res, data]);
      trace ? log("i", ln, `data=`, data) : null;
      // перевіряємо чи отримано всі очікувані байти
      if (this.task.res.length >= this.task.resLength) {
        // викликаємо завершення транзакції
        this.transactionFinish(this.task);
      }
    });

    // функція callback для serial.open,
    // створена для перезапуску самої себе до моменту успішного відкриття порту
    let openCb = (err, data) => {
      if (err) {
        log("e", ln, err.message);

        // плануємо наступну спробу відкрити порт через 5 сек
        setTimeout(() => {
          // if (trace) {
          //   log("i", ln, `this=`);
          //   console.dir(this);
          // }
          this.serial.open(openCb);
        }, 5000);
        return;
      } // err
      log("i", ln, `Порт відкрито! `);
      // ---------------- Запускаємо цикл опитування ---------
      this.iterate();
    };
    // --------- запускаємо спроби відкрити порт  ----------
    this.serial.open(openCb);
  } // constructor

  /**
   * функція формує та ставить запит в чергу
   * @typedef {Object} req - запит RS485
   * @property {Number} id - адреса пристрою в мережі [1..254]
   * @property {Number} FC - функція, наразі реалізовано FC=[3,6,10]
   * @property {Number} addr - адрес початкового регістру
   * @property {Number | Buffer } data - дані для передачі
   * @property {Number} timeout - час очікування відповіді
   * @return {callback} (err,data) = >
   * @typedef {Object} data - отримані дані
   */

  send(req, cb) {
    // налаштування трасувальника
    let trace = 0,
      ln =
        this.ln +
        `send(id=${req.id};FC=${req.FC};addr=${req.addr};data=${parseBuf(
          req.data
        )})::`;
    trace ? log(ln, `Started!`) : null;

    // якщо порт ще не відкрито, повертаємо помилку
    if (!this.serial.isOpen) {
      let err = {
        ua: `Помилка порт не відкрито!`,
        en: `Error port not opened!`,
        ru: `Ошибка порт не открыт!`,
      };
      process.nextTick(() => {
        cb(new Error(err), null);
      });
      trace ? log("Error:", ln, err.en) : null;
      return;
    }
    // заготовка послання
    let msg = {
      timeout: req.timeout ? req.timeout : 1000,
      cb: cb,
      timer: 0,
      res: new Buffer.alloc(0),
    };
    // розраховуємо довжину відповіді
    msg.resLength = calculateResponseLength(req.FC, req.data);
    // формуємо буфер запиту
    let addr = toTetrad(req.addr);
    let arr = [req.id, req.FC, addr[0], addr[1]];
    if (Buffer.isBuffer(req.data)) {
      // якщо дані на отримані у вигляді буферу - просто додаємо
      // console.log("req.data is a buffer");
      for (let i = 0; i < req.data.length; i++) {
        arr.push(req.data[i]);
      }
    } else {
      // дані отримані у вигляді цілого числа → перетворюємо в буфер
      let data = toTetrad(req.data);
      arr.push(data[0], data[1]);
    }
    // формуємо з масиву буфер
    let buf = new Buffer.from(arr);
    // рахуємо та додаэмо CRC
    let crc = getCRC(buf);
    arr.push(crc[0]);
    arr.push(crc[1]);
    // запамятовуэмо запит
    msg.req = new Buffer.from(arr);

    trace ? log("i", ln, `Task created: msg=`, msg) : null;
    // ставимо запит в чергу
    this.queue.push(msg);
  } // send

  /**
   * головний цикл, періодично перевіряє чергу, і якщо там щось є - надсилає в мережу RS485
   */
  iterate() {
    // -- налаштування трасувальника -----
    let trace = 0,
      ln = this.ln + `iterate()::`;
    trace ? log("i", ln, `Started!`) : null;

    // -- якщо черга пуста або э активна задача - плануємо перевірку через 1 с
    if ((this.queue.length < 1) | (this.task.timer != 0)) {
      setTimeout(() => {
        this.iterate();
      }, 1000);
      trace ? console.log("Queue is empty. Wait new task 1s. ") : null;
      return;
    }
    // ------ черга не пуста --------------------
    // беремо першу задачу
    this.task = this.queue.shift();
    // плануємо запуск послання через this.timeoutBetweenCalls
    setTimeout(() => {
      this.transactionStart(this.task); //transaction
    }, this.timeoutBetweenCalls);
  } // iterate()
  /**
   * Починає тразакцію, запускає таймер очікування timeot
   * @param {Task} task
   */
  transactionStart(task) {
    let trace = 0,
      ln = this.ln + `transactionStart(${parseBuf(task.req)})::`;
    trace ? log("i", ln, `Started!`) : null;
    // очищуємо приймальний буфер
    task.res = Buffer.alloc(0);
    // запамятовуємо час
    task.start = new Date().getTime();
    // відсилаємо повідомлення
    this.serial.write(task.req);
    // запускаємо таймер для зупинки запиту при закінченні timeout
    task.timer = setTimeout(() => {
      this.transactionFinish(task);
    }, task.timeout + 50);
    // if (trace) {
    //   log("i", ln, `this.task=`);
    //   console.dir(this.task, { depth: 2 });
    // }
  }

  /**
   * Завершення транзакції
   * @param {Task} task - поточне завдання
   */
  transactionFinish(task) {
    let trace = 0,
      ln = this.ln + `transactionFinish(${parseBuf(task.req)})::`;
    // trace ? log("i", ln, `Started!`) : null;
    let duration = 0;
    //
    if (trace) {
      duration = (new Date().getTime() - task.start) / 1000;
      // log("i", ln, "duration:", duration, " s");
    }
    task.start = 0;
    // якщо таймер запущено, то відповідь отримана: Вимикаємо таймер
    clearTimeout(task.timer);
    // скидаємо таймер активної задачі
    task.timer = 0;

    // перевірка на помилки отриманого повідомлення
    let err = checkBuffer(task);
    if (err) {
      // помилку ModBus виявлено
      task.cb(err, null);
      trace ? log("e", ln, `err=`, err) : null;
      //викликаємо наступну ітерацію
      this.iterate();
      return;
    }
    // виділяємо з посилки корисне повідомлення
    task.data = extractData(task.res);
    trace
      ? log(
          ln,
          `response=${parseBuf(task.res)}; data=${parseBuf(
            task.data
          )}; duration=${duration} s`
        )
      : null;
    // відсилаємо дані
    task.cb(null, task.data);
    //викликаємо наступну ітерацію
    this.iterate();
  }
} // class

/**
 * Функція приймає буфер та видобуває з нього корисну інформацію
 * @param {Buffer} buf
 * @returns {Buffer}
 */
function extractData(buf) {
  // принимает буфер
  // вырезает из него данные и возвращает их
  // в виде буфера
  let trace = 0,
    ln = " extractData(" + parseBuf(buf) + ")::";
  trace ? log(ln, "Started!") : null;

  let FC = buf[1]; //номер функции
  //let _err=null;
  let _data = null;
  switch (FC) {
    case 3:
      _data = new Buffer.from(buf.slice(3, buf.length - 2));
      break;
    case 6:
      _data = new Buffer.from(buf.slice(4, buf.length - 2));
      break;
    case 0x10:
      _data = new Buffer.from(buf.slice(4, buf.length - 2));
      //log("w", "buf=", buf, "; _data=", _data);
      break;
    default:
      log("e", ln, "Undefined function code=" + FC);
  } //switch
  trace ? log(ln, "Extracted data= ", parseBuf(_data)) : null;
  return _data;
} //end extractData

/** Розрахунок довжини відповіді з приладу в байтах
 * @param {Number} fc - функція
 * @param {Number | Buffer} data - дані, що передаються
 */
function calculateResponseLength(fc, data) {
  let length = 8;
  //log('length='+length);
  switch (fc) {
    case 3:
      // функция 3
      length = 1 + 1 + 1 + Number(data) * 2 + 2; //[адрес]+[функция]+[кол.запрошенных байт]+ответ*2+CRC
      //log('length='+length);
      break;
    case 6:
      length = 8; //ответ = эхо запроса
    case 10:
      //[адрес]+[функция]+[startRegister_H]+[startRegister_L]+[registerNumber_H]+[registerNumber_L]+CRC_H+CRC_L
      length = 1 + 1 + 2 + 2 + 2; //8
  }
  return length;
}

function checkModbusError(task) {}
module.exports = IfaceRS485;