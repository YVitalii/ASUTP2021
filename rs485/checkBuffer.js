// функція для форматування виводу буфера в консоль
const parseBuf = require("../tools/parseBuf.js");

// функції для перетворення та розрахунку CRC
let { getCRC, testCRC } = require("../tools/CRC.js");

// логер

const log = require("../tools/log.js");
// --------------------------------
// описание ошибок RS485
var errors = [];
errors[0] = undefined;
errors[1] = {
  ua: `Функція з цим кодом не може бути оброблена`,
  en: `Undefined function`,
  ru: `Принятый код функции не может быть обработан`,
};
errors[2] = {
  ua: `Адреса регістра недосяжний`,
  en: `Undefined register adress`,
  ru: `Адрес данных, указанный в запросе, недоступен.`,
};
errors[3] = {
  ua: `Невірні дані`,
  en: `Incompatible data`,
  ru: `Значение, содержащееся в поле данных запроса, является недопустимой величиной.`,
};
errors[4] = {
  ua: `Невиправна помилка сталася коли пристрій намагався виконати запит`,
  en: `ModBus Error=4`,
  ru: `Невосстанавливаемая ошибка имела место, пока ведомое устройство пыталось выполнить затребованное действие.`,
};

errors[5] = {
  ua: `Пристрій прийняв запит та обробляє його, але це потребує більше часу. `,
  en: `ModBus Error=4`,
  ru: `Ведомое устройство приняло запрос и обрабатывает его, но это требует много времени. Этот ответ предохраняет ведущее устройство от генерации ошибки тайм-аута.`,
};
errors[6] = {
  ua: `Пристрій обробляє запит. Зверніться пізніше.`,
  en: `Device is busy. Trylater`,
  ru: `Ведомое устройство занято обработкой команды. Ведущее устройство должно повторить сообщение позже, когда ведомое освободится.`,
};
errors[7] = {
  ua: `Пристрій не може виконати функцію, вказану в запиті. `,
  en: `Uncompatible function`,
  ru: `Ведомое устройство не может выполнить программную функцию, заданную в запросе. Этот код возвращается для неуспешного программного запроса, использующего функции с номерами 13 или 14. Ведущее устройство должно запросить диагностическую информацию или информацию об ошибках от ведомого.`,
};
errors[8] = { ua: ``, en: ``, ru: `` };
("Ведомое устройство при чтении расширенной памяти обнаружило ошибку паритета. Ведущее устройство может повторить запрос, но обычно в таких случаях требуется ремонт.");
errors[9] = {
  ua: `Невідома помилка ModBus`,
  en: `Undefined ModBus error `,
  ru: `Неизвестная ошибка MODBUS.`,
};
errors[10] = {
  ua: `Невірна адреса пристрою`,
  en: `Incompatible device adress`,
  ru: `Ошибка адреса устройства`,
};
errors[11] = {
  ua: `Помилка CRC`,
  en: `CRC error`,
  ru: `Ошибка CRC: Расчетное и принятое значения не совпадают`,
};
errors[12] = {
  ua: `Невідома помилка`,
  en: ` Undefined error`,
  ru: `Неизвестная ошибка.`,
};
errors[13] = {
  ua: `Помилка timeout`,
  en: `Timeout error`,
  ru: `Ошибка Timeout.`,
};
errors[14] = {
  ua: `Помилка порт не відкритий`,
  en: `Port not opened.`,
  ru: `Ошибка: порт не открыт.`,
};
errors[15] = {
  ua: `Помилка в запиті та відповіді не співпадає номер функції`,
  en: `Different function code.`,
  ru: `Ошибка: в ответе не совпадает номер функции.`,
};
errors[16] = {
  ua: `Неочікувана довжина відповіді`,
  en: `Unexpected length of message`,
  ru: `Неверная длина ответа.`,
};

/**
 * Перевірка вхідного та вихідного буферів на помилку
 * @param {Buffer} req - запит
 * @param {Buffer} res - відповідь
 * @returns {Number} - код помилки або 0, якщо помилок не виявлено
 */
function checkError(req, res) {
  // вхідний буфер пустий
  if (res.length <= 0) return 13;
  // CRC-сумма невірна
  if (!testCRC(res)) return 11;
  // адреса в запиті та відповіді не співпадає
  if (res[0] != req[0]) return 10;
  // перевіряємо на співпадіння номера функції
  if (res[1] != req[1]) {
    // неспівпадіння
    // перевіряємо чи це не помилка ModBus
    if (res[1] > 128) {
      // маємо функцію з кодом помилки
      if ((res[3] >= 1) | (res[3] <= 8)) {
        // код помилки modBus
        return res[3];
      }
      // невідома помилка ModBus
      return 9;
    }
    // номери функцій не співпадають
    return 15;
  }
  // всі перевірки пройдено, помилок не знайдено
  return 0;
}

/**
 * Перевіряє функцію отримане повыдомлення на помилки ModBus
 * @param {typedef} task
 * @returns {Error | null} - помилка або null - якщо її немає
 */

function checkBuffer(task) {
  let trace = 0,
    ln = "checkBuffer()::";
  if (trace) {
    log("i", ln, `task=`);
    console.dir(task);
  }

  function createError(errCode, task) {
    let d =
      "checkError(req=" +
      parseBuf(task.req) +
      "; res=" +
      parseBuf(task.res) +
      ")::";

    let messages = {
      ua: d + errors[errCode].ua,
      en: d + errors[errCode].en,
      ru: d + errors[errCode].ru,
    };
    let err = new Error(messages.ua);
    err.code = errCode;
    err.messages = messages;
    return err;
  }

  let errCode = checkError(task.req, task.res);

  if (errCode) {
    return createError(errCode, task);
  }

  if (task.resLength != task.res.length) {
    trace ? log("i", ln, `task.resLength=`, task.resLength) : null;
    trace ? log("i", ln, `task.res.length=`, task.res.length) : null;
    errCode = 16;
    return createError(errCode, task);
  }

  return null;
} // end testMessage

module.exports = checkBuffer;

if (!module.parent) {
  function createTestReq(buf) {
    let buf2 = getCRC(buf);
    let t = Buffer.concat([buf, buf2], buf.length + 2);
    return t;
  }

  let res;
  let req = new Buffer.from([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x09]);
  let task = { req, res };
  console.log("Request:" + parseBuf(task.req));
  // пуста відповідь
  task.res = new Buffer.from("");
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));

  //помилка адреси
  task.res = createTestReq(
    new Buffer.from([0x02, 0x03, 0x00, 0x0c, 0x00, 0x01])
  );
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  // помилка функції
  task.res = createTestReq(
    new Buffer.from([0x01, 0x05, 0x00, 0x0c, 0x00, 0x01])
  );
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  // помилка CRC
  task.res = new Buffer.from([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x19]);
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  // помилка ModBus
  task.res = new Buffer.from([0x01, 0x83, 0x00, 0x02, 0x71, 0xf1]);
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  //помилки ModBus + CRC
  task.res = new Buffer.from([0x01, 0x83, 0x00, 0x02, 0x71, 0x01]);
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  // невірна довжина повідомлення
  task.resLength = 7;
  task.res = createTestReq(
    new Buffer.from([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01])
  );
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
  // вірна відповідь
  task.resLength = 8;
  task.res = createTestReq(
    new Buffer.from([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01])
  );
  console.log("res=" + parseBuf(task.res) + "-->");
  console.dir(checkBuffer(task));
}
