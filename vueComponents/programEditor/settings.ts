// settings.ts — константи налаштувань для ProgramEditor

export const settings = {
  URLs: {
    baseUrl: window.location.pathname, // базова адреса сторінки
    getFilesList: "/getFilesList", // POST body={}
    deleteFile: "/deleteFile", // POST body={fileName="prg1"}
    writeFile: "/writeFile", // POST body={fileName="prg1", content:text-json}
    readFile: "/readFile", // POST body={fileName="prg1"}
    runningProgramName: "/process/state", // POST body={}
  },
  header: "Редактор програми", // заголовок сторінки
};
