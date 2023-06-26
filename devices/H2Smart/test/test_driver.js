const iface = require("../../../rs485/RS485_v200.js");
const log = require("../../../tools/log.js"); // логер
let id = 2;
const driver = require("../driver.js");

let test = async () => {
    // driver.getReg(iface, id, "TBlock", (err, data) => {
    //     log("---> in getReg \n", data);
    // });
    // driver.getReg(iface, id, "Kn", (err, data) => {
    //     log("---> in getReg \n", data);
    // });
    driver.getReg(iface, id, "Kc", (err, data) => {
        log("---> in getReg \n", data);
    });
    // driver.getReg(iface, id, "EnableSamplimg", (err, data) => {
    //     log("---> in setReg \n", data);
    // });
    // driver.setReg(iface, id, "EnableSamplimg", 0, (err, data) => {
    //     log("---> in setReg \n", data);
    // });
    driver.setReg(iface, id, "ReinitCalc", 0, (err, data) => {
        log("---> in setReg \n", data);
    });
    driver.getReg(iface, id, "ReinitCalc", (err, data) => {
        log("---> in setReg \n", data);
    });


    // driver.getReg(iface, id, "AI", (err, data) => {
    // log("---> in getReg \n", data);
    // });
    // driver.getReg(iface, id, "DI", (err, data) => {
    // log("---> in getReg \n", data);
    // });
    // driver.getReg(iface, id, "AO", (err, data) => {
    //     log("---> in getReg \n", data);
    // });
    // driver.setReg(iface, id, "AO", "100", (err, data) => {
    //     log("---> in setReg \n", data);
    // });
    // driver.getReg(iface, id, "DO", (err, data) => {
    //     log("---> in getReg \n", data);
    // });
};
setInterval(test, 3000);
