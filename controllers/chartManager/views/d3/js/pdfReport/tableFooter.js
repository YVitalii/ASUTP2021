let headers=  ["","*C","duration","end time","kW*h","value","units","duration","Name","Signature"];


function getHeaderRows(headers){
  let ret=[];
   for (var i = 0; i < headers.length; i++) {
     ret.push(
       {
         text:headers[i]
         ,alignment:"center"
         ,style:"tableHeader"
       }
       )
   }//for
   return ret
 }//function getHeaderRows


function getDataRow(arr) {
  // выдает одну строку данных
  let res=[];
  for (var i = 0; i < arr.length; i++) {
    let obj={alignment:"center"};
    obj.text=(arr[i]) ? {text:arr[i]} : {text:"     "};
    if (i==0) {obj.style='tableHeader'};
    res.push(obj);
  }
  return res;
}

function getDataRows(data) {
  // выдает все строки данных в виде массива
  let res=[];
  for (var i = 0; i < data.length; i++) {
    res.push(getDataRow(data[i]))
  }
  return res
}

function getTable(data) {
  //  data - массив данных 4 ряда 10 столбцов
  let trace=0, lH=" getTable(data):"
  //  ---------------- заголовки -------------------------------
  let body=[
    [
      {text:"Phase",style:"tableHeader",rowSpan:2,alignment:"center"}
      ,{text:"Task",style:"tableHeader",colSpan:2,alignment:"center"},null
      ,{text:"Measured",style:"tableHeader",colSpan:2,alignment:"center"},null
      ,{text:"Calculated",style:"tableHeader",colSpan:3,alignment:"center"},null,null
      ,{text:"Operators",style:"tableHeader",colSpan:2,alignment:"center"},null
    ]
    ,getHeaderRows(headers)
  ];
  body=body.concat(getDataRows(data));
  trace ? console.log(lH+body[0].length) :null ;
  let table= {

       widths:[70, 30,50,80,50,100,50,100,100,"*"]//["auto", "auto","auto","auto","auto","auto","auto","auto","auto","*"]
      ,body:body

  } //
  trace ? console.dir(table.body) : null;
  // -----------  данные ------------------------

  return table
}







module.exports=getTable;


if (! module.parent) {
  console.log(getTable());
}
