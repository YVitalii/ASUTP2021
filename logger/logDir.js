const trace=1; // 1= включить трассировку
const fs = require('fs');
const config = require('../config');
var home=config.logger.path;




//(trace) ? console.log("logDir: Home="+home) : null;

function getFilesList(cb){
  // возвращает список файлов
  let pathDir=home;
  let trace=0;
  let fileList=[];
  fs.readdir(pathDir,function (err,files) {
    if (err) {
      console.log("logDir: readdir error:");
      console.log(err);
      return cb(err,null);
    } else {
      // список файлов получен

      (trace) ? console.log("logDir: listFiles="+files) : null;
      for (var i = 0; i < files.length; i++) {
        let name=files[i].split('.');
        (trace) ? console.log("logDir: File"+i+"="+name[0] +"  type: "+name[1]) : null;
        if (name[1] == 'log') {
          fileList.push(name[0]);
        }
      }
      fileList.reverse();
      (trace) ? console.log("logDir: return= ["+fileList +"]"): null;
      return cb(null,fileList) // возвращаем список файлов
    }
  })
}


function readData(fName,cb){
  // ---------------------------------------
  // ---   читает данные из файла *.log ----
  let log={data:[]};
  fs.readFile(fName, function (err, data){
    if (err) {
      console.log("readData: readFile error:");
      console.log(err);
      return cb(err,null);
    } else {
      let lines=data.toString().split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].length>0) {
          let l = lines[i].trim().split('\t');
          //(trace) ? console.log("l="+l) : null;

          if (i==0) {
            // заголовки
            log['headers']=l
        } else {
          // данные
          //l[0]=new Date(parseInt(l[0]));
          //for
          //(trace) ? console.log("l="+l) : null;
          log['data'].push(l) }
        }
      }//for
      return cb(null,log)
    }
  })
}

function readDescription(fName,cb){
  // --------------------------------------------------------
  // ---   читает данные из файла с описанием лога *.dsc ----
  fs.readFile(fName, function (err, data){
    if (err) {  return cb(err,null) };
    return cb (null,data.toString())
  })//readFile
}



function getLogFull(name,cb) {
  // ---------------------------------------
  // ---   выдает данные в формате
  // ---  {  description:String,   headers:[],   data:[]  }
  let fName=home+name;
  let log={description:"",headers:[],data:[]};
  // читаем данные
  readDescription(fName+".dsc",(err,descr) => {
    if (! err) { log['description']=descr;  }
    readData(fName+".log",function(err,data){
          if (err) { return cb(err,log); }
          log["headers"]=data["headers"];
          log["data"]=data["data"];
          return cb(null,log)
          }
        )
  })
}//getLogFull

module.exports.getListFiles=getFilesList;
module.exports.getFullLog=getLogFull;
//module.exports.setHome=setHome;



if (! module.parent) {
  //setHome("../public/logs/");
  //let path="../public/logs";
  getFilesList(function(err,list){
    (trace) ? console.log("logDir: listFiles = "+list) : null;
    getLogFull(list[0],function (err,data) {
        (trace) ? console.log(data) : null;
    })
  })
};
