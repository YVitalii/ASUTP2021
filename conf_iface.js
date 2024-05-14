let comName = "";
let platform = process.platform;

let comId;

if (platform != "win32") {
  comName = "/dev/ttyUSB0";
  comId = comName.split("/")[2];
} else {
  comId = comName = "COM3";
}

const Iface = require("./rs485/class_RS485_iface.js");

// module.exports.path = comName;
module.exports.w2 = new Iface(comName, {
  baudRate: 2400,
  timeoutBetweenCalls: 100,
  id: comId,
  header: { ua: `${comId}`, en: `${comId}`, ru: `${comId}` },
});

// -- чотирьох провідна лінія ------------------
// if (platform != "win32") {
//   comName = "/dev/ttyUSB1";
// } else {
//   comName = "COM4";
// }

// module.exports.w4 = new Iface(comName, {
//   baudRate: 2400,
//   timeoutBetweenCalls: 100,
// });

// Застарівша версія налаштування потрібні для RS485_v200.js
// параметры последовательного порта
// const connection = {
//   path: comName, //путь к последовательному порту
//   openOptions: {
//     // параметры порта
//     baudRate: 2400, // скорость бод
//   },
//   timeoutBetweenCalls: 300, // пауза между запросами, мс т.к. ТРП-08 тупят, то бывает начинают отвечать после timeout и начинают сбивать все передачи
// }; // connection

// module.exports = connection;
