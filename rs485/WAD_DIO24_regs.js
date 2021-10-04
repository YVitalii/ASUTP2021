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


regs.set("state", //
    {
       addr:0x0000
      ,_get:function () {return {
                            "data":{
                                  "FC":3,
                                  "addr":this.addr,
                                  "data":0x1}
                            , "err" : null
                          }}
      ,get_: (buf) => {
                      let note=""
                      let data=buf[1];
                      let err=null;
                      switch (data) {
                        case 7:
                          note="Стоп"
                          break;
                        case 23:
                          note="Пуск"
                          break;
                        case 71:
                          note="Авария в режиме Стоп"
                          break;
                        case 87:
                          note="Авария в режиме Пуск"
                          break;
                        default:
                          note="Неизвестный код состояния:"+data;
                          err=note;
                          data=null
                      }
                      //note="state"
                      return {
                          "data":{value:data,"note":note},"err":err}
                          }
      ,_set:function (data) {
              // data=17 - пуск; data=1 - стоп
              let err="Недопустимый параметр для записи:"+data+" (можно: 17-Пуск;1 -Стоп)";
              if ((data == 1) | (data == 17)){
                err=null
              } else {data=null};
              //
              //err= i ? null:("Ошибочный входной параметр:"+data);
              return  {
                "data":{
                    "FC":6,
                    "addr":this.addr,
                    "data":data},
                "err":err}
        }
      ,set_:function (buf)  { //т.к. ответ будет эхо запроса, то возвращаем в дата Value

              return  {
                  "data":{value:buf.readUInt16BE(),"note":""},
                  "err":null}
                }
    });
    
 module.exports=regs;
