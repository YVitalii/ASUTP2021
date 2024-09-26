/** Опис регістрів */

const ClassDriverGeneral = require("../classDeviceGeneral/ClassDriverGeneral");

// ---------- driver creation ------------
let driver = new ClassDriverGeneral({
  id: "H2smart",
  header: { ua: `H2-smart`, en: `H2-smart`, ru: `H2-smart` },
  comment: {
    ua: `Вимірювач ступеню дисоціації`,
    en: `Thermoregulator`,
    ru: `Терморегулятор`,
  },
  timeout: 2000,
});
