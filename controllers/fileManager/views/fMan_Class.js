const ClassFileManager = class FileManager {
  /**
   *
   * @param {Object} props - список параметрів
   *
   */

  constructor(props) {
    this.ln = `ClassFileManager(${props.id})::`;
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    this.id = props.id;
    // list of types
    this.types = props.types;

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
      ln = this.ln + `.post(${path})::`;
    // адреса для запиту
    let baseUrl = this.homeURL;
    // імя файлу
    let fileName = addData.fileName
      ? addData.fileName
      : this.filesList.getValue();
    addData["fileName"] = fileName;
    // запит POST
    let response = await fetch(baseUrl + path, {
      method: "POST",
      headers: { "Content-type": "application/json;charset=utf-8" },
      body: JSON.stringify(addData), //  ,
    });
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
        ln + `url=${baseUrl + path}?fileName=${fileName}. Успішно виконаний!`
      );
      return result;
    } else {
      let msg = ln + "Error post request code=" + response.status;
      console.error(msg);
      throw new Error(ln + msg);
    } //if (response.status === 200)
  } // post()
};
