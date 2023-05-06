// функція для розрахунку CRC
const crc = require("crc");

/**
 *
 * @param {*} addr
 * @returns
 */
function toTetrad(addr) {
  // преобразовывает число в буфер из двух байт
  var h = Math.floor(addr / 256); //HI byte
  var l = addr - h * 256; //LO byte
  var arr = Buffer.from([h, l]);
  //console.log("Adress="+addr+"="+arr.toString('hex'));
  return arr;
}

function getCRC(buf) {
  // рассчитывает CRC для буфера buf и возвращает в виде буфера [LO,HI]
  let crc16 = crc.crc16modbus(buf);
  let arr = [];
  crc16 = toTetrad(crc16);
  arr.push(crc16[1]);
  arr.push(crc16[0]);
  let bufCRC = Buffer.from(arr);
  return bufCRC;
}

function testCRC(buf) {
  // сверяет расчетное и принятое от девайса CRC16
  // если совпадает = true
  let arr = [];
  let bufCRC = buf.slice(buf.length - 2, buf.length);
  let buf1 = buf.slice(0, buf.length - 2);
  //log( "bufCRC=" );
  //console.log(bufCRC);
  let buf1CRC = getCRC(buf1);
  //log( "buf1CRC=" );
  //console.log(buf1CRC);
  let result = bufCRC.equals(buf1CRC);
  //log( "buf1CRC=buf1CRC=" );
  //console.log(result);
  return result;
} //testCRC

module.exports.toTetrad = toTetrad;
module.exports.getCRC = getCRC;
module.exports.testCRC = testCRC;
