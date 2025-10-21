function parseTasks(tasks, lang) {
  let arr = [];
  for (let i = 1; i < tasks.length; i++) {
    // 0 = опис програми
    const el = tasks[i];
    const item = {
      id: el.id,
      type: el.type,
      state: el.state,
      header: el.header[lang],
      note: el.comment[lang],
      duration: el.duration ? el.duration : "",
      startTime: el.startTime ? el.startTime : "",
    };
    arr.push(item);
  }
  return arr;
}

/** Отримує
 *
 */
export default (inp, out, lang = "ua") => {
  out.header = inp.tasks[0].value; // назва програми
  out.description = inp.tasks[0].comment[lang]; // опис
  out.programState = inp._id; // стан
  out._btnStartEnable = out.programState != "going"; // якщо не виконуэться то можна запустити
  let tasks = parseTasks(inp.tasks, lang);
  out.value.tasks.value = tasks;
};
