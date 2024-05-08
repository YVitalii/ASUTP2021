//- парсимо отримані з сервера дані, та зберігаємо їх в fileManager
//let fileManager= JSON.parse( '!{JSON.stringify(manager.fileManager.reg)}' );
// передаємо контейнер в якому буде побудований менеджер файлів

let props = {};
props.container = document.getElementById("fileManagerContainer");

// тут рендер елементів
props.types = myElementsRender;

props.id = "fileManager";
props.homeUrl = logMan.homeUrl;
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
  reg: {
    classes: ["btn-primary"],
    header: { ua: "Зберегти", en: "Save", ru: "Сохранить" },
  },
  onclick: async function (e) {
    let trace = 1,
      ln = "btnReport::onClick::";
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
  }, //onclick:
};

// ------------------- btnReport -----------------------------
props.buttons.reg.regs.btnReport = {
  reg: {
    classes: ["btn-success"],
    header: { ua: "Створити звіт", en: "Create report", ru: "Создать отчет" },
  },
  action: "link",
  onclick: async function (e) {
    let fileName = fileManager.getFileName();
    let trace = 1,
      ln = `btnReport(${fileName})::onClick::`;
    trace ? console.log(ln + ` Pressed!`) : null;
    this.el.setAttribute("href", logMan.homeUrl + "/report/" + fileName);
    if (trace) {
      console.log(ln + `this=`);
      console.dir(this);
    }
    //let data = tasks.model.getValues();
    // Беремо імя файлу зі списку файлів а не з форми, так як там можуть бути
    // змінені та не збережені дані, тобто спочатку зберегти - потім Застосувати

    // if (
    //   !confirm(
    //     {
    //       ua: `Ви дійсно бажаєте завантажити програму "${fileName}"?`,
    //       en: `Do You really want to load program  "${fileName}"?`,
    //       ru: `Вы действительно хотите загрузить программу "${fileName}"?`,
    //     }[lang]
    //   )
    // ) {
    //   console.log(ln + "Cancelled by user.");
    //   return;
    // }
    // try {
    //   // запит на сервер
    //   let res = await acceptFile("acceptFile", {
    //     fileName,
    //   });
    //   if (trace) {
    //     console.log(ln + `res=`);
    //     console.dir(res);
    //   }
    //   if (res.err) {
    //     throw new Error(res.err[lang]);
    //   }
    //   fileManager.currPrg.setValue(fileName);
    // } catch (error) {
    //   console.error(error);
    //   // Помилка
    //   alert(error.message);
    // } // try catch
  }, // onclick
};
// ------------------- btnDelete -----------------------------
props.buttons.reg.regs.btnDelete = {
  reg: {
    classes: ["btn-warning"],
    header: { ua: "Видалити", en: "Delete", ru: "Удалить" },
  },
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
          ua: `Ви дійсно бажаєте видалити запис: "${fileName}"?`,
          en: `Do You really want to delete the record:  "${fileName}"?`,
          ru: `Вы действительно хотите удалить запись: "${fileName}"?`,
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
      await logMan.fileManager.init();
    } catch (error) {
      // Помилка
      alert(error.message);
      console.error(error);
    } // try catch
  }, //oclick,
};

props.filesList = {
  container: document.getElementById("el_fileMan_listFiles"),
  attributes: { size: 25 },

  afterChange: async () => {
    // функція обробки зміни поля filesList
    let fName = logMan.fileManager.getFileName();
    let trace = 1,
      ln = `filesList::afterChange(${fName})::`;
    trace ? console.log(ln, `Started`) : null;
    let res;
    try {
      //
      res = await fileManager.post("readTasks", {
        fileName: fName,
      });

      //chartMan.chart.start();
    } catch (error) {
      console.error(ln + error.message);
    }
    if (!res || res.err || res.data == null || res.data == undefined) {
      res && res.err ? console.error(res.err) : null;
      logMan.tasks.data = [
        { name: undefined, note: undefined, started: undefined },
      ];
    }
    if (res && res.data) {
      logMan.tasks.data = JSON.parse(res.data);
    }
    logMan.tasks.render();
    chartMan.chart.reload(fName);
  }, //afterChange

  reg: {
    prefix: props.id,
    id: "filesList",
    value: undefined, //список поточних задач вже завантажено з сервера беремо ім'я
    header: {
      ua: `Список записів`,
      en: `The list of records`,
      ru: `Список архивов`,
    },
    comment: {
      ua: `Виберіть архів`,
      en: `Select the record`,
      ru: `Выберите архив`,
    },
    type: "selectGeneral",
    regs: ["Пусто"],
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
logMan.fileManager = fileManager;

// зачантажуємо список файлів з сервера
logMan.fileManager.init = async () => {
  let ok = false;
  while (!ok) {
    try {
      await logMan.fileManager.loadFilesList();
      logMan.fileManager.setFileName(logMan.currentFile);
      ok = true;
    } catch (error) {
      let s = 5;
      console.err(
        ln + `error.message=${error.message}. Try again after ${s}s.`
      );
      await myTools.dummy(s * 1000);
    }
  }
}; //logMan.fileManager.init = async ()

logMan.fileManager.init();

// Зробити автоматичний вибір поточного лог-файлу на разі видається пусте поле якщо до цього не клацнути на списку
// також після видалення файлу в полі value залишається імя вже видаленого файлу
