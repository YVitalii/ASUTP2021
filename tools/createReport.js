// const fs = require('fs');
let titleHeader = document.getElementById("title-header");
const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
const dataURL = "/logs/" + furnaceId;
let chartConfig = {
  dataURL,
  // startDate,
  y: { min: temperature.min, max: temperature.max }, // берётся из report.pug
  task:null,
  registers, // берётся из report.pug
}
// console.error("restart page");
var chart={};
let startTime = document.getElementById("start-time");
let endTime = document.getElementById("end-time");
let chartDiv = document.getElementById("myChart");
function drawGraph(log) {
  chartDiv.innerHTML = '';
  // console.error("graph drawed");
  chart={};
  chartConfig["startDate"] = log;
  chart = new Chart("#myChart", chartConfig);
  titleHeader.innerHTML = `Звіт печі ${furnaceName} за ${log}`;
  setTimeout(() => {
    var valueTime = new Date(chart.data[0].time);
    var h =  valueTime.getHours();
    var m =  valueTime.getMinutes();
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    var valueTimeStr = h + ":" + m;
    startTime.value = valueTimeStr;
    startTime.min = valueTimeStr;
    valueTime = new Date(chart.data[chart.data.length-2].time);
    h =  valueTime.getHours();
    m =  valueTime.getMinutes();
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    valueTimeStr = h + ":" + m;
    endTime.value = valueTimeStr;
    endTime.max = valueTimeStr;
  },1000);
}
let logList = document.getElementsByTagName('li');
let selectedList = logList[0];
selectedList.classList.add("active");

let downloadBtn = document.getElementById("download-btn");
downloadBtn.download = furnaceId + " " + selectedList.id + ".txt";
downloadBtn.href = "/logs/" + furnaceId + "/" + selectedList.id + ".log";

let loadsvg = document.getElementById("load-svg-btn");
loadsvg.onclick = () => { chart.loadSvg(); };

drawGraph(selectedList.id);
for (let li of logList) {
  li.onclick = () => {
    selectedList.classList.remove("active");
    selectedList = li;
    selectedList.classList.add("active");
    drawGraph(li.id);
    downloadBtn.download = furnaceId + " " + selectedList.id + ".txt";
    downloadBtn.href = "/logs/" + furnaceId + "/" + selectedList.id + ".log";
  }
};
let printBtn = document.getElementById("print-btn");
let comment = document.getElementById("comment");
printBtn.onclick = () => {
  let userTools = document.getElementsByClassName('user-tools')[0];
  userTools.style.display = "none";
  comment.style.display = "flex";
  comment.style.position = "absolute";
  comment.style.top = "560px";
  let comments = document.getElementsByTagName('p');
  comments[1].innerHTML = "";
  let k = 0;
  for (let [key, value] of Object.entries(registers)) {
    var txtColor = chart.getColorsRegisters(key)[key];
    comments[1].innerHTML += `<span style="color: ${txtColor};">${value.title}</span> - ${value.description}\n`;
    k++;
  }
  if(window.confirm("Бажаєте додати коментар?")) {
    comments[0].innerHTML = prompt("Введіть коментар:");
    comments[0].style.width = "50%";
    comments[1].style.width = "50%";
  } else {
    comments[0].innerHTML = "";
    comments[0].style.width = "0";
    comments[1].style.width = "100%";
  }
  let leftMenu = document.getElementById("left-menu");
  leftMenu.style.display = "none";
  console.log(leftMenu);
  let contain = document.getElementById("contain");
  contain.style.border = "none";
  let scaleBtns = document.getElementById("scale-btns");
  scaleBtns.style.display = "none";
  let rightSide = document.getElementById("right-side");
  // myChartPrint.style.height = "400px";
  rightSide.style.width = "100%";
  rightSide.style.position = "absolute";
  rightSide.style.right = "30px";
  // chart.redraw();
  setTimeout(()=>{
    // let svg = document.getElementsByTagName('svg')[0];
    // svg.setAttribute("height", "400px");
    // svg.setAttribute("width", "3300px");
    window.print();
    leftMenu.style.display = "block";
    scaleBtns.style.display = "block";
    comment.style.display = "none";
    rightSide.style.width = "calc(100% - 215px)";
    rightSide.style.position = "";
    contain.style.border = "";
    userTools.style.display = "flex";
    chart.redraw();
  }, 1000);
  // window.print();
  // leftMenu.style.display = "block";
  // myChartPrint.style.width = "calc(100% - 215px)";
  // contain.style.border = "";
  // chart.redraw();
};
let deleteBtn = document.getElementById("delete-btn");
deleteBtn.onclick = () => {
  // if (role != "admin") {
  //   alert("У Вас нет прав на удаление файлов.")
  // } else {
    var fileName = selectedList.id;
    if (window.confirm(`Ви точно бажаєте видалити файл ${fileName}?`)) {
      var msgN = 1;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.status == 200) {
          if (msgN == 2) {
            alert(this.responseText);
            document.getElementById(fileName).remove();
            selectedList = logList[0];
            selectedList.classList.add("active");
            drawGraph(selectedList.id);
          }
          msgN++;
        }
        if (this.status == 400) {
          if (msgN == 2) {
            alert(JSON.parse(this.responseText).err.ru);
          }
          msgN++;
        }
      }
      let url = "/deleteFile?folderName="+furnaceId+"&fileName="+fileName+".log";
      console.log(url);
      xhr.open("POST", url, true);
      xhr.send();
    }
  // }
}
let scaleBtn = document.getElementById("scale-btn");
scaleBtn.onclick = () => {
  // console.log(chart.data);
  var startValue = startTime.value;
  var endValue = endTime.value;
  for (let i=0, finded=false; i<chart.data.length-1 && !finded; i++) {
    var valueTime = new Date(chart.data[i].time);
    var h =  valueTime.getHours();
    var m =  valueTime.getMinutes();
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    var valueTimeStr = h + ":" + m;
    if (startValue < valueTimeStr) {
      chart.data.splice(0, i);
      finded = true;
    }
  }
  // console.log(chart.data);
  for (let i=0, finded=false; i<chart.data.length-1 && !finded; i++) {
    var valueTime = new Date(chart.data[i].time);
    var h =  valueTime.getHours();
    var m =  valueTime.getMinutes();
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    var valueTimeStr = h + ":" + m;
    if (endValue < valueTimeStr) {
      chart.data.splice(i, chart.data.length-i+1);
      finded = true;
    }
  }
  chart.resize();
  chart.redraw();
  console.log(chart.data);
  console.log({startValue, endValue});
}
let cancelScaleBtn = document.getElementById("сancel-scale-btn");
cancelScaleBtn.onclick = () => {
  drawGraph(selectedList.id);
}