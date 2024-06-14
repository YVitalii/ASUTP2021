const log = require("../../../tools/log.js"); // логер
let trace = 1,
  ln = __filename + "::";
const dummy = require("../../../tools/dummy.js").dummyPromise;
const dev = require("./t_createDev.js");

let SP = 0; // поточне завдання
let dOut = 0; // стан числового виходу 1 - замкнуто 0 - розімкнуто

let next = async () => {
  let i = 0;
  try {
    // ---------- test AI ----------
    let val = await dev.getAI();
    log("i", "getAI()=", val);

    // // ---------- test AO ----------
    val = await dev.getAO();
    log("i", "getAO()=", val);

    SP = SP > 100 ? 0 : SP + 10;
    await dev.setAO(SP);
    log("w", "setAO(", SP, ")");

    // -------------- test DI () ---------
    val = await dev.getDI();
    log("i", "getDI()=", val);

    // ----- test DO ----------------------------------------------------------------
    dOut = await dev.getDO();
    log("i", "getDO()=", dOut);

    dOut = !dOut;
    log("w", "setDO(", +dOut, ")");
    await dev.setDO(+dOut);

    console.log("--------- End cycle ----------------");
  } catch (error) {
    log("e", ln);
    console.dir(error);
  }
  setTimeout(() => {
    next();
  }, 4000);
};

setTimeout(() => {
  next();
}, 2000);
//   while (true) {
//     //log("n=", await dev.getAI());

//     // log("getAO()::result=", await dev.getAO());
//     // log(`getAO(${i}); result=`, await dev.setAO(i));
//     // log(`getDI(); result=`, await dev.getDI());
//     // log(`getAO(${i}); result=`, await dev.setAO(i));
//     dOut = Number(!dOut);
//     log(`setDO(${Number(dOut)}); result=`, await dev.setDO(dOut));
//     log(`getDO(); result=`, await dev.getDO());
//     i += 10;
//     if (i > 100) {
//       i = 0;
//     }
//     await dummy(2000);
//   }
// };
