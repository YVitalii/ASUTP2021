const config={};

let entyties = [];
entyties.push({
  id:"SNO-658-11"
	,shortName:"СНО-6.5.8/11" //
  ,fullName: "Печь закалочная СНО-6.5.8/11" //
  ,regs:{
        "T":{
           id:"3-T" // реальный адрес регистра, по которому нужно делать запрос
          ,title:"T" // имя для вывода в описании поля
          ,units: "&deg;C" //единицы
          ,description:"Текущая температура в печи" // описание
        }
      }//regs
});

entyties.push({
  id:"SSHCM-8.15-10"
	,shortName:"СШЦМ-8.15/10" //
  ,fullName: "Печь цементационная СШЦМ-8.15/10" //
  ,regs:{
        "T1":{
           id:"1-T"
          ,title:"T1" // имя для вывода в описании поля
          ,units: "&deg;C"
          ,description:"Текущая температура в зоне №1"
        }
        ,"T2":{
           id:"2-T"
          ,title:"T2" // имя для вывода в описании поля
          ,units: "&deg;C"
          ,description:"Текущая температура в зоне №2"
        }
      }//regs
});

config["entyties"]=entyties;

module.exports=config;

if (! module.parent) {
  console.dir(config,{depth:4});
  console.dir(new Buffer.from([15,10,8]),{depth:4});
  //util.inspect(config)
}
