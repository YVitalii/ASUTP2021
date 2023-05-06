let comName = "";
let platform = process.platform;
if (platform != "win32") {
  comName = "/dev/ttyUSB0";
} else {
  comName = "COM7";
}
// параметры последовательного порта
const connection = {
  path: comName, //путь к последовательному порту
  openOptions: {
    // параметры порта
    baudRate: 2400, // скорость бод
  },
  timeoutBetweenCalls: 300, // пауза между запросами, мс т.к. ТРП-08 тупят, то бывает начинают отвечать после timeout и начинают сбивать все передачи
}; // connection

module.exports = connection;
