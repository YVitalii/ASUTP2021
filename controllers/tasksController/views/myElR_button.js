// ------- myElR_button.js -----------------------------------
beforeTrace = trace;
trace = 1;
/** Створює та повертає елемент button
 *
 */

myElementsRender["button"] = class ClassButton {
  /**
   * Створює DOM елемент кнопки та зберігає в this.btn
   * @param {*} props
   *
   */
  constructor(props = {}) {
    let but = document.createElement("button");
    but.id =
      props.prefix +
      "_btn_" +
      (props.name
        ? props.name
        : "noNameButton_" + new Date().getTime().toString().slice(-7));

    but.classList.add("btn");
    if (Array.isArray(props.classes)) {
      for (let i = 0; i < props.classes.length; i++) {
        but.classList.add(props.classes[i]);
      }
    }

    if (typeof props.attributes == "object") {
      for (let key in props.attributes) {
        if (props.attributes.hasOwnProperty(key)) {
          but.setAttribute(key, props.attributes[key]);
        }
      } // for
    }
    but.setAttribute("type", "button");
    but.innerHTML = props.innerHTML ? props.innerHTML : "<h6>???</h6>";
    but.onclick = this.onclick.bind(this);
    this.btn = but;
  } // constructor
  onclick(event) {
    let trace = 1,
      ln = `${this.btn.id}::Was pressed!!`;
    trace ? console.log(ln) : null;
  }
};
