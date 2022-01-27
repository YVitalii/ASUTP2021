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
  y: { min: 0, max: 1000 },
  task:null,
  registers, // берётся из graph.pug
}
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
let refreshInterval = setInterval(addPoints, 1000);