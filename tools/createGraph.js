const programList = document.getElementById("process-program-list");
let currentProgram = [];
let currentState = [];

let today=getDate(new Date());
const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
const chartConfig = {
  dataURL: "/logs/" + furnaceId,
  startDate: today,
  y: { min: temperature.min, max: temperature.max }, // берётся из graph.pug
  task:null,
  registers, // берётся из graph.pug
}

const getReg_url='/getReg/?list=' + regs; // 'regs' берётся из graph.pug
const getState_url='/process/getState';
const getProgram_url='/process/getProgram';
const startProcess_url='/process/start?stepID=';
const stopProcess_url='/process/stop';

function getDate (d){
  // преобразует заданную дату в строку типа: "ГГГГ-ММ-ДД"
  let now = d ? d : new Date(d);
  let timeN=(now.getFullYear())+"-"+("0"+(now.getMonth()+1)).slice(-2)+"-"+("0"+now.getDate()).slice(-2);
  return timeN;
}

buildProgramList = () => {
  // Перебудова списка програми та кнопку пуск/стоп, виконується якщо стан програми змінився
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
      newLiElementBtn.id = "btn-launch-process-" + index;
      newLiElementBtn.className = "btn btn-outline-success";
      newLiElementBtn.innerText = "Пуск";
      newLiElementBtn.disabled = false;
      if (!currentState.stop) {
        if (index == currentState.currStep) {
          newLiElementBtn.className = "btn btn-outline-danger";
          newLiElementBtn.innerText = "Стоп";
        } else {
          newLiElementBtn.disabled = true;
        }
      }
      newLiElementBtn.onclick = (e) => {
        var programID = parseInt(e.target.id.slice(19));
        // console.log(`Користувач спробував запустити програму ${programID}`);
        if (currentState.stop) {
          startProcess_xhrT.open('POST', startProcess_url + programID, true);
          startProcess_xhrT.send();
        } else {
          stopProcess_xhrT.open('POST', stopProcess_url, true);
          stopProcess_xhrT.send();
        }
      }
      newLiElement.appendChild(newLiElementBtn);
      // button(type="button" class="btn btn-outline-success" id="send-new-parameters") Застосувати
      programList.appendChild(newLiElement);
    }
  }
}
buildProgramList();
var chart={};
chart = new Chart("#myChart", chartConfig);
let regsArr = regs.split(';');
var getReg_xhrT = new XMLHttpRequest();
getReg_xhrT.onload = function(){
  let res=JSON.parse(getReg_xhrT.responseText);
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
  chart.addData(points);
}
getReg_xhrT.onreadystatechange = () => {
  if (getReg_xhrT.readyState === 4) {
      if (getReg_xhrT.status === 0) {
        alert("Виникла помилка сервера, будь ласка, перезавантажте сервер та сторінку.");
      }
  }
}
function addPoints() {
  getReg_xhrT.open('POST', getReg_url, true);
  getReg_xhrT.send();
}
// let refreshInterval = setInterval(addPoints, 1000);
setInterval(addPoints, 1000);

let getState_xhrT = new XMLHttpRequest();
getState_xhrT.onload = function(){
  let response=JSON.parse(getState_xhrT.responseText);
  if (response.err) alert(response.err.ua);
  else if (JSON.stringify(response.data) != JSON.stringify(currentState)) {
    currentState = response.data;
    buildProgramList();
  }
}
getState = () => {
  getState_xhrT.open('POST', getState_url, true);
  getState_xhrT.send();
}
setInterval(getState, 1000);

let getProgram_xhrT = new XMLHttpRequest();
getProgram_xhrT.onload = function(){
  let response=JSON.parse(getProgram_xhrT.responseText);
  if (response.err) alert(response.err.ua);
  else if (JSON.stringify(response.data) != JSON.stringify(currentProgram)) {
    currentProgram = response.data;
    buildProgramList();
  }
}
getProgram = () => {
  getProgram_xhrT.open('POST', getProgram_url, true);
  getProgram_xhrT.send();
}
setInterval(getProgram, 1000);

let startProcess_xhrT = new XMLHttpRequest();
startProcess_xhrT.onload = function(){
  let response=JSON.parse(startProcess_xhrT.responseText);
  if (response.err) alert(response.err.ua);
  else {
    getState();
  }
}

let stopProcess_xhrT = new XMLHttpRequest();
stopProcess_xhrT.onload = function(){
  let response=JSON.parse(stopProcess_xhrT.responseText);
  if (response.err) alert(response.err.ua);
  else {
    getState();
  }
}