const driver = require('./WAD_DIO24.js');
// интерфейс для тестов
const iface = {};
const dev_id=4; //адрес прибора в сети RS485
// конфигурация для тестов
const config= {
  "entities":[
    {
      id: "SDO-16-45-12-10",
      shortName: "СДО-16.45.12/10", // короткое имя печи
      door:{}
       }
  ]
};

let door=config.entities[0].door;
door[`${dev_id}-DIO6`] ={
                  title:"6SQ1",
                  description:'Привод двери. КВ"Цепь ослаблена.Осн."',
                  units:"boolean", // true=1 = сработал; false = 0 не сработал
                  states:{"0":"Цепь натянута", "1": "Цепь ослаблена"}
                };
console.dir(config,{depth:4});
