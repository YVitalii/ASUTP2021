const config = require('../config.js');
const fs = require('fs');
class LogWriter {
  constructor(path,listRegs){
    this.listRegs=listRegs;
    this.path=path;
    let trace=1, logT="Chart.constructor: "
    trace ? console.info(logT,"this.path=",this.path) : null;
    trace ? console.log(logT,"this.listRegs=",this.listRegs) : null;
    // ---- проверяем наличие директории и если нужно создаем ее ----------
    testDirectory(path)
      .then(
        response => console.log("Directory created"),
        error => console.log(`Rejected ${error}`)
      )
  }//constructor
} //class Chart

module.exports=LogWriter;
function testDirectory(path) {
  return new Promise( (resolve,reject) =>{
    console.log("testDirectory("+path+")");
    fs.mkdir(path,{recursive:true}, (err) => {
      if (err) { reject(err) } else { resolve (true)}
    })
  })//Promise
}//testDirectory
