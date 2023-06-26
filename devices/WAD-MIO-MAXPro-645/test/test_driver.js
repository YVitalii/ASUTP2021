const iface = require("../../../rs485/RS485_v200.js");
const log = require("../../../tools/log.js"); // логер
let id = 1;
const driver = require("../driver.js");

let test = async () => {
    driver.getReg(iface, id, "SN", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "AI", (err, data) => {
    log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "DI", (err, data) => {
    log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "AO", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.setReg(iface, id, "AO", "100", (err, data) => {
        log("---> in setReg \n", data);
    });
    driver.getReg(iface, id, "DO", (err, data) => {
        log("---> in getReg \n", data);
    });
};
setInterval(test, 3000);
