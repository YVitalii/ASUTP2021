let gLn = "processes/processManager/vue/programTransform.mjs::";

function parseTasks(rawTasks, transformedTasks = [], lang = "ua") {
  let trace = 0,
    ln = gLn + `parseTasks::`;
  trace ? console.log(ln + `Started`) : null;
  if (trace) {
    console.log(ln + `rawTasks=`);
    console.dir(rawTasks);
  }
  let tasks = rawTasks;
  for (let i = 0; i < tasks.length; i++) {
    // 0 = опис програми
    const el = tasks[i];
    if (trace) {
      console.log("i", ln, `============ ${i} ============`);
      console.log("i", ln, `tasks[${i}]=`);
      console.dir(tasks[i]);
    }
    const item = {
      id: el.id, //id кроку
      type: el.type, // тип
      state: el.state, //стан
      header: el.header[lang],
      note: el.comment[lang],
      duration: el.duration ? el.duration : "",
      startTime: el.startTime ? el.startTime : "",
    };

    if (Array.isArray(el.tasks)) {
      // якщо задача має список підзадач - викликаємо себе рекурсивно
      (item.steps = []), parseTasks(el.tasks, item.steps, lang);
      trace ? console.log("i", ln, `========= New Branch ======`) : null;
    }

    if (trace) {
      console.log(ln + `item=`);
      console.dir(item);
    }
    transformedTasks.push(item);
  } //for
  return transformedTasks;
}

function programTransform(inp, out, lang = "ua") {
  let trace = 0,
    ln = gLn + `programTransform::`;
  let descr = inp.tasks[0];
  if (trace) {
    console.log(ln + `inp.tasks[0]=`);
    console.dir(inp.tasks[0]);
  }

  out.value.header.value = descr.value; // назва програми
  trace ? console.log(ln + `out.header=${out.header}`) : null;
  out.value.description.value = descr.comment[lang]; // опис
  trace ? console.log(ln + `descr.comment[lang]=${descr.comment[lang]}`) : null;
  out.value.state.value = inp._id; // стан
  out.value.btnStartEnable.value = out.programState != "going"; // якщо не виконуэться то можна запустити
  let steps = [];
  parseTasks(inp.tasks.slice(1), steps, lang);
  //console.dir(steps, { depth: 3 });
  out.value.steps.value = steps;
}

/** Отримує
 *
 */
export default programTransform;
