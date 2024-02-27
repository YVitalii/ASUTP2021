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
  onclick: function (e) {
    let trace = 1,
      ln = "btnAccept::onClick::";
    trace ? console.log(ln + ` Pressed!`) : null;
    let data = tasks.model.getValues();
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте зберегти програму "${data[0].name}"?`,
          en: `Do You really want to save the program  "${data[0].name}"?`,
          ru: `Вы действительно хотите сохранить программу "${data[0].name}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }
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
  onclick: function (e) {
    let trace = 1,
      ln = "btnDelete::onClick::";
    trace ? console.log(ln + ` Pressed!`) : null;
    let data = tasks.model.getValues();
    if (
      !confirm(
        {
          ua: `Ви дійсно бажаєте видалити програму "${data[0].name}"?`,
          en: `Do You really want to delete the program  "${data[0].name}"?`,
          ru: `Вы действительно хотите удалить программу "${data[0].name}"?`,
        }[lang]
      )
    ) {
      console.log(ln + "Cancelled by user.");
      return;
    }
  },
};

props.listFiles = {
  container: document.getElementById("el_fileMan_listFiles"),
  reg: {
    id: props.id + "fileList",
    reg: {
      id: "fileList",
      header: {
        ua: `Список програм`,
        en: `The list of program`,
        ru: `Список программ`,
      },
      cooment: {
        ua: `Виберіть програму`,
        en: `Select a program`,
        ru: `Выберите программу`,
      },
      type: "selectGeneral",
      regs: ["Пусто"],
    },
  },
};

const fileManager = new ClassFileManager(props);
