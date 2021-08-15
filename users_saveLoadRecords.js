const {loadFile,saveFile} = require('./users_fs.js'); // модуль для работы с файлами

/**
  загружает  записи из файла fName=__dirname+"/userRecords.json",

  если загрузить не удалось, пробует загрузить данные из резервного файла backupFname=__dirname+"/backupUserRecords.json",
  если и из резервного файла записи загрузить не удалось - создает новые файлы с пользователями по умолчанию.
  * @property {object} records                 - ссылка на объект с пользователями
  * @returns {Promise} Промис содержащий данные  из базы данных в виде объекта
*/
async function loadRecords() {
  // ----------- настройки логгера локальные --------------
  let logN=logName+"loadRecords():";
  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  //let records={};
  //let title="User.constructor:loadRecords()";
  try {
    // пробуем загрузить данные из рабочего файла
    records= await loadFile(fName);
    trace ? log("i",logN,"Файл" + fName+" загружен.") : null;
    //trace ? console.dir(records) : null;
  } catch (e) {
      try {
        // загрузить из рабочего файла не удалось, пробуем из резервного
        log("e",logN,"Ошибка загрузки основного файла:"+e.message);
        //console.error(e.message);
        records= await loadFile(backupFname);
        trace ? log("i",logN,"Резервный файл: " + backupFname+" загружен.") : null;
        // восстанавливаем рабочий файл
        await saveFile(fName,records);
        trace ? log("w",logN,"Основной файл: " + fName+" восстановлен из резервного.") : null;
      } catch (e) {
        log("e",logN,"Ошибка загрузки резервного файла: "+e.message);
        //console.dir(e);
        // если все файлы не валидны, пробуем создать новый с параметрами по умолчанию;
        let startData={};
        startData[defaultAdmin.userName]=defaultAdmin;
        startData[defaultGuest.userName]=defaultGuest;
        // заносим данные по умолчанию в записи
        records=startData;
        try {
          // пробуем восстановить основной файл
          await saveFile(fName,startData);
          trace ? log("w",logN,"Основной файл: " + fName+" восстановлен из значений по умолчанию.") : null;
          // пробуем восстановить резервный файл
          await saveFile(backupFname,startData);
          trace ? log("w",logN,"Резервный файл: " + backupFname+ " восстановлен из значений по умолчанию.") : null;
        } catch (e) {
          log("e",logN,"Ошибка восстановления стартовых файлов : "+e.message);
        }

      }
  }
 //return records
}; //function loadRecords()


module.exports.loadRecords = loadRecords;
