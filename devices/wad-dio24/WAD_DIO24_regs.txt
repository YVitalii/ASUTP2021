const regs=new Map(); //список регистров прибора
/* _get(),_set(val) - функции предобработки: принимают данные, преобразовывают их в формат,
                понятный прибору и  возвращают объект :
                { data:{
                      FC:(функция RS785),
                      addr:(адрес регистра),
                      data:(тело запроса)},
                  err:ошибка}
   get_(buf),set_(buf) - функции постобработки: принимают данные, преобразовывают их в формат,
                   описывающий их физическое значение  и  возвращают объект :
                   { data:{
                         data: {
                              value:принятое значение,
                              note:описание},
                         },
                     err:ошибка}
*/


for (let i = 1; i <= 24; i++) {
  // оформляем все 24 регистра как входы
  let regName="DIO"+i;
  let startAdr=0x4009;
  regs.set(regName,{
     addr:startAdr+i
    ,_get: function () {
      return {
        data:{
            FC:3,
            addr:this.addr,
            data:1},
        err:null
      }
    } //_get
    ,get_: (buf) => {
      let res=parseInt(buf[1]);
      return {data: {
                 value:res,
                 note:res ? "Замкнут" : "Разомкнут"
            },
        err:null}
      }
    ,_set:function (data) {
            return  { "data": null,
            "err":"_Set: Регистр "+regName+" ("+this.addr.toString(16)+")- только для чтения"}
      } //_set
    ,set_:function (buf)  { //т.к. изменение не возможно - не возвращаем ничего
            return null;
          }//set_
  })//regs.set
} //for

for (let i = 17; i <= 24; i++) {
  // регистры с 17 по 24 переопределяем как выходы
  let regName="DIO"+i;
  let reg=regs.get(regName);
  reg._set= function (data) {
    let d= data ? 1 : 0;
    return { data:{
          FC:6,
          addr:this.addr,
          data:d},
      err:null}
  }//reg._set

}//for
// ---------- считываем состояние всех регистров -----
regs.set("readAll",{
  addr:0x4006,
  _get:function () {
    return {
      data:{
          FC:3,
          addr:this.addr,
          data:2},
      err:null    }
  },//_get - стандартная функция по считыванию всего})
  get_: (buf) => {return buf },
});
regs.get("readAll")["_set"]=regs.get("DIO1")._set;
regs.get("readAll")["set_"]=regs.get("DIO1").set_;

module.exports=regs;


 // ----------- тестирование -------------------------
if (! module.parent) {
    console.dir(regs);
    console.log("DIO10._get()");
    console.dir(regs.get("DIO10")._get() );
    console.log("DIO10.get_(Buffer.from([1,1,1,1]))");
    console.dir(regs.get("DIO10").get_(Buffer.from([0,1])) );
    console.log("DIO10._set(1)");
    console.dir(regs.get("DIO10")._set(1) );
    console.log("DIO17._set(1)");
    console.dir(regs.get("DIO17")._set(1) );
    console.log("DIO18._set(0)");
    console.dir(regs.get("DIO18")._set(0) );
    console.log("DIO18.set_(Buffer.from([1,1,1,1]))");
    console.dir(regs.get("DIO18").set_(Buffer.from([0,1])) );
    console.log("readAll._get()");
    console.dir(regs.get("readAll")._get() );
    console.log("readAll.get_(Buffer.from([1,1,1,1]))");
    console.dir(regs.get("readAll").get_(Buffer.from([1,1,1,1])) );
    console.log("readAll._set(1) )");
    console.dir(regs.get("readAll")._set(1) );
    console.log("readAll.set_(1) )");
    console.dir(regs.get("readAll").set_(1) );
}

