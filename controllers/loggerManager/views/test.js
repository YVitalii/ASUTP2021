//- основні налаштування
var chart = new Chart("!{_chartContainer}", {
  dataURL: "/entity/testEntity_2023/chartManager/",
  startDate: "2024-04-02",
  y: { min: 0, max: 150 },
  registers: {
    T1: {
      id: "T1",
      title: "Зона1",
      units: "&deg;C",
      description: `"Температура в верхней зоне"`,
      legend: `"Зона№1.Верх.Задание"`,
    },
    "2-T": {
      title: "T2", // имя для вывода в описании поля
      units: "\u00b0C",
      type: "integer",
      description: "Текущая температура в нижней зоне",
      legend: "Низ.Температура", //  надпись для графика
    },
  },
});
