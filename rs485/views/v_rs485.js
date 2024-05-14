class ClassConnectionManager extends myElementsRender.ClassGeneralElement {
  constructor(props) {
    let trace = 1,
      ln = "ClassConnectionManager::";
    //props.reg = {};
    props.reg.header = {
      ua: `Менеджер з'єднання`,
      en: `Connections manager`,
      ru: `Менеджер связи`,
    };
    props.reg.value = undefined;
    props.reg.editable = false;
    props.ln = "connectionsManager::";
    super(props);
    if (trace) {
      console.log("i", ln, `this=`);
      console.dir(this);
    }
    this.container.setAttribute(
      "title",
      { ua: `Не визначено`, en: `Not defined`, ru: `Неопределено` }[lang]
    );
    setTimeout(() => {
      this.getState();
    }, 3 * 1000);
  }
  async getState() {
    let res;
    try {
      let connection = await fetch("/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({ id: this.id }),
      });
      if (connection.ok) {
        res = await connection.json();
      }
    } catch (error) {
      console.error(error);
    }
    if (res && (this.reg.value != res.isOpen || this.reg.value === undefined)) {
      let connected = document.getElementById(this.id + "_connected");
      let disconnected = document.getElementById(this.id + "_disconnected");
      if (res.isOpen) {
        connected.classList.remove("d-none");
        disconnected.classList.add("d-none");
      } else {
        connected.classList.add("d-none");
        disconnected.classList.remove("d-none");
      }
      //debugger;
      this.reg.value = res.isOpen;
      this.container.setAttribute("title", res.comment[lang]);
    }
    setTimeout(() => {
      this.getState();
    }, 10 * 1000);
  }
}
