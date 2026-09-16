const program = [
  {
    id: "program1",
    name: "Program Example",
    description: "This is a program example for the OWEN_TRM251 device.",
  },
];
let trace = 1,
  ln = `testProgram.js::`;
for (let i = 1; i <= 6; i++) {
  let step = {
    type: "taskThermal_TRM251",
    tT: parseInt(i * 100), //task temperature
    H: parseInt(i * 5), // heating time
    Y: parseInt(i * 5), // holding time
  };
  program.push(step);
  trace ? console.log(ln + `Step ${i}:`, step) : null;
}

module.exports = program;
