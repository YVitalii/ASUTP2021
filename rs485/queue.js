/*  создает очередь опроса  и управляет ею
      constructor() - без аргументов;
      add (arg) - добавляет 1 или массив [] регистров в очередь, возвращает true/false при успехе/не успехе;
      next(); возвращает имя следующего в очереди зарегистра,
              или null - в случае когда очередь пуста
      clear();  очищает очередь
      removeItem(arg); - удаляет регистр из очереди, возвращает true/false при успехе/ошибке;

      -------- 2019-10-07  --------------------
      добавил блок тестирования
      добавил ф-ю и метод has(name) = true если такое имя уже есть в очереди

*/
function has(arg,queue) {
  // если в очереди есть такой регистр, то  true
  let res=false;
  for (var i = 0; i < queue.length; i++) {
          if (queue[i] === arg) { res = true }
        }; //for
  return res
}


function addToQueueItem (arg,queue,cb){
  // добавляет наименование регистра arg  в очередь queue
  let trace=0;
  (trace) ? console.log("addItem ["+arg+"]") : null;
  let msg="";
  arg = arg.trim();
  /*if (! regList.has(arg)) {
        msg = "["+arg+"]   регистр не зарегистрирован";
        (trace) ? console.log("addItem:"+msg) : null;
        return cb(new Error(msg),null);

  };*/

  if ( has(arg,queue) ) {
              msg = "["+arg+"]    регистр уже есть в очереди";
              (trace) ? console.log("addItem:"+msg) : null;
              }

  if (msg != "") {
    (trace) ? console.log("addItem:"+msg) : null;
    return cb(new Error(msg),null);
  } else {
    msg = "Info: ["+arg+"]  регистр добавлен в очередь опроса";
    queue.push(arg);
    return cb(null,msg);
  }

} // addToQueueItem

function addToQueueItems(arr,queue,cb) {
  // добавляет массив регистров arr  в очередь queue
  let trace=0;
  let msgErr=msgData="";
  if (Array.isArray(arr)) {
    for (var i = 0; i < arr.length; i++) {
      (trace) ? console.log("addItems cycle i="+i+":") : null;
      addToQueueItem (arr[i], queue, (err,data) =>{
        if (err) {
            msgErr+='item['+i+']='+err+"\n";
            (trace) ? console.log(msgErr) : null;

        } else {msgData+=data+"\n"}
      })
    }//for
    (trace) ? console.log("---------------------") : null;
    (trace) ? console.log("addItems:\n"+msgErr) : null;
    (trace) ? console.log("---------------------") : null;
    return cb(msgErr,msgData)
  } else {
    return cb(new Error(arr+"не является массивом"),null)
  }
} //addToQueueItems


class Queue  {
  constructor(){
    this.queue=[];
    this.current=0;
    let trace=true;
  }
  add(arg) {
    if (Array.isArray(arg)) {
       addToQueueItems(arg,this.queue,(err,data) => {
         if (err) { return false }
         return true;
     })//addToQueueItems
   } else {
     addToQueueItem(arg,this.queue,(err,data) => {
       if (err) { return false }
       return true;
   })//addToQueueItems
   }
  } //add
  has(name) {
    return has(name, this.queue)
  }//has
  clear() {
    this.queue=[];
    this.current=0;
  }//clear
  getNext(){
    if (this.queue.length <1) {return null}
    if (this.current >= this.queue.length) { this.current=0; /*return null*/ };
    let item= this.queue[this.current];
    this.current+=1;
    return item;
  }//getNext
  removeItem(arg){
    let newArr=[];
    let finded=false;
    for (var i = 0; i < this.queue.length; i++) {
      if ( ! (this.queue[i]===arg) ) {
        newArr.push(this.queue[i])
      } else {
        finded=true
      };
    }// for
    this.queue=newArr;
    return finded;
  }
} // class Queue

var queue=new Queue();

module.exports=queue;

// -----   тестирование  -----------------
if (! module.parent) {
  let q=new Queue();
  q.add(["T1","T2","T3","T4","T1"])
  console.log("Очередь:");
  console.log(q);
  for (var i = 0; i < 10; i++) {
    console.log(q.getNext());
  }
  console.log("has('T1'):",q.has('T1'));
  console.log("has('T7'):",q.has('T7'));

  q.removeItem("T2");
  q.removeItem("T5");
  console.log("Очередь после removeItem(T2,T5)");
  console.log(q);
  q.clear();
  console.log("Очередь после clear:");
  console.log(q);



}
