/*const captions={
  headers:[{
       columnsWidth:
      ,parts:[      "N","Part item","Material","Weight","Qty"]
      ,samples:["N","samp no","heat no","part no","list no","Material"]
      }
 ,process:{
      setParameters:{}
 }]
}*/
let headers=  ["N","Part item","Material","Weight","Qty","N","samp no","heat no","part no","list no","Material"];


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

function getEmptyArr(length){
  // возвращает массив длиной length вида ["---","---","---",...]
  let arr=[];
  for (var i = 0; i < length; i++) {
    arr.push("---")
  }
  return arr
}//getEmptyArr(length)

function getDataRows(data) {
  let trace=0,lHead="getDataRows():"
  let res=[];
  let pL=data.parts.length,
      sL=data.samples.length;
  let rows= (pL>sL) ? pL : sL; //максимальное кол-во рядов таблицы
  for (var i = 0; i < rows; i++) {
    let parts=[""+(i+1)], samples=[""+(i+1)];
    trace ? console.log(lHead+"Step1: parts="+JSON.stringify(parts)+"; samples="+JSON.stringify(samples)) : null;
    parts=parts.concat( (data.parts[i]) ? data.parts[i] : getEmptyArr(4));
    samples=samples.concat((data.samples[i]) ? data.samples[i] : getEmptyArr(5));
    trace ? console.log(lHead+"Step2: parts="+JSON.stringify(parts)+"; samples="+JSON.stringify(samples)) : null;
    parts=parts.concat(samples);
    res.push(parts);
  }//for
  trace ? console.dir(lHead+"getDataRows(data)="+JSON.stringify(res)) : null;

  return res
}//function getDataRows(data)

function getTableBatch(data) {
  let body=[
    [
     {text:[{text:"Heat treatment site: ",style:"tableHeader"},{text:data.site,style:"values"}],colSpan:4,alignment:"center"},null,null,null
    ,{text:[{text:"Start at: ",style:"tableHeader"},{text:data.startTime,style:"values"}],colSpan:3,alignment:"center"},null,null
    ,{text:[{text:"Heat treatment procedure: ",style:"tableHeader"},{text:data.procedure,style:"values"}],colSpan:4,alignment:"center"},null,null,null
    ]
   ,[
    {text:"Parts",colSpan:5,alignment:"center",style:"tableHeader"},null,null,null,null
    ,{text:"Samples",colSpan:6,alignment:"center",style:"tableHeader"},null,null,null,null,null
    ]
   ,getHeaderRows(headers)
 ]
 body=body.concat(getDataRows(data))
  let table= {
    table:{
       widths:[20,    "*",    "auto",     "auto",  "auto",  20,"auto","auto","auto","auto","auto"  ]
      ,body:body
    }//table
  } //
  return table
}//function getTableBatch(data)

module.exports=getTableBatch;

if (! module.parent) {
    const data={
       startTime:"2019-10-14"//new Date().toLocaleDateString()
      ,certificate:"004/19"
      ,site:"SIA Madesta,Rencēnu iela 8,Riga,LV-1073"
      ,procedure:"GI-8.5_11"
      //Parts
      ,parts:[
           ["Madesta 2019 2441","S355NL+Z25",910,2]
          ,["Madesta 2019 2442","S355NL+Z25",911,2]
        ]
      //samples
      ,samples:[
                   ["5017","55654D3","8163D","1-1","S355NL+Z25"]
                  ,["5014","56641B2","6182D","1-1","S355NL+Z25"]
                  ,["5013","50641B2","6185D","2-1","S355NL+Z25"]
              ]
      ,img:'img.png'

    } //data
    getDataRows(data);

}//  if (! module.parent)
