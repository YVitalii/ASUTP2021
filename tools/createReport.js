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
printBtn.onclick = () => {
  let leftMenu = document.getElementById("left-menu");
  leftMenu.style.display = "none";
  let contain = document.getElementById("contain");
  contain.style.border = "none";
  let myChartPrint = document.getElementById("myChart");
  myChartPrint.style.width = "280mm";
  myChartPrint.style.position = "absolute";
  myChartPrint.style.right = "30px";
  chart.redraw();
  setTimeout(()=>{
    window.print();
    leftMenu.style.display = "block";
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