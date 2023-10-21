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
   * @param {Number} timeout = 300 - мс, таймаут між запитами [можливо застаріло] (інколи ТПР починають відповідати після паузи)
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

    // вимикаємо автоматиче відкриття порту, щоб поставити прослуховувачів порт відкривається далі в циклі
    props.autoOpen = false;

    // поточна задача
    this.task = {
      timeout: 1000, // мс, термін очікування відповіді
      resLength: 6, // байт, очікуєма довжина відповіді
      req: new Buffer.alloc(0), // буфер запиту
      res: new Buffer.alloc(0), // буфер відповіді
      timer: null, // ідентифікатор таймера таймауту (для можливості його скасування)
      start: null, // відмітка часу початку запиту
      cb: null, // функція зворотнього виклику (err,data)
      
    };

    // створюємо об'єкт порту
    this.serial = new SerialPort(path, props);

    // ---------- ставимо прослуховувача- збирача даних --------------
    this.serial.on("data", (data) => {
      let trace = 1,
        ln = this.ln + 'serial.on("data")::';
      // при отриманні шматка інформації, запамятовуємо їх в буфер відповіді
      this.task.res = Buffer.concat([this.task.res, data]);
      trace ? log("i", ln, `data=`, data) : null;
      // перевіряємо чи отримано всі очікувані байти
      if (this.task.res.length >= this.task.resLength) {
        // викликаємо завершення транзакції
        this.taskFinished(this.task);
      }
    });

    // функція callback для serial.open, створена для запуску самої себе до відкриття порту
    let openCb = (err, data) => {
      if (err) {
        console.log("RS485_v200:", err);
        // плануємо наступну спробу відкрити порт через 3 сек
        setTimeout(() => {
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
    let trace = 1,
      ln =
        this.ln +
        `send(id=${req.id};FC=${req.FC};addr=${req.addr};data=${req.data})::`;
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
      timeout: null,
      timer: null,
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
    let trace = 1,
      ln = this.ln + `iterate()::`;
    trace ? log("i", ln, `Started!`) : null;
    // -- якщо черга пуста - плануємо перевірку через 1 с
    if (this.queue.length < 1 | (this.task.isGoing) ) {
      this.task = null;
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
      this.transaction(this.task, (err, data) => {
        this.task.cb(err, data); //отсылаем ответ
        // вызываем следующую итерацию после задержки timeoutBetweenCalls
        this.transactionStart(this.task);
      }); //transaction
    }, this.timeoutBetweenCalls);
  } // iterate()

  transactionStart(task, cb) {
    let trace = 1,
      ln = this.ln + `transaction(${parseBuf(task.req)})::`;
    trace ? log("i", ln, `Started!`) : null;
    // очищуємо приймальний буфер
    task.res = Buffer.alloc(0);
    // запамятовуємо час
    task.start = new Date().getTime();
    // відсилаємо повідомлення
    this.serial.write(task.req);
    // запускаємо таймер для зупинки запиту при закінченні timeout
    task.timer = setTimeout(() => {
      finishTransaction(task);
    }, task.timeout + 50);
  }

  /**
   * Завершення транзакції
   * @param {*} task
   */
  transactionFinish(task) {
    let trace = 1,
      ln = this.ln + "transactionFinish()::";
    trace ? log("i", ln, `Started!`) : null;
    // якщо таймер запущено, то очікувана відповідь отримана. скидаємо його
    if (task.timer) {
      clearTimeout(task.timer);
    }
    // перевірка на помилки отриманого повідомлення
    let err = checkBuffer(task);
    if (err) {
      // помилку виявлено
      task.cb(err, null);
      return;
    }
    // виділяємо з посилки корисне повідомлення
  }
} // class

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
