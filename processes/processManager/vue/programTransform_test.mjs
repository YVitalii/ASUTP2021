// cd ./processes/processManager/vue
// supervisor --no-restart-on exit --watch ./ programTransform_test.mjs
// сира программа (з сервера)
import inp from "./rawProgramFromServer.mjs";
// трасувальник
let trace = 1,
  gLn = "./parseProgram_test.mjs::";
// if (trace) {
//   console.log(gLn + `inp=`);
//   console.dir(inp);
// }

// модель даних компонента ProcessManager.vue
import propsDefine from "./ProcessMan_propsDefine.mjs";

import { ref } from "vue";
let out = {};

// парсер програми
import parseProgram from "./programTransform.mjs";

while (inp == undefined) {
  console.log("Waiting for inp...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.log("==========================================================clear");
// трансформуємо програму в модель
parseProgram(inp, out);
trace = 1;
if (trace) {
  console.log(gLn + `out.steps[0]=`);
  console.dir(out.steps[0], { depth: 3 });
}
