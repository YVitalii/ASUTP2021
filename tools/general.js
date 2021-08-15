/** Преобразует дату в строку типа ГГГГ-ММ-ДД
*/
function getDateString(d) {
  let date;
  if (d) { date =new Date(d) } else { date = new Date()}
  //console.log(date);
  return date.getFullYear()+"-"+("0"+(date.getMonth()+1)).slice(-2)+"-"+("0"+date.getDate()).slice(-2);
};
/** Делает полную копию объекта и возвращает ее

*/
function getCloneObj(obj){
  var clone={};
  for (let key in obj) {
    if (key instanceof Object) { getClone (key) }
    clone[key] = obj[key];
  };
  return clone
}; //getClone(obj)

if (! module.parent) {
  console.log(getDateString());
  console.log(getDateString("2021-1-3"));
}

module.exports.getDateString = getDateString;
module.exports.getCloneObj = getCloneObj;
