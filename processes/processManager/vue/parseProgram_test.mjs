// cd ./processes/processManager/vue
// mocha
import inp from "./programTest.mjs";
let trace = 1,
  gLn = "./programTest.mjs::";
// if (trace) {
//   console.log(gLn + `inp=`);
//   console.dir(inp);
// }

import out from "./processManagerRefData.mjs";

import parseProgram from "./parseProgram.mjs";

parseProgram(inp, out);

if (trace) {
  console.log(gLn + `out.value=`);
  console.dir(out.value, { depth: 3 });
}
