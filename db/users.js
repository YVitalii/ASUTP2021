const fs=require('fs');
const bcrypt = require('bcrypt');
//import {open} from 'fs/promises';
//const fs = require('fs/promises');
var records= {}; // база зарегистрированных пользователей
//console.log("__dirname=",__dirname);
// const log = require('../tools/log.js');
const Err = require('../tools/apiError.js');
const fName=__dirname+"/userRecords.json"; //файл с текущими данными
const backupFname=__dirname+"/backupUserRecords.json"; // бекап предыдущей версии (на случай ошибки)
// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;

/**
  * @namespace
  * @property {object} user                -объект пользователя
  * @property {string} user.username        - логин
  * @property {string} user.password        - хеш пароля
  * @property {string} user.role            - название группы прав доступа
  * @property {string} user.displayName     - отображаемое имя
*/

const defaultAdmin={
  username:"admin",
  password:"$2b$10$ehdyX/6RNtgel/JVI7jvO.2gE1EMP8Ub2x.qvk0WmXVYDDran6Isq", // password="bortek"
  displayName:"Администратор",
  role:"admin"
} // defaultUser
const defaultGuest={
  username:"Гость",
  password:"$2b$10$EtM1rFVCvg7U/t1ih5oNAOisOGWfRdNlgBbjgppxODN9sxgqrTMlG", // password="12345"
  displayName:"Гость",
  role:"guest"
} // defaultUser

// если все файлы не валидны, создаем новый с параметрами по умолчанию password="bortek";
const startData={ };
startData[defaultAdmin.username]=defaultAdmin;
startData[defaultGuest.username]=defaultGuest;

/**
  * @namespace
  * @property {object}  roles                - объект описывающий права групп пользователей
  * @property {boolean} display              - отображаемая название группы
  * @property {boolean} logDelete            - может удалять лог-файлы
  * @property {boolean} userAddNew           - может добавлять нового пользователя
  * @property {boolean} userDelete           - может удалять пользователя
*/

const roles={
  admin:{
    display:"Администратор"
    ,userAddNew:true
    ,userDelete:true
    ,logDelete:true
  },
 guest:{
   display:"Гость"
 }
};


//if (bcrypt.compareSync('bortek',startData[0].password)) { console.log("----> Confirmed");} else { console.log("----> Not confirmed");}
//console.log("hashedPassw="+bcrypt.hashSync("12345",10));

/** загружает из файла записи, возвращает промис */
function loadFile(fName){
  return new Promise ((resolve,reject) => {
        fs.readFile(fName,{encoding:"utf-8",flag:"r"},(err,data) => {
          if (err) {reject(err)};
          resolve(data);
        })
    })
}; //function loadRecords

function saveFile(fName,data,cb){
  let records=JSON.stringify(data);
  fs.writeFile(fName,records,{encoding:"utf-8",flag:"w"}, (err) => {
    if (err) {cb(err);return}
    cb(null);
    return
  });
}; //function saveFile

/** Сохраняет изменения в базе записей + создает резервную копию
  @param cb(error)
*/

function saveChanges(cb) {
  // делаем резервную копию предыдущих записей
    saveFile(fName, records, (err) => {
      if (err) { cb(err); return }
      saveFile(backupFname, records, (err) => {
        if (err) { cb(err); return }
        cb(null);
      });//saveFile backup
    });//saveFile
}//funcion saveChanges(cb)

function loadRecords() {
  let title="User.constructor:loadRecords()";
   return loadFile(fName) // пробуем загрузить основной файл с базой пользователей
    .then(
      result => {
        // файл загружен
        result=JSON.parse(result);
        // файл обработан
        return result; // возвращаем объект с массивом пользователей
      })
    .catch( error => {
              log("e",title, " Can't open or parse file: ",fName,"; Err=",error);
              console.log("-------------------------------------------");
              return loadFile(backupFname)
                  .then (
                      result => {
                        // backup-файл прочитан
                        log("i",title,"Backup file '"+backupFname+"' loaded. ");
                        // парсим
                        let data=JSON.parse(result);
                        // переписываем неисправный основной файл
                        saveFile(fName,data,(err) => {
                          if (err) { log("e",title, " Can't write file: ",err.path); return };
                          log("w",title, " New file: '"+fName+"' was rewrited");
                          return
                        });
                        return data;
                      })
                  .catch( error => {
                        // ошибка чтения backup-файла
                        log("e",title, " Can't open or parse backup file: '",fName,"'; Err=",error)
                        // получаем данные по умолчанию (заводские установки)
                        saveFile(backupFname,startData,(err) => {
                          if (err) { log("e",title, " Can't write file: ",err.path); return };
                          log("w",title, " New file: '"+backupFname+"' was rewrited");
                          return
                        });
                        return startData}
                    );

                  }
      );
}; //function loadRecords()


loadRecords()
   .then(
     result => {
       records=result;
       //console.dir(records);
     }
   );

/** поиск по id */
// exports.findById = function(id, cb) {
//   process.nextTick(function() {
//     var idx = id - 1;
//     //log('i',"findById: ","records=",records,"; id=",id);
//     if (records[idx]) {
//       cb(null, records[idx]);
//     } else {
//       let err=new Err({
//                    en:'User ' + id + ' does not exist.'
//                   ,ru:'Пользователь '+ id +" не существует."
//                   ,ua:'Користувач '+ id +" не існує."
//                 });
//       cb(err,null);
//     }//else
//   });
// };//findById

/** поиск по имени пользователя */
exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    if (records[username]) {
      //console.dir(records[username]);
      cb(null, records[username]);
      return
    }
    let err=new Err({
                 en:'User "' + username + '" does not exist.'
                ,ru:'Пользователь "'+ username +'" не существует.'
                ,ua:'Користувач '+ username +'" не існує.'
              });
    return cb(err, null);
  });
}; //findByUsername
// --------------------------------------------------------
/** добавление нового пользователя */


