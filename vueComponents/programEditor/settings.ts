// settings.ts — константи налаштувань для ProgramEditor

export const settings = {
  URLs: {
    baseUrl: window.location.pathname, // базова адреса сторінки
    getFilesList: "/getFilesList", // POST body={} → { err:null, data:fName[] }
    deleteFile: "/deleteFile", // POST body={fName}
    writeFile: "/writeFile", // POST body={fName, content}
    readFile: "/readFile", // POST body={fName}
    activate: "/acceptFile", // POST body={fName}
    getProcessState: "/getProcessState", // POST body={} → { err:null, data:{ acceptedProgram, programRunning } }
    getTasksDescription: "/getTasksDescription", // POST body={} → { err:null, data:{ [id]: getDescription() } }
    runningProgramName: "/process/state", // POST body={}
  },
  header: "Редактор програми", // заголовок сторінки
  develop: false, // true — usePostJson читає mockServer; false — реальний fetch
  minScreenWidth: 900, // нижче цього — зони одна під одною
  minControlAreaWidth: 300, // ширина ControlArea у горизонтальному режимі
};

/** /getFilesList на сторінці /entity/.../tasksManager → /entity/.../tasksManager/getFilesList */
export function apiUrl(path: string) {
  const page = window.location.pathname.replace(/\/+$/, "");
  return `${page}${path}`;
}
