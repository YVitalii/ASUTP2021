const { Buffer } = require("node:buffer");
const beforeProgramSet = require("./TRM251_StepsMan_befProgCreated.js");

/**
 * Адаптує програму (Pr, St, час у хвилинах) і збирає буфер RS485.
 * @returns {{ program: Array, buffer: Buffer }}
 */
function parseProgram(program) {
  program = beforeProgramSet(program);
  const tasks = program.slice(1).filter((task) => Number.isFinite(Number(task && task.tT)));
  let bufferLength = tasks.length * 8 + 2; // кожний крок 8 байт + 2 байти Масштаб часу
  const data = Buffer.alloc(bufferLength); // программа
  if ((program[0].timescale === 0) | (program[0].timescale === undefined)) {
    data.writeUInt16LE(0, 0); // Масштаб часу ГГ:ХВ
  } else {
    data.writeUInt16LE(1, 0); // Масштаб часу ХВ:СС
  }
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const offset = i * 8 + 2;
    data.writeUInt16BE(+task.tT, offset); // task temperature
    data.writeUInt16BE(0, offset + 2); // Положення десяткової точки
    data.writeUInt16BE(task.H * 60, offset + 4); // sec, heating time
    data.writeUInt16BE(task.Y * 60, offset + 6); // sec, holding time
    // console.log(
    //   `Task ${i}: Temperature = ${task.tT} = ${data.readUInt16BE(offset).toString(16)}, Heating Time = ${task.H}, Holding Time = ${task.Y}`,
    // );
  }
  return { program, buffer: data };
}

module.exports = parseProgram;

if (!module.parent) {
  const program = require("./tests/testProgram");
  let data = parseProgram(program);
  console.log(data.buffer);
  console.dir(data.program);
}