function addNewUser(user,cb){
  // проверяем наличие пользователя
  if (! user) {
    let err=new Err({
                 en:"User not defined."
                ,ru:'Пользователь не указан'
                ,ua:'Користувача не вказано'
              });
     cb (err,null)
     return
   };
  // проверяем наличие имени пользователя
  if (! user.username) {
    let err=new Err({
                 en:"Field: username not defined."
                ,ru:'Поле username не указано'
                ,ua:'Поле username не вказано'
              });
     cb (err,null)
     return
   };
   // проверяем наличие пароля
   if (! user.password) {
     let err=new Err({
                  en:"Field: password not defined."
                 ,ru:'Поле password не указано'
                 ,ua:'Поле password не вказано'
               });
      cb (err,null)
      return
   };
   // проверяем длину пароля
   if (user.password.length<8) {
     let suff=" (<8)."
     let err=new Err({
                  en:"Password is too short"+suff
                 ,ru:'Пароль очень короткий'+suff
                 ,ua:'Пароль занадто короткий'+suff
               });
      cb (err,null)
      return
   };
   // проверяем роль
   if (! user.role) { user.role="guest"; };
   if (! roles[user.role]) {
     let suff=" (userrname='"+user.username+"'; user.role="+user.role+")"
     let err=new Err({
                  en:"Role is not defined"+suff
                 ,ru:'Роль пользователя неопределена'+suff
                 ,ua:'Роль користувача не визначена'+suff
               });
      cb (err,null);
      return
   };
   // ищем на совпадение имени
   this.findByUsername(user.username,(err,data) => {
     if (! err) {
       let suff=" (user.username="+user.username+")"
       let err=new Err({
                    en:"Dublicate user"+suff
                   ,ru:'Пользователь с таким именем уже зарегистрирован'+suff
                   ,ua:"Користувач з таким ім'ям  вже існує"+suff
                 });
      cb (err,null);
      return
     }
     // все нормально такого пользователя в базе нет
     user.displayName = user.displayName ? user.displayName : "Новый пользователь";
     user.password = bcrypt.hashSync(user.password,10);
     records[user.username]=user;
     saveChanges((err) => {
       if (err) {
         let suff=" (file="+err.path+")";
         let err=new Err({
                      en:"Can't save changes"+suff
                     ,ru:'Ошибка сохранения'+suff
                     ,ua:"Помилка збереження"+suff
                   });
        cb (err,null);
        return
      }; //if (err)
     });
     //console.dir(records);
     cb(null,user);
   });//findByUsername
}//addNewUser

exports.addNewUser = addNewUser;
/**
 * @param {number} username
 * @param {number} cb(err,deletedUser) результат
*/
function deleteUser(username,cb) {
  // id= undefined
  if (! username) {
    let err=new Err({
                 en:"No username specified"
                ,ru:'Не указан username'
                ,ua:"Не вказано username"
              });
   cb (err,null);
   return
 };
 // id=1=admin → нельзя удалять
 if (username == "admin") {
   let s="'admin'"
   let err=new Err({
                en:"Can't delete user:"+s
               ,ru:'Нельзя удалить пользователя:'+s
               ,ua:"Неможливо видалити користувача:"+s
             });
  cb (err,null);
  return
 }
  // проверяем наличие пользователя с таким  ID
  this.findByUsername(username, (err,data) => {
    if (err) {
      let suff=" username='"+username+"' ";
      let err=new Err({
                   en:"User"+suff+" not found "
                  ,ru:"Пользователь"+suff+' не найден'+suff
                  ,ua:"Користувача"+suff+" не знайдено"+suff
                });
     cb (err,null);
     return
   }; //if (err)
   // пользователь найден, удаляем
   records[username]=undefined;
   // сохраняем изменения
   saveChanges((err) => {
       if (err) {
         let suff=" (file="+err.path+")";
         let err=new Err({
                      en:"Can't save changes"+suff
                     ,ru:'Ошибка сохранения'+suff
                     ,ua:"Помилка збереження"+suff
                   });
        cb (err,null);
        return
    }; //if (err)
    cb(null,data);
  });// saveChanges
  });//findById
};//deleteUser(id,cb)
exports.deleteUser=deleteUser;

function verifyUser(username,password,cb){
  this.findByUsername(username, (err, user) => {
    if (err) { cb(err,null); return };
    // console.log("User finded user=");
    // console.dir(user);
    bcrypt.compare(password,user.password, (error,res) => {
      if (res) {
        // res=true пароль правильный
        // console.log("bcrypt.Password is Ok");
        cb(null,user);
        return };
      // res=false пароль неправильный
      // console.log("bcrypt. Password is Wrong");
      let suff=" user='"+username.path+"'";
      let err=new Err({
                   en:"Wrong password for "+suff
                  ,ru:'Неправильный пароль '+suff
                  ,ua:"Невірний пароль"+suff
                });
     cb (err,null);
     return
   });//bcrypt.compare
  }); //findByUsername
};//function verifyUser
exports.verifyUser=verifyUser;

if (! module.parent) {
  // let users=this;
  // let mocha=require('mocha.js');
  // mocha('./users_test.js');

  // let title="testing: ";
  // this.addNewUser({},(err,data) => {
  //   log("i",title,"err=",err);
  //   log("i",title,"data=",data);
  //   if (err) {log("e",title,err.ru);};
  // });
  // testing
  //const users=new User();
  // const users=[
  //   {id:1,username:"admin",password:"",displayName:"Администратор", role:roles["admin"]}
  // ]
}
