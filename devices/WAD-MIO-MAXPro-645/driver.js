// const WAD_MIO = require('../../rs485/RS485_v200.js');
const SerialPort= require('serialport');
var buffer=new Buffer(0); // буфер приема данных
var serialPort = new SerialPort("COM7", {
    baudRate: 9600
});
serialPort.on('data',function(data) {
    console.log(Buffer.from(data.toString()));
});
msg = new Buffer.from([0x01,0x03,0x0002,2]); //запрос
start = () => serialPort.write(msg, (err, data) => {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    console.log(Buffer.from(data));
    
});
setInterval(start, 1500);
// start = () => {
//     // Серийный номер устройства
//     WAD_MIO.send({id: 1, FC: 0x03, addr: 0x0002, data: 2}, (err, data) => {
//         console.log(`- - - Запрос по адресу 0x0002 - - -`);
//         if (err) console.log(`err: ${err}`);
//         // console.log(data);
//         console.log(`Серийный номер устройства: ${data.readUInt32BE(0)}.`);
//     });
//     // Значение канала аналогового ввода
//     WAD_MIO.send({id: 1, FC: 0x03, addr: 0x4006, data: 2}, (err, data) => {
//         console.log(`- - - Запрос по адресу 0x4006 - - -`);
//         if (err) console.log(`err: ${err}`);
//         console.log(`Значение канала аналогового ввода: ${data.readFloatBE(0)} мА.`);
//     });
//     // Запись канала дискретного вывода
//     WAD_MIO.send({id: 1, FC: 0x10, addr: 0x4014, data: 1}, (err, data) => {
//         console.log(`- - - Запись регистра по адресу 0x4014 - - -`);
//         if (err) console.log(`err: ${err}`);
//         console.log(`Ответ: ${data}`);
//         console.log(data);
//     });
// }
// setInterval(start, 5000);