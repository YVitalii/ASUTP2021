/** Виконує базові налаштування панелі керування програмою */
processMan.program.ln = "processMan.program::";
// кнопка "Редагувати завдання"
{
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
      setTimeout(() => {
        processMan.program.getList();
      }, 2000);
      console.warn(ln + response.status);
    }
  };

  /**
   * Отримує дані з серверу, генерує кроки, та налаштовує їх
   */
  processMan.program.init = async () => {
    let trace = 1,
      ln = processMan.program.ln + "init()::";
    try {
      trace ? console.log(ln + `Started`) : null;
      processMan.program.tasks = await processMan.program.getProgram();
      if (trace) {
        console.log(ln + `tasks=`);
        console.dir(processMan.program.tasks);
      }
      // очищуємо контейнер
      processMan.program.container.innerHTML = "";

      // промальовуємо кроки
      processMan.program.renderTasks();
    } catch (error) {}
  };

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
      item.state =
        // рендеримо задачу
        container.appendChild(
          new processMan.myElementsRender["step"]({
            container: container,
            reg: item,
          }).div
        );
      // let task = new processMan.myElementsRender (

      // )
    }
  };
  processMan.program.stop = async () => {
    let trace = 1,
      ln = processMan.program.ln + "stop()::";
    trace ? console.log(ln + `Started`) : null;
    // let response = await fetch(processMan.homeUrl + "getProgram", {
    //   method: "post",
    //   headers: {
    //     "Content-Type": "application/json;charset=utf-8",
    //   },
    // }); //
    // if (response.ok) {
    //   // отримуємо інформацію з сервера
    //   let res = await response.json();
    //   if (trace) {
    //     console.log(ln + `res=`);
    //     console.dir(res);
    //   }
    //   return res;
    // } else {
    //   // помилка запиту
    //   // плануємо наступний запит через 2 сек
    //   setTimeout(() => {
    //     processMan.program.getList();
    //   }, 2000);
    //   console.warn(ln + response.status);
    // }
  }; //processMan.program.stop()

  processMan.program.start = async (step = 1) => {
    let trace = 1,
      ln = processMan.program.ln + "start()::";
    trace ? console.log(ln + `Started`) : null;
    await processMan.post("start", { step });

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
    debugger;
    url = processMan.homeUrl + url;
    let trace = 1,
      ln = processMan.program.ln + `post(${url}::`;
    let response;
    try {
      response = await fetch(url, {
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
    let list = processMan.program.tasks.tasks;
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
        processMan.program.renderSteps(row, list[i]);
      }
      processMan.program.container.appendChild(row);
    }
  };

  setTimeout(() => {
    processMan.program.init();
  }, 1000);

  //JSON.parse("!{JSON.stringify(processMan.htmlProgram)}");

  // let row = document.createElement("div");
  // row.classList.add("row");
  // processMan.container.appendChild(row);

  // let ln = "processMan_Main.js::";
}
