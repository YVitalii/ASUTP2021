//- парсимо отримані з сервера дані, та зберігаємо їх в fileManager
//let fileManager= JSON.parse( '!{JSON.stringify(manager.fileManager.reg)}' );
// передаємо контейнер в якому буде побудований менеджер файлів
let props = {};
props.container = document.getElementById("fileManagerContainer");
// тут зберігаються всі елементи
props.types = myElementsRender;

//props.value = tasks.value;

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
    //let data = tasks.model.getValues();
    // Беремо імя файлу зі списку файлів а не з форми, так як там можуть бути
    // змінені та не збережені дані, тобто спочатку зберегти - потім Застосувати
    let fileName = fileManager.getFileName();
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте завантажити програму "${fileName}"?`,
          en: `Do You really want to load program  "${fileName}"?`,
          ru: `Вы действительно хотите загрузить программу "${fileName}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }
    try {
      // запит на сервер
      let { err, data } = await acceptFile("acceptFile", {
        fileName,
      });
      if (err) {
        throw new Error(error[lang]);
      }
      if (trace) {
        console.log(ln + `data=`);
        console.dir(data);
      }
      fileManager.currPrg.setValue(fileName);
    } catch (error) {
      console.error(error);
      // Помилка
      alert(error.message);
    } // try catch
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
      if (err) {
        alert(err[lang]);
      }
      await fileManager.loadFilesList();
    } catch (error) {
      // Помилка
      alert(error.message);
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
    value: props.value,
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

fileManager.currPrg = new props.types["text"]({
  container: document.getElementById("fileMan_currPrg"),
  attributes: { size: 10 },
  reg: {
    id: "currPrg",
    value: "default",
    header: {
      ua: `Програма для виконання`,
      en: `The active program`,
      ru: `Текущая программа`,
    },
    comment: {
      ua: `Для зміни програми натисніть кнопку "Застосувати"`,
      en: `For set The active program push "Accept" button`,
      ru: `Для выбора активной программы нажмите кнопку "Применить"`,
    },
    type: "text",
    editable: false,
  },
});

async function acceptFile(path, addData = {}) {
  let trace = 1,
    ln = `tasks_fileManager.js::acceptFile::.post(${path})::`;
  trace
    ? console.log(ln + `Started: path=${path}; fileName=${addData.fileName}`)
    : null;
  // let req =
  // запит POST
  let response = await fetch(path, {
    method: "POST",
    headers: { "Content-type": "application/json;charset=utf-8" },
    body: JSON.stringify(addData), //  ,
  });
  if (response.status === 200) {
    // отримуємо результат
    let result = await response.json();
    trace
      ? console.log(
          ln + `url=${path}?fileName=${addData.fileName}. Успішно виконаний!`
        )
      : null;
    if (trace) {
      console.log(ln + `result=`);
      console.dir(result);
    }
    if (result.err != null) {
      console.error(ln + "Error" + err[lang]);
      throw new Error(ln + err[lang]);
    }
    return result;
  } else {
    let msg = ln + "Error post request code=" + response.status;
    console.error(msg);
    throw new Error(ln + msg);
  } //if (response.status === 200)
} // acceptFile(
