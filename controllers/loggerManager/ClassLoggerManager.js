const log = require("../../tools/log.js");
const ClassFileManager = require("../fileManager/ClassFileManager.js");
const ClassLoggerRegisters = require("./ClassLoggerRegister.js");
const pug = require("pug");
const resolvePath = require("path").resolve;

module.exports = class ClassLoggerManager {
  /**
   *
   * @param {*} props
   * @prop {String} props.ln="ClassLoggerManager::" - заголовок для логів
   * @prop {String} props.baseUrl="" - базова адреса this.homeUrl=props.baseUrl + "/"+this.id
   * @prop {String} props.baseDir=__dirname - базова адреса на локальному диску this.homeDir=props.baseDir + "/"+this.id
   * @prop {Number} props.period=10*1000 - мс, період опитування та запису стану регістрів
   * @prop {String} props.fileName="tmp" - імя поточного файлу логування
   * @prop {Object} props.regs=[{}] - масив регістрів для логування, кожний регістр екземпляр of ClassLoggerRegister
   * @prop {} props.= -
   *
   */
  constructor(props = {}) {
    this.ln = props.ln ? props.ln : "ClassLoggerManager::";
    this.id = "loggerManager";
    // посилання
    this.baseUrl = props.baseUrl ? props.baseUrl : "";
    this.baseDir = props.baseDir ? props.baseDir : __dirname;
    // локальні шляхи
    this.homeUrl = this.baseUrl + this.id;
    this.homeDir = this.baseDir + "\\" + this.id;
    // період між запитами
    this.period = props.period ? props.period : 10 * 1000;
    // файловий менеджер
    this.fileManager = new ClassFileManager({
      homeDir: this.homeDir,
      homeUrl: this.homeUrl,
    });
    this.tmpLogFileName = "tmp";
    // поточне імя файлу
    this.fileName = props.fileName ? props.fileName : this.tmpLogFileName;
    // розширення для файлів
    this._fileExtensions = {
      logger: ".log", // файл з записом параметрів процесу
      steps: ".stp", // файл з запланованим перебігом процесу (програма)
      points: ".pnt", // файл з точками подій
    };

    // масив з id регістрів для забезпечення сталого порядку при записі
    this.regsId = new Array(); // ["T1","tT1", ..]
    // список регістрів для логування параметрів процесу
    this.regs = {};
    // реєструємо регістри
    if (props.regs) {
      this.addReg(props.regs);
    }

    // останній записаний рядок, використовується для відповіді побудовнику графіку в браузеру
    this.lastDataLine = "";

    //опис можливих станів, щоб все було в одному місці
    this._states = {
      stoped: {
        id: "stoped",
        header: { ua: `Зупинено`, en: `Stoped`, ru: `Остановлен` },
      },
      started: {
        id: "started",
        header: { ua: `Запис`, en: `Writing`, ru: `Запись` },
      },
    }; //this._states={
    this.state = this._states.stoped;

    this.start(this.tmpLogFileName); // запускаємо запис поточного стану в тимчасовий файл
  } // constructor

  /**
   * Додає регістр(и) для логування
   * @param {Object | Array } reg - (масив) опис регістра
   * @returns
   */
  addReg(reg = undefined) {
    let trace = 1,
      ln = this.ln + "addRegs()::";
    if (reg == undefined) {
      throw new Error(ln + "regs=undefined");
    }
    if (Array.isArray(reg)) {
      for (let i = 0; i < reg.length; i++) {
        const element = reg[i];
        this.addReg(element);
      }
      return;
    }
    // не масив отже додаємо
    if (!reg.id) {
      throw new Error(ln + "reg.id=undefined");
    }
    this.regs[reg.id] = new ClassLoggerRegisters(reg);
    this.regsId.push(reg.id);
  }

  /**
   * Продовжує запис процесу у вказаний файл (наприклад після збою - продовжити процес)
   * 2024-04-23 Очікує реалізіції
   * @param {String} fileName - назва файлу логу
   */
  resume(fileName) {
    if (!this.fileManager.exist(fileName)) {
      throw new Error(
        `Cant resume write file, because the Log File '${fileName}' does not exist`
      );
    }
    this.fileName = fileName;
  }

  /**
   * Запускає процес запису
   * @param {*} fileName
   */
  async start(fileName = "") {
    let trace = 1;
    let ln = this.ln + `start(${fileName})::`;

    // ------------ імя файлу не вказано, або це тимчасовий файл -------------
    if (fileName === "" || fileName == this.tmpLogFileName) {
      fileName = this.tmpLogFileName;
      // видаляємо tmp-файли, бо якщо показувати записи за минулий день - дуже стиснутий графік
      // 1. тому ми обрізаємо тимчасовий файл і залишаємо останні 3 години
      // 2. у Замовника сервер буде перезапускатися рідко, тому все буде працювати Ок
      // 3. після  закінчення програми запис буде починатися з початку
      // 4. при наладці, коли змінюєш перелік логуємих регістрів і файл не видаляється - потрібно
      // видаляти тимч. файл вручну, а так це виконується автоматично
      let fn = fileName + this._fileExtensions["logger"];
      if (this.fileManager.exist(fn)) {
        await this.fileManager.deleteFile(fn);
        log("w", ln + `File ${fn} was deleted`);
      }

      fn = fileName + this._fileExtensions["points"];
      if (this.fileManager.exist(fn)) {
        await this.fileManager.deleteFile(fn);
        log("w", ln + `File ${fn} was deleted`);
      }
    } // if (fileName === "")

    ln = this.ln + `start(${fileName})::`;
    this.fileName = fileName;
    trace ? log("i", ln, `Started`) : null;
    // якщо вказаного файлу немає - пишемо заголовки
    if (
      !this.fileManager.exist(this.fileName + this._fileExtensions["logger"])
    ) {
      let firstLine = "time";
      for (let key in this.regs) {
        if (this.regs.hasOwnProperty(key)) {
          firstLine += `\t${this.regs[key].id}`;
        }
      }
      firstLine += "\n";
      await this.fileManager.writeFile(
        this.fileName + this._fileExtensions["logger"],
        firstLine
      );
    } //if (!this.fileManager.exist(this.fileName+this._fileExtensions["logger"]))

    // запускаємо очищення тимчасового файлу
    if (this.fileName === this.tmpLogFileName) {
      // оскільки сервер може не перезапускатися тижнями,
      // періодично обрізаємо дані
      // що старше останніх хх годин (період див. в описі функції)
      await this.truncateTmpFile();
    }

    // змінюємо стан
    this.state = this._states.started;
    let msg = ` "${this.fileName + this._fileExtensions.logger}" `;
    // запускаємо періодичне опитування
    await this.writeLine();
    // додаємо визначну точку
    this.addPoint({
      ua: `Запис ${msg} розпочато`,
      en: `Write file ${msg} started.`,
      ru: `Запись ${msg} начата.`,
    });
  } //   async start(fileName = "")

  /**
   * Опитує поточний стан регістрів та записує їх в поточний файл.
   * @returns Promise
   */
  async writeLine() {
    let trace = 0,
      ln = this.ln + "writeLine()::";
    // якщо режим не "started" - виходимо
    if (this.state.id != "started") {
      log("i", ln, 'state.id != "started" exit.');
      if (trace) {
        log("i", ln, `this.state=`);
        console.dir(this.state);
      }
      return 1;
    }

    // опитуємо датчики + формуємо рядок для запису
    let line = getCurrTimeString();
    for (let i = 0; i < this.regsId.length; i++) {
      let regName = this.regsId[i];
      let reg = this.regs[regName];
      let val = await reg.getValue();
      trace ? log("i", ln, `${reg.id}.getValue()=`, val) : null;
      val = val === undefined || val === null || isNaN(val) ? -5 : val;
      reg.value = val;
      line += `\t${val}`;
    }
    line += "\n";
    this.lastDataLine = line;

    await this.fileManager.appendFile(
      this.fileName + this._fileExtensions.logger,
      line
    );
    trace ? log("", ln, `Was appended line=`, line) : null;

    // плануємо наступний запуск
    setTimeout(() => {
      this.writeLine();
    }, this.period);
  }

  /**
   * Перевіряє тимчасові файли, залишає інформацію за останню добу
   * Так як при перерві в роботі файл tmp буде маленький, а між останніми точками буде
   * декілька діб, тому розмір не перевіряємо, а просто залишаємо інфо за останню добу
   *
   */
  async truncateTmpFile() {
    let fileName = this.fileName;
    // --- якщо це файл тимчасового логу плануємо наступгий запуск через 1 годину---------------
    if (fileName === this.tmpLogFileName) {
      let trimTo = Date.now() - 4 * 60 * 60 * 1000; // останні 4 години
      // перевіряємо розмір файлу
      try {
        this.fileManager.truncateFileBeforeDate(
          fileName + this._fileExtensions.logger,
          trimTo
        );
        this.fileManager.truncateFileBeforeDate(
          fileName + this._fileExtensions.points,
          trimTo
        );
      } catch (error) {
        log("e", ln + `File  not exist`);
      }
      setTimeout(() => {
        this.truncateTmpFile();
      }, 1 * 60 * 60 * 1000);
    }
  } //  async truncateTmpFile()

  /**
   * Додає визначну точку процесу в файл етапів
   * @param {Object} note={ua:"???",en:"???",ru:"???"} - опис точки
   */
  async addPoint(note = { ua: "???", en: "???", ru: "???" }) {
    let trace = 1,
      ln = this.ln + "addPoint()::";
    let line = getCurrTimeString() + "\t" + JSON.stringify(note) + "\n";
    await this.fileManager.appendFile(
      this.fileName + this._fileExtensions.points,
      line
    );
    log("i", ln, `Process point: "${note.en}" was appended! `);
  } //async addPoint(note

  /**
   * Повертає рядок з поточними значеннями регістрів для запиту з браузера
   *  "05.04.2024, 13:44:36\t195\t199\n"
   */
  getRegsValue() {
    let trace = 1,
      ln = this.ln + "getRegsValue()";
    return this.lastDataLine;
  } //getRegsValue()

  async getFile(fileName = "", fileExt = "") {
    let trace = 1,
      ln = this.ln + ` getFile(${fileName})`;
    fileName = fileName === "" ? this.fileName : fileName;
    fileExt = fileExt === "" ? this._fileExtensions.logger : fileExt;
    return await this.fileManager.readFile(fileName + fileExt);
  }

  async getLoggerArchiv(fileName = "") {
    return this.getFile(fileName, this._fileExtensions.logger);
  }

  async getPointsArchiv(fileName = "") {
    return this.getFile(fileName, this._fileExtensions.points);
  }

  getCompactHtml(req) {
    let html = pug.renderFile(
      resolvePath(
        req.locals.homeDir +
          "/controllers/loggerManager/views/loggerCompact.pug"
      ),
      {
        entity: req.entity,
        logger: req.entity.loggerManager,
      } //homeUrl: req.entity.devicesManager.homeUrl, content
    );
    return html;
  } //getCompactHtml (req){

  getFullHtml(req) {
    let chart = this.getCompactHtml(req);
    let html = pug.renderFile(
      resolvePath(
        req.locals.homeDir + "/controllers/loggerManager/views/loggerFull.pug"
      ),
      {
        entity: req.entity,
        logger: req.entity.loggerManager,
        chart: chart,
      } //homeUrl: req.entity.devicesManager.homeUrl, content
    );
    return html;
  } //getFullHtml (req)
}; // class ClassLoggerManager

/** Повертає текстове подання поточного часу
 *  винесено окремою функцією, щоб за потреби змінити формат часу в усіх файлах в одночасно
 */
function getCurrTimeString() {
  return new Date().toISOString();
}
