/**
 * Перед виконанням програми записує її в усі прилади і запускає їх.
 * Спочатку запис у кожен прилад, потім старт — щоб ніхто не поїхав зі старою програмою.
 *
 * @param {Object} props
 * @param {Array} props.program програма для регістра "program"
 * @param {Array<{setRegister: Function, start: Function}>} props.devices
 */
async function programTRM251_beforeAll(props = {}) {
  const { program, devices } = props;
  if (!Array.isArray(devices)) {
    throw new Error("programTRM251_beforeAll: props.devices має бути масивом");
  }
  if (program == null) {
    throw new Error("programTRM251_beforeAll: props.program має бути задана");
  }

  for (const device of devices) {
    await device.setRegister("program", program);
  }
  for (const device of devices) {
    await device.start();
  }
}

module.exports = programTRM251_beforeAll;
