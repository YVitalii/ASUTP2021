// ------------------       НАСТРОЙКИ    ----------------------
// ----- характеристики печи
const entity={
        id:"SSHCM-8.15-10"
      	,shortName:"СШЦМ-8.15/10" //
        ,fullName: "Печь цементационная СШЦМ-8.15/10" //
        ,regs:{
              "1-T":{
                title:"T1" // имя для вывода в описании поля
                ,type:"integer" // тип значения
                ,units: "\u00b0C" // единицы измерения
                ,description:"Текущая температура в зоне №1" // описание
              }
              ,"2-T":{
                title:"T2" // имя для вывода в описании поля
                ,units: "\u00b0C" // тип значения
                ,type:"integer" // единицы измерения
                ,description:"Текущая температура в зоне №2" // описание
              }
            }//regs
      };
// --- настройки URL ----------------
const logURL="/logs/"+entity.id; // слеш в конце не ставить, откуда брать таблицу с данными
// --- формируем список регистров для запроса текущих значений регистров
let regsList=""
for (let key in entity.regs){
  regsList += key +";";
}
regsList=regsList.slice(0,-1);
const realURL="/getReg/?list="+regsList // окуда брать текущие данные
// диапазон значений по оси Y
const yRange={ min: 0, max: 1000}
// печатаем в консоль 
console.log("POST:URL:",realURL);
console.log("GET:URL:",logURL);
