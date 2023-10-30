function getDate() {
  var date = new Date().toLocaleString();
  let arr = date.split(",");
  date = arr[0] + "<br>" + arr[1];

  document.getElementById("timedisplay").innerHTML = date.toLocaleString();
}
setInterval(getDate, 0);
