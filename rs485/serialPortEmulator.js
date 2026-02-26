const EventEmitter = require("node:events");

const parseBuf = require("../tools/parseBuf");

class SerialEmulator extends EventEmitter {
  constructor(portName, options = {}) {
    super();
    this.ln = "[SerialPortEmulator]::";
    this.portName = "fake" + portName;
    this.baudRate = options.baudRate || 9600;
    this.isOpen = false;
    // Список емуляторів приладів
    this.devices = new Map();
    this.name = "SerialPortEmulator"
    this.isEmulator = true;
    // Список емуляторів приладів, де номер в масиві = адресу приладу на шині RS485
    this.devices = [];
  } // c

  /**
   * Метод для додавання емулятора приладу
   * @param {Number} address - адреса приладу в iface
   * @param {Instance of GeneralRS485deviceEmulatorClass} deviceEmulator 
   * @returns {null} 
  */  
  addDevice(address, deviceEmulator) {
    if (address < 0 || address > 255) {
      throw new Error(this.ln + "Address must be between 0 and 255");
    }
    if (this.devices[address]) {
      throw new Error(
        this.ln + `Device emulator already exists at address ${address}`,
      );
    }
    if (
      deviceEmulator.write === undefined ||
      typeof deviceEmulator.write !== "function"
    ) {
      throw new Error(this.ln + "Device emulator must have a write() method");
    }
    console.log(
      this.ln +
        `Adding device emulator [${deviceEmulator.id}] at address ${address}`,
    );
    this.devices[address] = deviceEmulator;
  }

  // Відкриття порту
  open(callback) {
    setTimeout(() => {
      this.isOpen = true;
      this.emit("open");
      if (callback) callback(null);
    }, 100);
  }

  // Запис даних у "порт"
  write(data) {
    let trace = 0,
      ln = this.ln + `write()::`;
    if (trace) {
      console.log(ln + `started with data=` + parseBuf(data));
    }
    if (!this.isOpen) {
      this.emit("error", new Error(ln + "Port is not open"));
      return;
    }
    // перші 2 байти - це адреса приладу
    let addr = data.readUInt8(0);
    trace ? console.log(ln + `write():: addr=${addr.toString()}`) : null;
    if (this.devices[addr] === undefined) {
      trace
        ? console.log(
            ln + `write():: ERROR:: No device emulator for address ${addr}`,
          )
        : null;
      return;
    }

    // Імітуємо обробку команди залізом
    this._processCommand(addr, data);
  }

  async _processCommand(addr, data) {
    // Емуляція відповіді датчика через 50мс
    let trace = 1,
      ln = this.ln + `_processCommand::`;
    let res = await this.devices[addr].write(data);
    this.emit("data", res);
  }

  close() {
    this.isOpen = false;
    this.emit("close");
  }
}

// Експорт класу для використання в інших файлах
module.exports = SerialEmulator;

if (require.main === module) {
  let ln = "[serialEmulator.js main]::";
  //виконується, якщо модуль викликано окремо, а не імпортовано (в командному рядку)
  const serialPort = new SerialEmulator("COM3", { baudRate: 9600 });
  serialPort.open((err) => {
    if (err) {
      return console.error("Error opening port:", err);
    }
    console.log("Port opened");
    serialPort.on("data", (data) => {
      console.dir(ln + "on_data():: data=" + data.toString());
    });
    serialPort.write("GET_NH3");
  });
}
