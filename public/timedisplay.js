function getDate()
{
  var date = new Date();
  document.getElementById('timedisplay').innerHTML = date.toLocaleString();
}
setInterval(getDate, 0);