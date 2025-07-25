var config={}; // объект с настройками
config.operativeValues={
  headers:["T1","T2","T3","T4"] //имена регистров для считывания с сервера
  ,url:"http://localhost:4000/values" // адрес с которого читать оперативные данные
  ,url_task:"http://localhost:4000/task" // адрес с которого читать задание
  ,url_points:"http://localhost:4000/points" // адрес с которого читать точки событий
  ,timeout:2000 // читать каждые 3 сек 
};
var currentValues={}; //здесь хранятся текущие значения регистров, полученные с сервера
