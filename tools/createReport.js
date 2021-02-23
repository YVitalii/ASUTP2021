let titleHeader = document.getElementById("title-header");
const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
const dataURL = "/logs/" + furnaceId;
let chartConfig = {
  dataURL,
  // startDate,
  y: { min: 0, max: 1000 },
  task:null,
  registers, // берётся из report.pug
}
// console.error("restart page");
var chart={};
function drawGraph(log) {
  // console.error("graph drawed");
  chart={};
  chartConfig["startDate"] = log;
  chart = new Chart("#myChart", chartConfig);
  titleHeader.innerHTML = `Отчёт печи ${furnaceName} за ${log}`
}
let logList = document.getElementsByTagName('li');
let selectedList = logList[0];
selectedList.classList.add("active");
let downloadBtn = document.getElementById("download-btn");
downloadBtn.download = furnaceId + " " + selectedList.id + ".txt";
downloadBtn.href = "/logs/" + furnaceId + "/" + selectedList.id + ".log";
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
  if(window.confirm("Хотите добавить комментарий?")) {
    document.getElementsByTagName('p')[0].innerHTML = prompt("Введите комментарий:");
    comment.style.display = "block";
    comment.style.position = "absolute";
    comment.style.top = "500px";
  }
  let leftMenu = document.getElementById("left-menu");
  leftMenu.style.display = "none";
  let contain = document.getElementById("contain");
  contain.style.border = "none";
  let myChartPrint = document.getElementById("myChart");
  // myChartPrint.style.height = "400px";
  myChartPrint.style.width = "100%";
  myChartPrint.style.position = "absolute";
  myChartPrint.style.right = "30px";
  // chart.redraw();
  setTimeout(()=>{
    // let svg = document.getElementsByTagName('svg')[0];
    // svg.setAttribute("height", "400px");
    // svg.setAttribute("width", "3300px");
    window.print();
    leftMenu.style.display = "block";
    comment.style.display = "none";
    myChartPrint.style.width = "calc(100% - 215px)";
    myChartPrint.style.position = "";
    contain.style.border = "";
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
  var fileName = selectedList.id;
  if (window.confirm(`Файл точно хотите удалить файл ${fileName}.`)) {
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
    }
    let url = "/deleteFile?folderName="+furnaceId+"&fileName="+fileName+".log";
    console.log(url);
    xhr.open("POST", url, true);
    xhr.send();
  }
}