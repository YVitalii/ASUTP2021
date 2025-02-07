el.reqString = "";
// основні скрипти  керування

for (key in el.regs) {
  if (el.regs.hasOwnProperty(key)) {
    el.reqString += ";" + key;
    el.regs[key].container = document.getElementById(el.prefix + key);
  }
}

el.setState = function (value) {
  //debugger;
  let trace = 1,
    key = "state",
    ln = `${this.prefix}::getState::` + new Date().toLocaleTimeString() + ":: ";
  // опис зовнішнього вигляду стану приладу
  el.stateClasses = {
    stop: ["bg-secondary", "text-light"],
    running: ["bg-success", "text-light"],
    warning: ["bg-warning", "text-dark"],
    error: ["bg-danger", "text-light"],
  };
  //debugger;
  // обробка зміни стану приладу Пуск / Стоп / Помилка
  value = value ? parseInt(value) : undefined;
  if (!value || isNaN(value)) {
    value = 13; // немає зв'язку
  }
  // якщо стан не змінився - наступна ітерація
  //- console.log(ln+`this.regs.state.value=${this.regs.state.value};value=${value}.`)
  if (this.regs.state.value != value) {
    this.regs.state.value = value;
    // визначаємо новий стиль
    let newState = "warning";
    switch (value) {
      case 1:
      case 7:
        // режим стоп
        newState = "stop";
        break;
      case 13:
        //увага
        newState = "error";
        break;
      case 17:
      case 23:
        //режим Пуск
        newState = "running";
        break;
      case 71:
      case 87:
        //аварія
        newState = "error";
        break;

      default:
        console.log(`Not defined state= ${res.state}`);
    }
    // let contClassList=this.container.classList;
    if (this.state) {
      // видаляємо попередні класи
      this.stateClasses[this.state].map((item) => {
        this.container.classList.remove(item);
      });
    }
  } //if (this.regs.state.value != value)
  //- console.log(ln+`Before state:${this.state}. New state:: newState=${newState}`);
  //- console.dir (this);
  // додаємо нову класи
  this.stateClasses[newState].map((item) => {
    this.container.classList.add(item);
  });
  // запамятовуємо новий стан
  this.state = newState;
  let title = this.regs["state"].states[value][lang];
  this.container.setAttribute("title", title);
}; //el.getState = function(value) {

//el.getState();

el.getRegs = async function () {
  let trace = 0,
    ln =
      `${this.prefix}::getRegs()::` + new Date().toLocaleTimeString() + ":: ";
  //- trace ? console.log(ln+"Started!") : null;
  //- debugger;
  let response,
    res,
    err = false;
  try {
    response = await fetch(this.homeUrl + "/getRegs", {
      method: "POST",
      headers: { "Content-type": "application/json;charset=utf-8" },
      body: JSON.stringify({ regsList: this.reqString }),
    }); //fetch
    if (response.ok) {
      // запит поточних значень
      res = await response.json();
    }
  } catch (error) {
    console.error(ln + error.message);
    err = true;
  } // трасувальник
  debugger;
  if (trace) {
    let msg = "";
    for (let key in res) {
      if (res.hasOwnProperty(key)) {
        debugger;
        msg += `${res[key].id}=${res[key].value}; `;
      }
    }
    console.log(ln + msg);
    console.dir(res);
  }

  // обробка отриманих значень

  for (let key in this.regs) {
    let value = res && res[key] ? parseInt(res[key]) : undefined;
    if (key == "state") {
      this.setState(value);
      continue;
    }
    this.regs[key].container.innerText = value && !isNaN(value) ? value : "???";
  } //for (key in el.regs) ;

  // плануємо наступний запит
  setTimeout(
    () => {
      this.getRegs();
    },
    err ? 6000 : 3000
  );
}; //el.getRegs = async function ()

// ініціюємо перший запит
el.getRegs();
