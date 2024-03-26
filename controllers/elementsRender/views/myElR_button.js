// ------- myElR_button.js -----------------------------------
beforeTrace = trace;
trace = 1;
/** Створює та повертає елемент button
 *
 */

myElementsRender["button"] = class ClassButton extends (
  myElementsRender.ClassGeneralElement
) {
  /**
   * Створює DOM елемент кнопки та зберігає в this.el
   * @param {*} props
   *
   */
  constructor(props = {}) {
    props.ln = props.ln ? props.ln : `ClassButton(${props.reg.id})::`;

    super(props);

    let trace = 1,
      ln = this.ln + "ClassButton::constructor::";

    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }

    // - посилання на батьківську структуру даних(для вик. в обробниках подій
    // - ми прив'язуємо this до обробника події тому parent - не потрібний
    // - ми беремо з prefix=parent.id тому потрібен
    this.parent = props.parent;

    this.tag = props.action && props.action === "link" ? "a" : "button";
    // console.warn(ln + `props.action=${props.action}; this.tag=${this.tag}; `);
    // створюємо елемент ДОМ
    let but = document.createElement(this.tag);
    console.warn(`this.parent.id=${this.parent.id}`);
    but.id = (this.parent.id ? this.parent.id + "_" : "") + this.id;
    // ? this.id
    // : console.error(this.ln + "Id of button not defined!");

    // оформлюємо кнопку
    but.classList.add("btn");
    but.setAttribute("type", "button");
    if (trace) {
      console.log(ln + `but=`);
      console.dir(but);
    }
    if (props.reg.classes) {
      this.setClassList(but, props.reg.classes);
    }
    if (props.reg.attributes) {
      this.setAtributes(but, props.reg.attributes);
    }

    // спливаюча підказка
    if (props.reg.comment && props.reg.comment[lang]) {
      but.setAttribute("title", props.reg.comment[lang]);
    }

    //  напис на кнопці
    but.innerHTML = props.reg.header[lang]
      ? props.reg.header[lang]
      : "<h6>???</h6>";
    // обробник кліку
    but.onclick = props.onclick
      ? props.onclick.bind(this)
      : this.onclick.bind(this);
    // зберігаємо кнопку
    this.el = but;
    this.container.appendChild(but);
  } // constructor
  onclick(event) {
    let trace = 1,
      ln = `${this.el.id}::Was pressed!! External event listener not defined!   `;
    trace ? console.log(ln) : null;
  }
};
