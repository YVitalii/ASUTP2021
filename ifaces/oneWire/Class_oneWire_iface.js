const ClassGeneral = require("../../ClassGeneral");
const ds18b20 = require("ds18b20");
const ClassDriverRegisterGeneral = require("../../devices/classDeviceGeneral/ClassDevManagerRegGeneral");
const idHuck = require("./idHuck");
const log = require("../../tools/log");
const ClassDevManagerRegGeneral = require("../../devices/classDeviceGeneral/ClassDevManagerRegGeneral");

class ClassOneWire extends ClassGeneral {
  constructor(params) {
    params.id = "oneWire";
    super(params);
    this.devices = new Map();
    this.manager = ds18b20;
    this.isOpened = false;
    this.scan();
  } //constructor

  async scan() {
    return new Promise((resolve, reject) => {
      ds18b20.sensors((err, ids) => {
        let trace = 1,
          ln = this.ln + `scan()::`;
        if (err) {
          reject(err);
        } else {
          log("i", ln + `Was found ${ids.length} devices:`, ids);
          //console.dir
          let finded = new Set();
          for (let i = 0; i < ids.length; i++) {
            const element = ids[i];
            if (idHuck.ids[element] == undefined) {
              log("e", ln + `idHuck[${element}] is undefined`);
            } else {
              let id = idHuck.ids[element]; //отримуємо id регістру
              if (this.devices.has(id)) {
                log("e", ln + `id=${id} already exists`);
                continue;
              }
              let reg = idHuck.regs[id]; //опис регістру
              log("i", ln + `Was found device id=${id} address=${element}`);
              this.devices.set(id, new ClassDevManagerRegGeneral(reg)); //створюємо регістр
              this.devices.get(id).address = element; //додаємо адресу
              finded.add(element); // запамятовуємо адреси які знайшли
            }
          } //for
          // перевіряємо чи є відсутні пристрої
          for (let key in idHuck.ids) {
            if (finded.has(key)) {
              continue;
            }
            log("e", ln + `idHuck[${key}]=${idHuck.ids[key]} not found`);
          } //forkey
          //console.dir(this.devices);
          resolve(this.devices);
        }
      }); //ds18b20.sensors
    }); //Promise
  } //scan

  async getRegPromise(props = {}) {
    return new Promise((resolve, reject) => {
      let id = props.id;
      //якщо пристрій не знайдено, видаємо помилку
      if (!this.devices.has(id)) {
        reject(`Device id=${id} not found`);
        return;
      }
      // перевіряємо чи дані актуальні, якщо так повертаємо їх
      if (this.devices.get(id).isActual()) {
        let reg = this.devices.get(id);
        //console.dir(reg);
        resolve(reg.value);
        return;
      }
      // якщо дані не актуальні, запитуємо їх
      this.manager.temperature(this.devices.get(id).address, (err, value) => {
        if (err) {
          reject(err);
        } else {
          this.devices.get(id).value = value;
          resolve(value);
        }
      }); //temperature
    });
  }
  async setRegPromise(id) {
    return new Promise().reject(new Error(`Device id=${id} readonly!`));
  }
}

module.exports = ClassOneWire;

if (!module.parent) {
  const oneWire = new ClassOneWire({});
  //console.dir(oneWire.devices);
  setInterval(() => {
    oneWire.getRegPromise({ id: "fermTank01" }).then((result) => {
      console.log(result);
    });
  }, 2 * 1000);
}
