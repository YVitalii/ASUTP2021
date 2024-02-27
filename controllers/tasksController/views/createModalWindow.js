//myModalWindow = {};

const myModalWindow = new (class ModalWindow {
  /**
   * Модальне вікно для спілкування з користувачем
   * @param {*} props
   */
  constructor(props = {}) {
    this.header = props.header ? props.header : "Undefined";
    this.id = props.id
      ? props.id
      : "modal_" + new Date().getTime().toString().slice(-6);

    // there are saving links to DOM elements
    this.dom = {};

    // this.data - result of working modal window

    this.data = { canceled: false };

    let el;
    // -------- window --------------
    this.dom["window"] = el = document.createElement("div");
    // el =  this.dom.window;
    el.className = "modal fade";
    el.setAttribute("tabindex", "-1");
    el.setAttribute("data-bs-backdrop", "static");
    el.setAttribute("data-bs-keyboard", "false");
    el.id = this.id;

    document.body.appendChild(this.dom.window);

    // modal-dialog
    this.dom.dialog = el = document.createElement("div");
    el.className = "modal-dialog";
    this.dom.window.appendChild(this.dom.dialog);

    // content
    this.dom.content = el = document.createElement("div");
    el.className = "modal-content";
    this.dom.dialog.appendChild(this.dom.content);

    // header
    this.dom.header = el = document.createElement("div");
    el.className = "modal-header";
    el.id = this.id + "_header";
    el.innerHTML = this.header;
    this.dom.content.appendChild(this.dom.header);
    // body
    this.dom.body = el = document.createElement("div");
    el.className = "modal-body";

    let container = document.createElement("div");
    container.className = "container-fluid";
    container.id = this.id + "_body";

    el.appendChild(container);
    this.dom.content.appendChild(this.dom.body);
    // footer
    this.dom.footer = el = document.createElement("div");
    el.className = "modal-footer";
    el.id = this.id + "_footer";
    this.dom.content.appendChild(this.dom.footer);
    // footer.bCancel
    this.dom.footer.bCancel = el = document.createElement("button");
    el.className = "btn btn-secondary";
    el.setAttribute("type", "button");
    //el.setAttribute("aria-label", "Cancel");
    el.onclick = () => {
      console.log("Cancel clicked!");
      this.data = { canceled: true };
      this.window.hide();
    };
    el.innerText = { ua: `Відміна`, en: `Cancel`, ru: `Отмена` }[lang];

    this.dom.footer.appendChild(el);

    // властивість для керування вікном
    this.window = new bootstrap.Modal(this.dom.window, {
      keyboard: false,
      backdrop: "static",
    });
  } //constructor
  setHeader(content) {
    this.dom.header.innerHTML = content;
  }
  setBody(content) {
    this.dom.body.innerHTML = content;
  }
  setFooter(content) {}
})();
