function getDate()
{
  var date = new Date();
  var month = date.getMonth()+1;
  var day = date.getDay();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  if(month < 10){
    month = '0' + month;
  }
  if(day < 10){
    day = '0' + day;
  }
  if(seconds < 10){
    seconds = '0' + seconds;
  }
  if(minutes < 10){
    minutes = '0' + minutes;
  }
  if(hours < 10){
    hours = '0' + hours;
  }
  document.getElementById('timedisplay').innerHTML = month + "." + day + " " + hours + ':' + minutes + ':' + seconds;
}
setInterval(getDate, 0);