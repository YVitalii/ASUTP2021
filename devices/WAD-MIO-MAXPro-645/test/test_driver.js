const iface = require("../../../rs485/RS485_v200.js");
const log = require("../../../tools/log.js"); // логер
let A13 = 71, A22 = 73, A24 = 72, A25 = 74;
const driver = require("../driver.js");

let test = async () => {
    // driver.getReg(iface, id, "SN", (err, data) => {
    //     log("---> in getReg \n", data);
    // });
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

    // Вимикаємо аварію
    driver.setReg(iface, A24, "DO", true, (err, data) => {
        log("Вимикаємо аварію.");
    });
    // Перевіряємо стан аварії для пуску подачі аміаку
    driver.getReg(iface, A24, "DI", (err, data) => {
        if (!data[0].value) {
            log("e", "Увага! Аварійний стан!");
        } else {
            log("Аварія не зафіксована.");
        }
    });
    // Вмикаємо подачу газу СО2
    driver.setReg(iface, A25, "DO", true, (err, data) => {
        // log("---> in setReg \n", data);
        log("Вмикаємо подачу газу СО2.");
    });
    // Перевіряємо чи подається CO2
    driver.getReg(iface, A25, "DI", (err, data) => {
        if (data[0].value) {
            log("Тиск по лінії СО2 присутній.");
        } else {
            log("w", "Тиск по лінії СО2 відсутній.");
        }
    });
    // Перевіряємо чи подається азот
    driver.getReg(iface, A13, "DI", (err, data) => {
        if (data[0].value) {
            log("Тиск по лінії азоту присутній.");
            // Вимикаємо лампу аварійної подачі азоту
            driver.setReg(iface, A13, "DO", false, (err, data) => {
                // log("w", "Вимикаємо лампу 'Немає азоту!'");
            });
        } else {
            log("w", "Тиск по лінії азоту відсутній.");
            // Вмикаємо лампу аварійної подачі азоту
            driver.setReg(iface, A13, "DO", true, (err, data) => {
                log("w", "Вмикаємо лампу 'Немає азоту!'");
            });
        }
    });
    driver.getReg(iface, A13, "AI", (err, data) => {
    log("Поточне значення 4-20 мА по лінії азоту: ", Math.round(data[0].value*10)/10, "%");
    });
    driver.setReg(iface, A13, "AO", "100", (err, data) => {
        log("Змінюємо значення 4-20 мА по лінії азоту.",);
    });
    driver.getReg(iface, A25, "AI", (err, data) => {
        log("Поточне значення контролю вхідного тиску 4-20 мА по лінії аміаку: ", Math.round(data[0].value*10)/10, "%");
    });
    driver.getReg(iface, A24, "AI", (err, data) => {
        log("Поточне значення 4-20 мА по лінії аміаку (малий потік): ", Math.round(data[0].value*10)/10, "%");
    });
    driver.setReg(iface, A24, "AO", "100", (err, data) => {
        log("Змінюємо значення 4-20 мА по лінії аміаку (малий потік).");
    });
    driver.getReg(iface, A22, "AI", (err, data) => {
        log("Поточне значення 4-20 мА по лінії аміаку (великий потік): ", Math.round(data[0].value*10)/10, "%");
    });
    driver.setReg(iface, A22, "AO", "100", (err, data) => {
        log("Змінюємо значення 4-20 мА по лінії аміаку (великий потік).");
    });
    driver.getReg(iface, A22, "DI", (err, data) => {
        if (!data[0].value) {
            log("w", "Кнопка 7SB21 натиснута.");
        } else {
            log("Кнопка 7SB21 не натиснута.");
        }
    });
    // Вмикаємо лампу дозвіл аміаку
    driver.setReg(iface, A22, "DO", true, (err, data) => {
        log("Вмикаємо лампу 'Аміак дозволено' та клапан.");
    });
};
setInterval(test, 3000);
// setTimeout(test, 3000);
