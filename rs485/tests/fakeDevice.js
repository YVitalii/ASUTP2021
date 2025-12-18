const { data } = require("happy-dom/lib/PropertySymbol.js");
const GeneralClass = require("../../ClassGeneral");
const apiError = require("../../tools/apiError");
const toTetrad = require("../../tools/CRC").toTetrad;
const ClassFakeDeviceGeneral = require("../../devices/fakeDevices/ClassFakeDeviceGeneral.js");

class ClassFakeDeviceForIfaceTesting extends ClassFakeDeviceGeneral {
  constructor(props = {}) {
    super(props);
    this.regs[0] = {
      id: "state",
      val: null,
      set: function (val) {
        this.regs[0].val = val;
        return val;
      },
      get: function () {
        this.regs[0].val;
      },
    };
  }
}

let dev = new GeneralClass({ id: "fakeDevice" });

/**
 * функція імітує роботу реальної функції send()
 * @param {object} req - запит має містити {addr=1..247,FC,addr,data} опис див. class_RS485_iface_real.save
 * @param {Boolean} err=false - примусова генерація помилки = true
 * @return {callback} cb - callback {err:null/apiErr,data=Buffer/null}
 */
dev.save = function (req, cb, err = false) {
  // якщо data = buffer - повертаємо як є
  if (req.data instanceof Buffer) {
    cb(null, req.data);
    return;
  }
  // перетворюємо число в буфер та повертаємо
  cb(null, toTetrad(req.data));
};

module.exports = dev;
