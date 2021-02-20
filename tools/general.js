function getDateString(d) {
  let date;
  if (d) { date =new Date(d) } else { date = new Date()}
  //console.log(date);
  return date.getFullYear()+"-"+("0"+(date.getMonth()+1)).slice(-2)+"-"+("0"+date.getDate()).slice(-2);
}

if (! module.parent) {
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
}

module.exports.getDateString=getDateString;
