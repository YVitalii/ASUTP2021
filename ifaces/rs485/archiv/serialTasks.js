const log = require('../tools/log.js'); // логер
let logName="<"+(__filename.replace(__dirname,"")).slice(1)+">:";
let gTrace=0; //=1 глобальная трассировка (трассируется все)



class SerialTasks {
  constructor(tasks,taskFunc,finish) {
    // -- настройки логгера --------------
    let logN=logName+"constructor("+tasks+"):";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
    trace ? log("w",logN,"Started") : null;
    this.response={};
    this.errors=null;
    this.tasks=tasks;   //trace ? log("i","this.tasks=",this.tasks) :null ;
    this.taskFunc=taskFunc;
    this.finish=finish;
    this.iterate(0);
  }
  iterate (index){
    // -- настройки логгера --------------
    let logN=logName+"iterate("+this.tasks[index]+"):";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
    trace ? log("w",logN,"Started") : null;
    // если задачи закончились
    if (index == this.tasks.length) {
      trace ? log("w",logN,"Все задачи обработаны. Выход") : null;
      // возвращаем данные
      return this.finish(this.errors,this.response)

    };
    // берем следующую задачу
    const task=this.tasks[index];
    trace ? log("i",logN,"следующая задача task=[",task,"]") : null;
    // вызываем функцию
    this.taskFunc(task,(err,data) => {
      if (err) {
        // ошибка
        if (! this.errors) {this.errors={}}//если null, создаем объект
        // добавляем в список ошибок
        this.errors[task]=err
        trace ? log("e",logN,"err=",err,"data=",data) : null;
      };
      // записываем ответ
      this.response[task]=data;
      // следующая задача
      this.iterate(index+1);
    })//taskFunc
  }//iterate

}//class

function test(arg,cb){
  let [regName,value] = arg.split("=");
  let logN=logName+"test("+arg+"):";  let trace=0;   trace = (gTrace!=0) ? gTrace : trace;
  trace ? log("w",logN,"Started") : null;
  let res={};
  res[regName]=value;
  return process.nextTick(() => {cb(null,res);})
}

// ------------ testing -----------
if (! module.parent) {
  let tasks=["T1=10","T2=20","T3=30","T4=40"];
  let tasked= new SerialTasks(tasks,test,(err,data) => {
    if (err) {
      log("e","err=");
      console.group(err);
    }
    log("i","data=");
    console.group(data);
  })
}
 module.exports=SerialTasks;
