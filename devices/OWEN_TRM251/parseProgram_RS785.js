let program = require("./tests/ProgramExample");

const { Buffer } = require("node:buffer");

function parseProgram(program) {
  let bufferLength = (program.length - 1) * 8 + 2; // кожний крок 8 байт + 2 байти Масштаб часу
  const data = Buffer.alloc(bufferLength); // программа
  if ((program[0].timescale === 0) | (program[0].timescale === undefined)) {
    data.writeUInt16LE(0, 0); // Масштаб часу ГГ:ХВ
  }
  for (let i = 1; i < program.length; i++) {
    const task = program[i];
    const offset = (i - 1) * 8 + 2;
    data.writeUInt16LE(task.tT, offset); // task temperature
    data.writeUInt16LE(0, offset + 2); // Положення десяткової точки
    data.writeUInt16LE(task.H * 60, offset + 4); // sec, heating time
    data.writeUInt16LE(task.Y * 60, offset + 6); // sec, holding time
  }
  return data;
}

if (!module.parent) {
  let data = parseProgram(program);
  console.dir(data);
}
