const assert = require("assert");
const serv = require("../RS485_server.js");

console.log("----------- mocha tests are running -------------");

describe("testing addDevice", function () {
  it("Тип устройства не String. ", function () {
    assert.equal(serv.addDevice(1, 8), false);
  }); //it
  it("Адрес вне диапазона. Ошибка.", function () {
    assert.equal(serv.addDevice(599, "trp08"), false);
  }); //it
  it("Несуществующее устройство (нет драйвера). ", function () {
    assert.equal(serv.addDevice(1, "wrongDevice"), false);
  }); //it
  it("Регистрация валидного устройства. ", function () {
    assert.equal(serv.addDevice(1, "trp08", new Map()), true);
  }); //it
  it("Регистрация валидного устройства с тем же адресом. ", function () {
    assert.equal(serv.addDevice(1, "trp08"), false);
  }); //it
});

describe("addReg testing", function () {
  it("На входе пустой объект", function () {
    //assert.equal([1, 2, 3].indexOf(4), -1);
    assert.equal(serv.addReg(), false);
  }); //it
  it("Ошибка в id регистра.", function () {
    assert.equal(serv.addReg({ id: "isT" }), false);
  }); //it
  it("Не существующий прибор", function () {
    assert.equal(serv.addReg({ id: "300-T" }), false);
  }); //it
  it("Неправильное имя регистра. Ошибка.", function () {
    assert.equal(serv.addReg({ id: "1-badNameReg" }), false);
  }); //it
  it("Все Ок. Регистр добавлен.", function () {
    assert.equal(serv.addReg({ id: "1-T" }), true);
  }); //it
  it("Повторное добавление регистра не проходит. Ошибка", function () {
    assert.equal(serv.addReg({ id: "1-T" }), false);
  }); //it

  //   it("",function(){
  //       assert.equal(,);
  //   }); //it
});
