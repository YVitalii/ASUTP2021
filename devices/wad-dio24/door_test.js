const addTask = require('./RS485_v200.js').addTask;
const log=require('../log.js');
const parseBuf= require('./parseBuf.js'); // форматирует вывод буфера для консоли
var dev = {id:5,timeout:1500};
function formatBits(out){
  return out.slice(0,4)+"-"+out.slice(4,8)+"-"+out.slice(8,12)+"-"+out.slice(-4);
}
function getBits(buf) {
  let out= ("0000000000000000"+buf.readUInt16BE(0).toString(2)).slice(-16);
  let inp= (buf.length >= 4) ? ("0000000000000000"+buf.readUInt16BE(2).toString(2)).slice(-16) : "";
  log("i","inp:"+formatBits(inp)," ;  out:"+formatBits(out));
  return {"inp":inp,"out":out}
}

function task(lH,req){
  log("i",lH,"req=",req);
  //console.dir(req);
  addTask(req,(err,data) => {
    let text=lH+"RS485="+req.id+";reg="+req.addr.toString(16)+"::";
         if (err){log ("e",text+" Err: "+err.message) }
         if (data) {log("i",text+":data="+parseBuf(data));getBits(data)}
      }); //addTask
}

function carryOut() {
  let lH = "Carry out:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x401C;
  req.data=0x1;
  task(lH,req);
};//function openDoor

function endStart() {
  let lH = "endStart:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x4020;
  req.data=0x1;
  task(lH,req);
};//function endStart

function endStop() {
  let lH = "endStop:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x4020;
  req.data=0x0;
  task(lH,req);
};//function endStart

function carryIn() {
  let lH = "Carry out:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x401B;
  req.data=0x1;
  task(lH,req);
};//function openDoor

function carryStop() {
  let lH = "Carry stop:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.data=0x0;
  req.addr=0x401C;
  task(lH,req);
  req.addr=0x401B;
  task(lH,req);
};//function openDoor


function doorOpen() {
  let lH = "Opening door:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x401D;
  req.data=0x1;
  task(lH,req);
};//function openDoor

function doorClose() {
  let lH = "Closing door:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x401E;
  req.data=0x1;
  log("i",lH,"req=",req);
  task(lH,req);
};//function openDoor



function doorStop() {
  let lH = "Stoping door:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.data=0x0;
  req.addr=0x401E;
  log("i",lH,"req=",req);
  task(lH,req);
  req.addr=0x401D;
  log("i",lH,"req=",req);
  task(lH,req);
};//function openDoor

function alarmStart() {
  let lH = "Alarm:"
  log("w",lH,"Start");
  let req = dev;
  req.FC =6;
  req.addr=0x4021;
  req.data=0x1;
  task(lH,req);
};//function openDoor

function alarmStop() {
  let lH = "Alarm:"
  log("w",lH,"Stop");
  let req = dev;
  req.FC =6;
  req.addr=0x4021;
  req.data=0x0;
  task(lH,req);
};//function openDoor

if (! module.parent) {
  // setTimeOut(doorOpen,1000);
  // setTimeOut(doorStop,3000);
  // setTimeOut(doorClose,5000);
  // setTimeOut(doorClose,5000);
  //setTimeout(carryOut,3000);
  //setTimeout(carryStop,7000);
  //setTimeout(carryIn,10000);
  //setTimeout(carryStop,12000);

  setInterval(function(){task("Scaning:",{id:5,FC:3,addr:0x4006,data:0x2,timeout:1500})},4000)
  setTimeout(alarmStart,15000);
  setTimeout(alarmStop,20000);
  setTimeout(endStart,4000);
  setTimeout(endStop,14000);
  //

}

