class APIerror extends Error {
  constructor(msg) {
    super(msg.ru); // (1)
    this.name = "apiError"; // (2)
    this.msg=msg;
    this.stack="";
  }
}

module.exports=APIerror;

if (! module.parent) {
  throw new APIerror({en:"a Error",ru:"Ошибка",ua:"Сталася помилка"});
}
