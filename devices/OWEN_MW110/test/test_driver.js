const iface = require("../../../rs485/RS485_v200.js");
const log = require("../../../tools/log.js"); // логер
let id = 16;
const driver = require("../driver.js");
const driver_trp = require("../../trp08/driver.js");
// let date = new Date;

let test = async () => {
    driver_trp.getReg(iface, 1, "T", (err, data) => {
        // log("---> in getReg \n", data);
        // let date = new Date;
        log("Furnace temperature: ", data[0].value);
    });
    driver.getReg(iface, id, "T1", (err, data) => {
        // log("---> in getReg \n", data);
        let date = new Date;
        log("Time: " + date.getHours() + ":" + date.getMinutes());
        log("T1: ", data[0].value);
    });
    driver.getReg(iface, id, "T2", (err, data) => {
        // log("---> in getReg \n", data);
        log("T2: ", data[0].value);
    });
    driver.getReg(iface, id, "T3", (err, data) => {
        // log("---> in getReg \n", data);
        log("T3: ", data[0].value);
    });
    driver.getReg(iface, id, "T4", (err, data) => {
        // log("---> in getReg \n", data);
        log("T4: ", data[0].value);
    });
};
// setInterval(test, 300000);
// test();
setInterval(test, 120000);
// setInterval(test, 20000);
