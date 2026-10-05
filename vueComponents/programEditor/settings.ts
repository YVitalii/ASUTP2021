// settings.ts — константи налаштувань для ProgramEditor

export const settings = {
  URLs: {
    baseUrl: window.location.pathname, // базова адреса сторінки
    getFilesList: "/getFilesList", // POST body={}
    deleteFile: "/deleteFile", // POST body={fileName: program[0].title}
    writeFile: "/writeFile", // POST body={fileName: program[0].title, content}
    readFile: "/readFile", // POST body={fileName: program[0].title}
    activate: "/acceptFile", // POST body={fileName: program[0].title}
    getProcessState: "/getProcessState", // POST body={} → { err:null, data:{ acceptedProgram, programRunning } }
    runningProgramName: "/process/state", // POST body={}
  },
  header: "Редактор програми", // заголовок сторінки
  develop: true, // true — usePostJson читає mockServer; false — реальний fetch
  minScreenWidth: 900, // нижче цього — зони одна під одною
  minControlAreaWidth: 300, // ширина ControlArea у горизонтальному режимі
};
