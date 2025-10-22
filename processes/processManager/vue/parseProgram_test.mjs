// cd ./processes/processManager/vue
// mocha
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
import propsDefine from "./processManager_propsDefine.mjs";

import { ref } from "vue";
let out = ref(propsDefine);

// парсер програми
import parseProgram from "./programTransform.mjs";

// трансформуємо програму в модель
parseProgram(inp, out);
trace = 1;
if (trace) {
  console.log(gLn + `out.value=`);
  console.dir(out.value, { depth: 3 });
}
