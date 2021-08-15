/** @module /db/users  */
var {loadRecords,saveFile} = require('./users_fs.js'); // модуль для сохранения/загрузки данных пользователей
console.dir(loadRecords);
const bcrypt = require('bcrypt'); // шифровальщик
const {getCloneObj} = require('../tools/general');
const fName=__dirname+"/userRecords.json"; //имя файла с текущими данными
const backupFname=__dirname+"/backupUserRecords.json"; // имя файла с бекапом предыдущей версии (на случай ошибки)
var records= {}; // база зарегистрированных пользователей

const Err = require('../tools/apiError.js'); // мой класс ошибок

// ------------ логгер  --------------------
const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)
// ----------- настройки логгера локальные --------------
// let logN=logName+"описание:";
// let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
// trace ? log("i",logN,"Started") : null;

/**
  Объект пользователя, описывающий его
  * @property {object} user                 - объект пользователя
  * @property {string} user.userName        - логин
  * @property {string} user.password        - хеш пароля
  * @property {string} user.role            - название группы прав доступа
  * @property {string} user.displayName     - отображаемое имя
*/
const users={};
 // ----- пользователи по умолчанию ---------------------
const defaultAdmin={
  userName:"admin",
  password:"$2b$10$ehdyX/6RNtgel/JVI7jvO.2gE1EMP8Ub2x.qvk0WmXVYDDran6Isq", // password="bortek"
  displayName:"Администратор",
  role:"admin"
} // defaultUser
const defaultGuest={
  userName:"Гость",
  password:"$2b$10$EtM1rFVCvg7U/t1ih5oNAOisOGWfRdNlgBbjgppxODN9sxgqrTMlG", // password="12345"
  displayName:"Гость",
  role:"guest"
} // defaultUser


/**
  Справочник ролей пользователей, описывающий права доступа каждой роли
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










/** ищет по имени и возвращает ссылку на объект пользователя, для внутреннего использования
  * @property {String} userName   - объект пользователя
  * @returns {Promise} Промис содержащий данные из базы данных в виде ссылки на объект или ошибку
*/
async function getUserByName(userName){
  // ----------- настройки логгера локальные --------------
  let logN=logName+"getUserByName("+userName+"):";
  let trace=1;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // обрезаем пробельные символы
  userName=userName.trim();
  // ищем пользователя
  trace ? log("i",logN,"records=",records) : null;
  if (! records[userName]) {
    let err=new Err({
                 en:'User "' + userName + '" does not exist.'
                ,ru:'Пользователь "'+ userName +'" не существует.'
                ,ua:'Користувач '+ userName +'" не існує.'
              });
    trace ? log("e",logN,"err=",err.msg.ru) : null;
    // такого пользователя нет, возвращаем ошибку
    return Promise.reject(err);
  }
  // возвращаем пользователя
  return records[userName];
}; //getByUserName(userName)



/** ищет по имени и возвращает копию объекта пользователя для внешнего кода
  * @property {String} userName   - объект пользователя
  * @returns {Promise} Промис содержащий данные из базы данных в виде независимой копии объекта или ошибку
*/
async function pr_findByUserName(userName) {
  // ----------- настройки логгера локальные --------------
  let logN=logName+"pr_findByUserName()"+userName+"):";
  let trace=1;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("i",logN,"Started") : null;
  // ищем пользователя
  var newUser={};
  try {
    let user= await getUserByName(userName);
    // делаем копию объекта пользователя
    newUser=getCloneObj(user);
    // делаем копию прав доступа
    newUser.permissions=getCloneObj(roles[user.role]);
    // убираем хеш пароля
    newUser.password=null;
    // возвращаем
    trace ? log("i",logN,"user=", newUser) : null;
    return newUser
  } catch (e) {
    // ошибка
    return Promise.reject(e);
  }
} // function pr_findByUserName(userName)


/** Функция-обертка для преобразования promises (pr_findByUserName(userName)) в  callback
    ищет по имени и возвращает копию объекта пользователя для внешнего кода
 * @property {String} userName   - login пользователя
 * @returns {Callback(err,user)} Колбек, содержащий данные из базы данных в виде независимой копии объекта или ошибку
*/
async function findByUserName (userName,cb){
  try {
    let user =await pr_findByUserName(userName);
    cb(null,user);
    return
  } catch (e) {
    cb(e,null);
    return
  }

} // function findByUserName

