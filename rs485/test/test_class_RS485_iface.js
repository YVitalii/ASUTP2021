const parseBuf = require("../../tools/parseBuf");
// const Iface = require("../class_RS485_iface");
//let iface = new Iface("COM3", { baudRate: 2400 });

let iface = require("../../conf_iface.js").w2;

let req = { id: 1, FC: 3, addr: 0x1, data: 0x1, timeout: 1500 };

setInterval(() => {
  test();
}, 3000);

function test() {
  iface.send(req, (err, data) => {
    if (err) {
      console.log(err);
    }
    if (data) {
      console.log("Data addr 0x01:[" + parseBuf(data) + "]");
    }
  }); //addTask
} //test
