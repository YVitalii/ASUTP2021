const {open} = require('fs/promises');

// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;

// (async () => {
//   console.log("In anonime function");
//   let fh = await open(__dirname+"/test.txt","a+");
//   console.log('------------------ fh.open ---------------');
//   console.dir(fh);
//   await fh.appendFile((new Date()).toISOString()+" -->  test note was added!"+'\n' )
//   console.log('------------------ fh.appendFile ---------------');
//   await fh.close();
//   console.log('------------------ fh.close ---------------');
// })();
async function loadFile(fName) {
  // ----------- настройки логгера локальные --------------
  let logN=logName+"loadFile('"+fName+"'):";
  let trace=1;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // ------------
  let data="";
  try {
    // открываем файл
    let fh = await open(fName,"r");
    trace ? log("i",logN,"File opened.") : null;
    // читаем файл
    let data = await fh.readFile({encoding:"utf-8"});
    trace ? log("i",logN,"File readed: data=") : null;
    trace ? console.log(data) : null;
    // парсим
    let result = JSON.parse(data);
    trace ? console.dir(result) : null;
    // возвращаем результат
    return Promise.resolve(result);
  } catch(err) {
    // ошибка
    return Promise.reject(err);
  }

} //loadFile(fName)

loadFile(__dirname+"/userRecords.json");
