function getDate (d){
  // преобразует заданную дату в строку типа: "ГГГГ-ММ-ДД"
  let now = d ? d : new Date(d);
  let timeN=(now.getFullYear())+"-"+("0"+(now.getMonth()+1)).slice(-2)+"-"+("0"+now.getDate()).slice(-2);
  return timeN;
}
var today=getDate(new Date());
// var today="2021-02-07";
const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
const chartConfig = {
  dataURL: "/logs/" + furnaceId,
  startDate: today,
  y: { min: 0, max: 600 },
  task:null,
  registers, // берётся из graph.pug
}
const programList = document.getElementById("process-program-list");
let currentProgram = [];
buildProgramList = () => {
  programList.innerHTML = "";
  if (currentProgram.length === 0) {
    var newLiElement = document.createElement("li");
    newLiElement.className = "list-group-item";
    newLiElement.innerText = "Не вдалося завантажити програму.";
    programList.appendChild(newLiElement);
  } else {
    for (let index = 1; index < currentProgram.length; index++) {
      // const element = array[index];
      var newLiElement = document.createElement("li");
      newLiElement.className = "list-group-item d-flex justify-content-between align-items-center p-1";

      var newLiElementText = document.createElement("label");
      newLiElementText.innerText = currentProgram[index].note;
      newLiElement.appendChild(newLiElementText);

      var newLiElementBtn = document.createElement("button");
      newLiElementBtn.className = "btn btn-outline-success";
      newLiElementBtn.innerText = "Пуск";
      newLiElementBtn.id = "btn-launch-process-" + index;
      newLiElementBtn.onclick = (e) => {
        var programID = parseInt(e.target.id.slice(19));
        console.log(`Користувач спробував запустити програму ${programID}`);
        for (let i = 1; i < currentProgram.length; i++) {
          var btn = document.getElementById(`btn-launch-process-${i}`);
          if (i!=programID) {
            btn.className = "btn btn-outline-success";
            btn.innerText = "Пуск";
            btn.disabled = true;
          } else {
            btn.disabled = false;
            btn.className = "btn btn-outline-danger";
            btn.innerText = "Стоп";
          }
        }
      }
      newLiElement.appendChild(newLiElementBtn);
      // button(type="button" class="btn btn-outline-success" id="send-new-parameters") Застосувати
      programList.appendChild(newLiElement);
    }
  }
}
buildProgramList();
const url='/getReg/?list=' + regs; // 'regs' берётся из graph.pug
var chart={};
chart = new Chart("#myChart", chartConfig);
let regsArr = regs.split(';');
var xhrT = new XMLHttpRequest();
xhrT.onload = function(){
  let res=JSON.parse(xhrT.responseText);
  // console.log(res);
  let points={}
  for (key in res) {
    let element = document.getElementById(key);
    if (res[key].value === null){
      element.innerHTML = "Error";
      points[key]=-5;
    } else {
      element.innerHTML = res[key].value;
      points[key]=res[key].value;
    }
    points['time']=res[key].timestamp;
  }
  // points['time']=new Date().getTime();
  chart.addData(points);
  // for (let i=0; i<regsArr.length; i++) {
  //   let element = document.getElementById(regsArr[i]);
  //   element.innerHTML = res[regsArr[i]].value;
  // }
}
xhrT.onreadystatechange = () => {
  if (xhrT.readyState === 4) {
      if (xhrT.status === 0) {
        alert("Произошла ошибка сервера, пожалуйста, перезагрузите сервер и страницу.");
      }
  }
}
function addPoints() {
  xhrT.open('POST', url, true);
  xhrT.send();
}
// let refreshInterval = setInterval(addPoints, 1000);
setInterval(addPoints, 1000);

const stateurl='/process/getState';
var statexhrT = new XMLHttpRequest();
statexhrT.onload = function(){
  let response=JSON.parse(statexhrT.responseText);
  if (response.err) alert(response.err.ua);
  else {
    // console.log(response.data);
  }
}
getState = () => {
  statexhrT.open('POST', stateurl, true);
  statexhrT.send();
}
setInterval(getState, 1000);

const getProgramurl='/process/getProgram';
var getProgramxhrT = new XMLHttpRequest();
getProgramxhrT.onload = function(){
  let response=JSON.parse(getProgramxhrT.responseText);
  if (response.err) alert(response.err.ua);
  else if (JSON.stringify(response.data) != JSON.stringify(currentProgram)) {
    // console.log(response.data);
    // console.log(currentProgram);
    currentProgram = response.data;
    buildProgramList();
  }
}
getProgram = () => {
  getProgramxhrT.open('POST', getProgramurl, true);
  getProgramxhrT.send();
}
setInterval(getProgram, 1000);