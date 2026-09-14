const program = [
  {
    id: "program1",
    name: "Program Example",
    description: "This is a program example for the OWEN_TRM251 device.",
  },
  {
    //1
    type: "taskThermal_TRM251",
    tT: 150, //task temperature
    H: 10, // heating time
    Y: 10, // holding time
    description: "This task sets the temperature 150",
  },
  {
    //2
    type: "taskThermal_TRM251",
    tT: 250, //task temperature
    H: 20, // heating time
    Y: 20, // holding time
    description: "This task sets the temperature 250",
  },
  {
    //3
    type: "taskThermal_TRM251",
    tT: 550, //task temperature
    H: 30, // heating time
    Y: 30, // holding time
    description: "This task sets the temperature 550",
  },
  {
    //4
    type: "taskThermal_TRM251",
    tT: 650, //task temperature
    H: 30, // heating time
    Y: 30, // holding time
    description: "This task sets the temperature 650",
  },
  {
    //5
    type: "taskThermal_TRM251",
    tT: 750, //task temperature
    H: 30, // heating time
    Y: 30, // holding time
    description: "This task sets the temperature 750",
    timescale: 0, //ГГ:ХВ
  },
  {
    //6
    type: "taskThermal_TRM251",
    tT: 850, //task temperature
    H: 30, // heating time
    Y: 30, // holding time
    description: "This task sets the temperature 850",
  },
];
module.exports = program;
