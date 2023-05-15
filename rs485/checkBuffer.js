// функція для форматування виводу буфера в консоль
const parseBuf = require("../tools/parseBuf.js");

// функції для перетворення та розрахунку CRC
let { getCRC, testCRC } = require("../tools/CRC.js");

// --------------------------------
// описание ошибок RS485
var errors = [];
errors[0] = undefined;
errors[1] = "Принятый код функции не может быть обработан";
errors[2] = "Адрес данных, указанный в запросе, недоступен.";
errors[3] =
  "Значение, содержащееся в поле данных запроса, является недопустимой величиной.";
errors[4] =
  "Невосстанавливаемая ошибка имела место, пока ведомое устройство пыталось выполнить затребованное действие.";
errors[5] =
  "Ведомое устройство приняло запрос и обрабатывает его, но это требует много времени. Этот ответ предохраняет ведущее устройство от генерации ошибки тайм-аута.";
errors[6] =
  "Ведомое устройство занято обработкой команды. Ведущее устройство должно повторить сообщение позже, когда ведомое освободится.";
errors[7] =
  "Ведомое устройство не может выполнить программную функцию, заданную в запросе. Этот код возвращается для неуспешного программного запроса, использующего функции с номерами 13 или 14. Ведущее устройство должно запросить диагностическую информацию или информацию об ошибках от ведомого.";
errors[8] =
  "Ведомое устройство при чтении расширенной памяти обнаружило ошибку паритета. Ведущее устройство может повторить запрос, но обычно в таких случаях требуется ремонт.";
errors[9] = "Неизвестная ошибка MODBUS.";
errors[10] = "Ошибка адреса устройства.";
errors[11] = "Ошибка CRC: Расчетное и принятое значения не совпадают.";
errors[12] = "Неизвестная ошибка.";
errors[13] = "Ошибка Timeout.";
errors[14] = "Ошибка: порт не открыт.";
errors[15] = "Ошибка: в ответе не совпадает номер функции.";

function createTestReq(buf) {
  let buf2 = getCRC(buf);
  let t = Buffer.concat([buf, buf2], buf.length + 2);
  return t;
}

function checkBuffer(req, buf) {
  // проверяет принятое сообщение на ошибки протокола
  let errMsg = "";
  let errVal;
  let err;
  let resBuf = "Response=" + parseBuf(buf) + ".";
  let reqBuf = "Request=" + parseBuf(req.buf) + ".";
  if (!testCRC(buf)) {
    // CRC-суммы расчетная и полученная не совпадают
    errVal = 11;
  } else {
    // проверяем совпадение адреса прибора
    if (buf[0] != req.buf[0]) {
      // адрес прибора в запросе и ответе не совпадают
      errVal = 10;
    } else {
      // проверяем на совпадение номера функции
      if (buf[1] != req.buf[1]) {
        // Error: номера функций не совпадают
        // проверяем на ответ с ошибкой
        let FC = buf[1]; // функция
        if (FC > 128) {
          // это код ошибки Modbus
          let errCode = buf[3];
          if ((errCode >= 1) | (errCode <= 8)) {
            errVal = errCode;
          } else {
            errVal = 9;
          }
        } else {
          errVal = 15;
        }
      }
    }
  }
  if (errVal) {
    err = new Error(errors[errVal] + "  " + reqBuf + resBuf);
    err.code = errVal;
  }
  return err;
} // end testMessage

module.exports = checkBuffer;

if (!module.parent) {
  let test;
  let req = {
    buf: new Buffer([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x09]),
  };
  console.log("Request:" + parseBuf(req.buf));
  test = createTestReq(new Buffer([0x02, 0x03, 0x00, 0x0c, 0x00, 0x01])); //ошибка адреса
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
  test = createTestReq(new Buffer([0x01, 0x05, 0x00, 0x0c, 0x00, 0x01])); //ошибка функции
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
  test = new Buffer([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01, 0x44, 0x19]); //ошибка CRC16
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
  test = new Buffer([0x01, 0x83, 0x00, 0x02, 0x71, 0xf1]); //ошибка ModBus
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
  test = new Buffer([0x01, 0x83, 0x00, 0x02, 0x71, 0x01]); //ошибка ModBus + ошибка CRC
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
  test = createTestReq(new Buffer([0x01, 0x03, 0x00, 0x0c, 0x00, 0x01])); // правильный ответ
  console.log("res=" + parseBuf(test) + "-->\n" + checkBuffer(req, test));
}
