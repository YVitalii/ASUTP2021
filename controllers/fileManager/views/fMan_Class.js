const ClassFileManager = class FileManager {
  /**
   *
   * @param {Object} props - список параметрів
   * @prop {String} props.id - ідентифікатор менеджера
   * @prop {Object} props.types - рендер myElRender
   * @prop {DOM node} props.container - контейнер для відображення елементу
   * @prop {ClassButtonGroup} props.buttons - об'єкт з описом кнопок керування типу ClassButton
   * @prop {selectGeneral} props.filesList - елемент вибору назви файлу
   * @prop {async Function} props.getFilesList - елемент вибору назви файлу
   * @prop {async Function} props.homeUrl - адреса за якою виконуються запити
   */

  constructor(props) {
    this.ln = `ClassFileManager(${props.id})::`;
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    //debugger;
    this.id = props.id;
    // list of types
    this.types = props.types;
    //
    this.homeUrl = (props.homeUrl ? props.homeUrl : "") + "/fileManager";
    // container
    this.container = props.container
      ? props.container
      : console.error(this.ln + "Container not defined!");

    // list of buttons
    this.buttons = {};
    if (props.buttons) {
      props.buttons.types = this.types;
      this.buttons = new this.types["buttonGroup"](props.buttons);
    }
    // listFiles
    this.filesList = new this.types["selectGeneral"](props.filesList);

    this.getFilesList = props.getFilesList
      ? props.getFilesList
      : () => {
          console.log(this.ln + "Function getListFiles() not defined");
          return [];
        };
  } //constructor

  getFileName = () => {
    return this.filesList.getValue();
  };

  renderFilesList(regs) {
    // промальовує елемент
    this.filesList.render(regs);
  }

  setFileName(fName) {
    this.filesList.setValue(fName);
  }

  async loadFilesList() {
    try {
      // запит на сервер
      let { err, data } = await fileManager.post("getFilesList", {});
      // Підтвердження
      this.renderFilesList(data);
    } catch (error) {
      console.error(error);
    } // try catch
  }

  async post(path, addData = {}) {
    let trace = 1,
      ln = this.ln + `::post(${path})::`;

    // адреса для запиту
    let baseUrl = this.homeUrl;
    trace ? console.log(ln + `path=${path};; baseUrl=${baseUrl}`) : null;
    // імя файлу
    let fileName = addData.fileName
      ? addData.fileName
      : this.filesList.getValue();
    addData["fileName"] = fileName;
    // запит POST baseUrl +
    let response = await fetch("fileManager/" + path, {
      method: "POST",
      headers: { "Content-type": "application/json;charset=utf-8" },
      body: JSON.stringify(addData), //  ,
    });
    // if (trace) {
    //   console.log(ln + `response=`);
    //   console.dir(response);
    // }
    if (response.status === 200 || response.status === 400) {
      // отримуємо результат
      let result = await response.json();

      if (trace) {
        console.log(ln + `result=`);
        console.dir(result);
      }
      if (result.err != null) {
        //console.error(ln + "Error::" + result.err[lang]);
        throw new Error(result.err[lang]);
      }
      console.log(
        ln +
          `url=${baseUrl + "/" + path}?fileName=${fileName}. Успішно виконаний!`
      );
      return result;
    } else {
      let msg = ln + "Error post request code=" + response.status;
      console.error(msg);
      throw new Error(ln + msg);
    } //if (response.status === 200)
  } // post()
};
