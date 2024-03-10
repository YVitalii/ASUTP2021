//- парсимо отримані з сервера дані, та зберігаємо їх в fileManager
//let fileManager= JSON.parse( '!{JSON.stringify(manager.fileManager.reg)}' );
// передаємо контейнер в якому буде побудований менеджер файлів
let props = {};
props.container = document.getElementById("fileManagerContainer");
props.types = myElementsRender;
props.id = "fileManager";
//- props.reg ={
//-   id:"fileManager",
//-   header:{ua:"",en:"",ry:""},
//-   ln:"tasks_fileManager.js::"
//- }
props.buttons = {
  container: document.getElementById("el_fileMan_btnGroup"),
  reg: {
    id: props.id + "_btnGroup",
    header: { ua: "", en: "", ru: "" },
    type: "buttonGroup",
    regs: {},
  },
};

props.buttons.reg.regs.btnSave = {
  classes: ["btn-primary"],
  header: { ua: "Зберегти", en: "Save", ru: "Сохранить" },
  onclick: async function (e) {
    let trace = 1,
      ln = "btnAccept::onClick::";
    trace ? console.log(ln + ` Pressed!`) : null;
    // Отримуємо дані
    let content = tasks.model.getValues();
    let fileName = content[0].name;
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте зберегти програму "${fileName}"?`,
          en: `Do You really want to save the program  "${fileName}"?`,
          ru: `Вы действительно хотите сохранить программу "${fileName}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }

    try {
      // запит на сервер
      let { err, data } = await fileManager.post("writeFile", {
        fileName,
        content,
      });
      await fileManager.loadFilesList();
      // Підтвердження
      alert(data[lang]);
    } catch (error) {
      console.error(error);
    } // try catch
  },
};

props.buttons.reg.regs.btnAccept = {
  classes: ["btn-success"],
  header: { ua: "Застосувати", en: "Accept", ru: "Применить" },
  onclick: async function (e) {
    let trace = 1,
      ln = "btnAccept::onClick::";
    trace ? console.log(ln + ` Pressed!`) : null;
    let data = tasks.model.getValues();
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте завантажити програму "${data[0].name}"?`,
          en: `Do You really want to load program  "${data[0].name}"?`,
          ru: `Вы действительно хотите загрузить программу "${data[0].name}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }

    if (trace) {
      console.log(ln + `data=`);
      console.dir(data);
    }
  }, // onclick
};

props.buttons.reg.regs.btnDelete = {
  classes: ["btn-warning"],
  header: { ua: "Видалити", en: "Delete", ru: "Удалить" },
  onclick: async function (e) {
    let trace = 1,
      ln = "btnDelete::onClick::";
    trace ? console.log(ln + ` Pressed!`) : null;
    if (trace) {
      console.log(ln + `this=`);
      console.dir(this);
    }
    let fileName = fileManager.getFileName(); //tasks.model.getValues();
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте видалити програму "${fileName}"?`,
          en: `Do You really want to delete the program  "${fileName}"?`,
          ru: `Вы действительно хотите удалить программу "${fileName}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }
    try {
      // запит на сервер
      let { err, data } = await fileManager.post("deleteFile", {
        fileName,
      });
      await fileManager.loadFilesList();
      // Підтвердження
      alert(data[lang]);
    } catch (error) {
      console.error(error);
    } // try catch
  }, //oclick,
};

props.filesList = {
  container: document.getElementById("el_fileMan_listFiles"),
  attributes: { size: 10 },
  afterChange: async () => {
    // функція обробки зміни поля filesList
    let trace = 1,
      ln = "fileList::afterChange::";
    try {
      let { err, data } = await fileManager.post("readFile");
      tasks.renderList(data);
    } catch (error) {
      console.error(ln + error.message);
    }
  },

  reg: {
    prefix: props.id,
    id: "filesList",
    value: "task01.json",
    header: {
      ua: `Список програм`,
      en: `The list of program`,
      ru: `Список программ`,
    },
    comment: {
      ua: `Виберіть програму`,
      en: `Select a program`,
      ru: `Выберите программу`,
    },
    type: "selectGeneral",
    regs: ["Пусто", "Prg1"],
  },
  setOption: (val) => {
    return val.split(".")[0];
  },
  // непотрібна так як в value елемента зберігається імя файла повністю
  // getOption: (val) => {
  //   return "" + val + ".json";
  // },
};

const fileManager = new ClassFileManager(props);
