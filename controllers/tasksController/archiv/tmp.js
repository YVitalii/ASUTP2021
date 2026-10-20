// константа з налаштуваннями компонента ProgramEditor
const settings = {
  URLs: {
    baseUrl: window.location.pathname, // базова адреса сторінки
    getFilesList: "/getFilesList", // POST body={}
    deleteFile: "/deleteFile", // POST body={fileName="prg1"}
    writeFile: "/writeFile", // POST body={fileName="prg1",content:text-json}
    readFile: "/readFile", // POST body={fileName="prg1"}
    runningProgramName: "/process/state", // POST body={}
  },
  header: "Редагування програми", //заголовок сторінки
};
// стан компонента ProgramEditor
const state = {
  activeProgramName: "", //=  getFilesList()[0]
  programEdited: true, // local
  programList: ["prg1", "prg2"], // POST request every 5 minutes
  programContent: [
    // POST request after change activeProgramName
    // вміст активної програми
    // передаємо в ProgramManager
  ],
  runningProgramName: null | "runnigProgramName", // POST request every 5 minutes
};

/**
 *  @startuml
 * title: алгоритм роботи
 * :Очікуємо завантаження компонентів;
 * @enduml
 * */

/*
Тепер давай винесемо кнопки в окремий компонент: ../fields/Button.vue
Налаштування кнопки: 
settings={
    title:"Напис на кнопці",
    style:"Bootstrap style: info/alert/warning/...",
    state: "active ",
    dasable:true,
}
this.onClick:() => {console.log(`Button [${this.title}] clicked`}}

потім на основі цього шаблону ми створюємо наприклад компонент BtnSave.vue
*/
