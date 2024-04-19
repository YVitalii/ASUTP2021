/** Виконує базові налаштування панелі керування програмою */
processMan.program.ln = "processMan.program::";

{
  /** Отримує поточний список кроків та їх стан з сервера та повертає їх*/
  processMan.program.getProgram = async () => {
    let trace = 1,
      ln = "getProgram()::";
    trace ? console.log(ln + `Started`) : null;
    let response = await fetch(processMan.homeUrl + "getProgram", {
      method: "post",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    }); //
    if (response.ok) {
      // отримуємо інформацію з сервера
      let res = await response.json();
      if (trace) {
        console.log(ln + `res=`);
        console.dir(res);
      }
      return res;
    } else {
      // помилка запиту
      // плануємо наступний запит через 2 сек
      console.warn(ln + response.status);
      return [];
    }
  };

  /**
   * Отримує дані з серверу, та стартово генерує кроки, та налаштовує їх
   */
  processMan.program.init = async () => {
    //debugger;
    let trace = 1,
      ln = processMan.program.ln + "init()::";
    try {
      trace ? console.log(ln + `Started`) : null;
      let model = await processMan.program.getProgram();
      let ok = model.tasks[0].id;
      if (!ok) {
        setTimeout(() => {
          processMan.program.init();
        }, 2000);
        return;
      }
      if (trace) {
        console.log(ln + `tasks=`);
        console.dir(processMan.program.model);
      }
      processMan.program.model = model;
      // очищуємо контейнер
      processMan.program.container.innerHTML = "";
      // промальовуємо кроки
      processMan.program.renderTasks();
      // запускаємо періодичне опистування серверу про стан кроків
      processMan.program.updateStates();
    } catch (error) {
      console.error(error);
      // setTimeout(() => {
      //   processMan.program.init();
      // }, 2000);
      return;
    }
  };

  setTimeout(() => {
    // запускаємо початкову ініціалізацію
    processMan.program.init();
  }, 2000);

  processMan.program.updateStates = async () => {
    let trace = 1,
      ln = "processMan.program.updateSteps::";
    let newSteps = await processMan.program.getProgram();
    if (trace) {
      console.log(ln + `newSteps=`);
      console.dir(newSteps);
    }
    // if (newSteps._id) {
    //   ClassElementStep.setState(processMan.program.model.ta)
    // Якщо відповідь з сервера має поле _id, то відповідь коректна
    if (newSteps._id) {
      let model = processMan.program.model;
      // змінюємо загальний стан програми
      model._id = newSteps._id;
      model.note = newSteps.note;
      model.duration = newSteps.duration;
      // якщо змінилася назва лог файлу - перезавантажуємо графік
      if (model.logFileName != newSteps.logFileName) {
        chartMan.chart.reload(newSteps.logFileName);
        model.logFileName = newSteps.logFileName;
      }
      // змінюємо стан всіх кроків
      let tasks = newSteps.tasks;
      for (let i = 1; i < tasks.length; i++) {
        let newStep = tasks[i];
        let currStep = processMan.program.model.tasks[i];
        processMan.program.updateStepState(newStep, currStep);
      } //for
    } //if (tasks._id){

    // плануємо новий запит
    setTimeout(() => processMan.program.updateStates(), 10 * 1000);
  };

  /**
   * Рекурсивна функція, що проходить всі вкладені кроки та змінює їх стан
   * @param {Array|Object} newStep  - крок отриманий з сервера
   * @param {*} currStep  - локальний поточний крок (в браузері)
   * @returns
   */
  processMan.program.updateStepState = (newStep = null, currStep = null) => {
    //let trace=1, ln=`processMan.program.updateStep::`;
    if (newStep === null || currStep === null) {
      console.error(`processMan.program.updateStep::Один з аргументів == null`);
    }
    //debugger;
    if (Array.isArray(newStep) && Array.isArray(currStep)) {
      // обидва кроки масиви
      for (let i = 0; i < currStep.length; i++) {
        const element = currStep[i];
        processMan.program.updateStepState(newStep[i], currStep[i]);
      }
      return;
    }
    if (newStep._id && currStep._id) {
      ClassElementStep.setState(currStep.el, newStep._id);
      if (Array.isArray(newStep.tasks) && Array.isArray(currStep.tasks)) {
        processMan.program.updateStepState(newStep.tasks, currStep.tasks);
      }
    }
    //if (typeof newStep == "object")
  };

  /**
   * рекурсивна функція, яка будує кроки в масиві(масивів) item
   * @param {*} container - контейнер для елементів
   * @param {Array|Object} item - список кроків
   */
  processMan.program.renderSteps = (container, item) => {
    if (Array.isArray(item)) {
      let row = document.createElement("div");
      row.classList.add("row");
      container.appendChild(row);
      for (let index = 0; index < item.length; index++) {
        processMan.program.renderSteps(row, item[index]);
      }
    } else {
      // let col = document.createElement("div");
      // col.classList.add("col");
      //debugger;
      // рендеримо задачу
      let el = new processMan.myElementsRender["step"]({
        container: container,
        reg: item,
      });
      item.el = el.el;
      container.appendChild(el.el);
      // let task = new processMan.myElementsRender (

      // )
    }
  }; // processMan.program.renderSteps

  processMan.program.stop = async () => {
    let trace = 1,
      ln = processMan.program.ln + "stop()::";
    trace ? console.log(ln + `Started`) : null;
    await processMan.post("stop");
  }; //processMan.program.stop()

  processMan.program.start = async (step = 1) => {
    let trace = 1,
      ln = processMan.program.ln + "start()::";
    trace ? console.log(ln + `Started`) : null;
    let res = await processMan.post("start", { step });
    // if (res.err === null) {

    // }

    //return 1;
  }; //processMan.program.start)

  /**
   * Функція посилає post запит за адресою homeUrl+url та з тілом body
   * якщо запит не вдалий, повторює його кожні 2 сек до вдалого завершення
   * @param {String} url - без слеша попереду! частина адреси, що має додаватися до homeUrl
   * @param {Object} body - тіло запиту JSON
   * @returns {Object} - результат запису
   */
  processMan.post = async (url = "", body = {}) => {
    //debugger;
    //url = ;
    let trace = 1,
      ln = processMan.program.ln + `post(${url}::`;
    let response;
    try {
      response = await fetch(processMan.homeUrl + url, {
        method: "post",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
      }); //
      trace ? console.log("i", ln, `response.status=`, response.status) : null;
    } catch (error) {
      console.error(error);
    }

    if (response.ok) {
      // отримуємо інформацію з сервера
      let res = await response.json();
      if (trace) {
        console.log(ln + `res=`);
        console.dir(res);
      }
      return res;
    } else {
      // помилка запиту
      // плануємо наступний запит через 2 сек
      setTimeout(() => {
        processMan.post(url, body);
      }, 2000);
      console.warn(ln + response.status);
    }
  };

  processMan.program.renderTasks = () => {
    let trace = 1,
      ln = processMan.program.ln + "renderTasks()::";
    let list = processMan.program.model.tasks;
    for (let i = 0; i < list.length; i++) {
      if (trace) {
        console.log(ln + `list[${i}]=`);
        console.dir(list[i]);
      }
      let row = document.createElement("div");
      row.classList.add("row", "border", "border-1", "border-secondary");
      if (i == 0) {
        // перший крок - опис
        //processMan.program.renderDescription(row, list[i]);
        let name = list[0];
        name.container = row;
        if (trace) {
          console.log(ln + `name=`);
          console.dir(name);
        }
        // мілким шрифтом примітка
        // name.comment[lang] = list[0].regs.note.value;
        let el = new processMan.myElementsRender["text"]({
          reg: name,
          container: row,
          editable: false,
        });
        if (trace) {
          console.log(ln + `el=`);
          console.dir(el);
        }
        // row.appendChild(list[0].el.div);
      } else {
        // debugger;
        processMan.program.renderSteps(row, list[i]);
      }
      processMan.program.container.appendChild(row);
    }
  };

  //JSON.parse("!{JSON.stringify(processMan.htmlProgram)}");

  // let row = document.createElement("div");
  // row.classList.add("row");
  // processMan.container.appendChild(row);

  // let ln = "processMan_Main.js::";
}
