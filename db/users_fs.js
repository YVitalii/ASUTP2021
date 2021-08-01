/** @module /db/users_fs.js  */


const {open} = require('fs/promises');

// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;

/**
  загружает  записи из файла fName, возвращает промис c данными или ошибку
  * @param {string} fName Имя файла
  * @returns {Promise} Промис содержащий данные из базы данных в виде объекта или ошибку
*/

async function loadFile(fName) {
  // ----------- настройки логгера локальные --------------
  let logN=logName+"loadFile('"+fName+"'):";
  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
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
    fh.close();
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
module.exports.loadFile=loadFile;

/**
  записывает объект в файл, возвращает промис 
  * @param {string} fName Имя файла
  * @param {object} data  объект с данными
  * @returns {Promise} Промис reject(err) / resolve (1)
*/

async function saveFile(fName,data) {
  // ----------- настройки логгера локальные --------------
  let logN=logName+"saveFile('"+fName+"'):";
  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // ------------
  try {
    // готовим строку для записи в файл
    let parsedData=JSON.stringify(data);
    // открываем файл
    let fh = await open(fName,"w");
    trace ? log("i",logN,"File opened.") : null;
    // пишем в файл
    let result = await fh.writeFile(parsedData,{encoding:"utf-8"});
    trace ? log("i",logN,"File fileName="+fName+" was writed !") : null;
    trace ? console.dir(result) : null;
    fh.close();
    // возвращаем результат
    return Promise.resolve(1);
  } catch(err) {
    // ошибка
    return Promise.reject(err);
  }
} //saveFile(fName)
module.exports.saveFile=saveFile;


if (! module.parent) {
    (async () =>{
        let records={};
        try {
          // загружаем файл
          records= await loadFile(__dirname+"/userRecords.json");
          console.log("------------- Records loaded: ------------");
          console.dir(records);
          // записываем в файл полученную информацию
          await saveFile(__dirname+"/testSave_userRecords.json",records);
        } catch (e) {
          console.log(e);
        };//catch
    })();

}; //if (! module.parent)