exports.findByUserName = findByUserName;



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
  if (! user.userName) {
    let err=new Err({
                 en:"Field: userName not defined."
                ,ru:'Поле userName не указано'
                ,ua:'Поле userName не вказано'
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
     let suff=" (userrname='"+user.userName+"'; user.role="+user.role+")"
     let err=new Err({
                  en:"Role is not defined"+suff
                 ,ru:'Роль пользователя неопределена'+suff
                 ,ua:'Роль користувача не визначена'+suff
               });
      cb (err,null);
      return
   };
   // ищем на совпадение имени
   this.findByUsername(user.userName,(err,data) => {
     if (! err) {
       let suff=" (user.userName="+user.userName+")"
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
     records[user.userName]=user;
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
     user.role = roles[user.role];
     cb(null,user);
   });//findByUsername
};//addNewUser
exports.addNewUser = addNewUser;

/**
 * @param {text} current_user имя пользователя, инициировавшего удаление (текущий)
 * @param {text} del_userName имя удаляемого пользователя
 * @param {number} cb(err,deletedUser) результат
*/
function deleteUser(current_user,del_userName,cb) {
  // id= undefined
  if (! del_userName) {
    let err=new Err({
                 en:"No del_userName specified"
                ,ru:'Не указан del_userName'
                ,ua:"Не вказано del_userName"
              });
   cb (err,null);
   return
 };
 // id=1=admin → нельзя удалять
 if (del_userName == "admin") {
   let s="'admin'"
   let err=new Err({
                en:"Can't delete user:"+s
               ,ru:'Нельзя удалить пользователя:'+s
               ,ua:"Неможливо видалити користувача:"+s
             });
  cb (err,null);
  return
 }
  // -------- проверяем права на удаление
  // ---- ищем пользователя давшего запрос на удаление в базе
  this.findByUsername(current_user, (err,data) => {
    if (err) {
      let suff=" userName='"+current_user+"' ";
      let err=new Err({
                   en:"User"+suff+" not found "
                  ,ru:"Пользователь"+suff+' не найден'+suff
                  ,ua:"Користувача"+suff+" не знайдено"+suff
                });
     cb (err,null);
     return
   }; //if (err)
   // проверяем наличие пользователя с таким  ID
   this.findByUsername(del_userName, (err,data) => {
     if (err) {
       let suff=" userName='"+del_userName+"' ";
       let err=new Err({
                    en:"User"+suff+" not found "
                   ,ru:"Пользователь"+suff+' не найден'+suff
                   ,ua:"Користувача"+suff+" не знайдено"+suff
                 });
      cb (err,null);
      return
    }; //if (err)
    // пользователь найден, удаляем
    records[del_userName]=undefined;
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
  });//findBy del_userName
 });
};// findByUsername(current_user,cb)
exports.deleteUser=deleteUser;

function verifyUser(userName,password,cb){
  this.findByUsername(userName, (err, user) => {
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
      // let suff=" user='"+userName.path+"'";
      let err=new Err({
                   en:'Wrong password for user \''+userName+'\''
                  ,ru:'Неправильный пароль для пользователя \''+userName+'\''
                  ,ua:'Невірний пароль для користувача \''+userName+'\''
                });
     cb (err,null);
     return
   });//bcrypt.compare
  }); //findByUsername
};//function verifyUser
exports.verifyUser=verifyUser;



// ----- загружаем данные пользователей  -------
(async () => {
  try {
    records = await loadRecords(fName,backupFname);
    //console.dir(records);
  } catch (e) {
    log("e",logName,e);
    throw(new Error("Can't load users base!!!"));
  }
})();


if (! module.parent) {
  //пауза для загрузки данных из файла
  setTimeout(async function () {
      // --- debug findByUserName() ----------------
      try {
        let data = await pr_findByUserName("admin");
        log("w",'----------- findByUserName("admin") -------------');
        console.dir(data);
        //console.log("----------- records -------------");
        //console.dir(records);
        data = await pr_findByUserName("wrongName");
      } catch (err){
        console.error(err);
      }


    }, 2000); //setTimeout

}
