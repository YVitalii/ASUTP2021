const iface = require("../../../rs485/RS485_v200.js");
const log = require("../../../tools/log.js"); // логер
let id = 1;
const driver = require("../driver.js");

let test = async () => {
    driver.getReg(iface, id, "CTR", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "VTR", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "V_L1N", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "V_L2N", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "V_L3N", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Curr_L1", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Curr_L2", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Curr_L3", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Pow_L1", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Pow_L2", (err, data) => {
        log("---> in getReg \n", data);
    });
    driver.getReg(iface, id, "Pow_L3", (err, data) => {
        log("---> in getReg \n", data);
    });
};
setInterval(test, 3000);
