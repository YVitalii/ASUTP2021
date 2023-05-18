const assert = require('assert');
const users = require('./users');
describe("users",function() {

  // ---------  findByUsername --------------------------
  describe("#findByUsername(username,cb)", function () {
    it('при username="admin", результат: data.username="admin"',function(done){
      users.findByUsername("admin",(err,data) =>{
        //console.log("----------------------------");
        console.log("data.username=",data);
        assert.equal(data.username, "admin");
        done();
      })
    });//it
    it('при username="wrong", результат: err',function(done){
      users.findByUsername("wrong",(err,data) =>{
        if (err) {done();console.log(err.msg.ua);return};
        done(data.user);
      })
    });//it
  });//describe("#findByUsername(username,cb)"

  // ---------  addNewUser(user={}) --------------------------
  describe("#addNewUser(user,cb)", function () {

    it('при несуществующем пользователе (undefined), ошибка',function(done){
      let user;
      users.addNewUser(user,(err,data) =>{
        if (err) {console.log(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it

    it('при пустом пользователе {}, ошибка',function(done){
      let user={};
      users.addNewUser(user,(err,data) =>{
        if (err) {console.dir(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it

    it('при отсутствии пароля user={username:"vasya"} → ошибка',function(done){
      let user={username:"vasya"};
      users.addNewUser(user,(err,data) =>{
        if (err) {console.dir(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it

    it('при коротком пароле 1234 → ошибка',function(done){
      let user={username:"vasya", password:"1234"};
      users.addNewUser(user,(err,data) =>{
        if (err) {console.dir(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it

    it('при несуществующей роли (role="stupid") → ошибка',function(done){
      let user={username:"vasya", password:"123456789", role:"stupid"};
      users.addNewUser(user,(err,data) =>{
        if (err) {console.dir(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it


    it('при повторе пользователя → ошибка',function(done){
      let user={username:"admin", password:"123456789", role:"admin"};
      users.addNewUser(user,(err,data) =>{
        //console.dir(err);
        if (err) {console.dir(err.msg.ua);done();return};
        done(data);
        return
      })
    });//it


    it('при корректном пользователе → запись в файл',function(done){
      let user={username:"vasya", password:"123456789", role:"guest"};
      users.addNewUser(user,(err,data) =>{
        //console.dir(err);
        if (err) {done(err.msg.ua);return};
        done();
        return
      })
    });//it
  });//describe("#findByUsername(username,cb)"

  // // ---------  verifyUser(username,password,cb) --------------------------
  describe("#verifyUser(username,password,cb)", function () {
    it('при несуществующем username=undefined → ошибка',function(done){
      let username=undefined,password=undefined;
      users.verifyUser(username, password, (err,data) => {
        if (err) {done(); return };
        done(data);
        return
      }); // verifyUser
    });//it
    it('при несуществующем username=wrong → ошибка',function(done){
      let username="wrong",password=undefined;
      users.verifyUser(username, password, (err,data) => {
        if (err) {done();  return };
        done(data);
        return
      }); // verifyUser
    });//it
    it('при неправильном пароле и существующем username=admin:passport=wrong → ошибка',function(done){
      let username="admin",password="wrong";
      users.verifyUser(username, password, (err,data) => {
        if (err) {done();  return };
        done(data);
        return
      }); // verifyUser
    });//it
    it('при правильном пароле и существующем username=Гість:passport=12345 → пользователь',function(done){
      let username="Гість",password="12345";
      users.verifyUser(username, password, (err,data) => {
        if (err) {done(err);   return };
        assert.equal(data.username, username);
        done();
        return
      }); // verifyUser
    });//it


  }); //
  // // ---------  deleteUser(id,cb(err,data)) --------------------------
  describe("#deleteUser(username,cb)", function () {

    it('при несуществующем username=undefined → ошибка',function(done){
      let username;
      users.deleteUser(username, (err,data) => {
        if (err) {done(); return };
        done(data);
        return
      }); // deleteUser
    });//it
    it('при несуществующем username=wrong → ошибка',function(done){
      users.deleteUser("wrong", (err,data) => {
        if (err) {done(); return };
        done(data);
        return
      }); // deleteUser
    });//it
    it('при попытке удаления пользователя admin  → ошибка',function(done){
      let id;
      users.deleteUser("admin", (err,data) => {
        if (err) {done(); return };
        done(data);
        return
      }); // deleteUser
    });//it
    it('при попытке удаления существующего пользователя vasya → Ok',function(done){
      let id;
      users.deleteUser("vasya", (err,data) => {
        if (err) {done(err.msg.ua); return };
        done();
        return
      }); // deleteUser
    });//it


  });//deleteUser(id,cb(err,data))


});//user
