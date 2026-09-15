let program = require("./tests/ProgramExample");

const { Buffer } = require("node:buffer");

function parseProgram(program) {
  let bufferLength = (program.length - 1) * 8 + 2; // кожний крок 8 байт + 2 байти Масштаб часу
  const data = Buffer.alloc(bufferLength); // программа
  if ((program[0].timescale === 0) | (program[0].timescale === undefined)) {
    data.writeUInt16LE(0, 0); // Масштаб часу ГГ:ХВ
  } else {
    data.writeUInt16LE(1, 0); // Масштаб часу ХВ:СС
  }
  for (let i = 1; i < program.length; i++) {
    const task = program[i];
    const offset = (i - 1) * 8 + 2;
    data.writeUInt16BE(+task.tT, offset); // task temperature
    data.writeUInt16BE(0, offset + 2); // Положення десяткової точки
    data.writeUInt16BE(task.H * 60, offset + 4); // sec, heating time
    data.writeUInt16BE(task.Y * 60, offset + 6); // sec, holding time
    // console.log(
    //   `Task ${i}: Temperature = ${task.tT} = ${data.readUInt16BE(offset).toString(16)}, Heating Time = ${task.H}, Holding Time = ${task.Y}`,
    // );
  }
  return data;
}

if (!module.parent) {
  const util = require("util");
  let data = parseProgram(program);
  console.log(data);
}
