var chart={}; // переменная в которой будет храниться график
var timerDrawCurrentData; // таймер добавки новых данных на график
setTimeout(
  () => {
    chart= new Chart("#myChart",config.chart);
    timerDrawCurrentData=setInterval(function () {chart.addData(realTimesData)}.bind(this), config.operativeValues.timeout);
  },config.operativeValues.timeout
)
