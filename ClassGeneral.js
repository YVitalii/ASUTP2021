/** загальні елементи для всіх класів */
// const log = require("./tools/log");
module.exports = class ClassGeneral {
  /**
   * Загальний інтерфейс
   * @param {Object} props
   * @param {String} props.id
   * @param {String} props.header={ua:id.en:id,ru:id} - назва компонента (виводиться в заголовку)
   * @param {String} props.comment={ua:"".en:"",ru:""} - примітка з поясненням (спливаюча підказка, або меншим шрифтом)
   * @param {String} props.ln=props.id+"::" - заголовок для логера
   */

  constructor(props) {
    let trace = 0,
      ln = "ClassGeneral::constructor::";

    // ----------- id -------------
    if (props.id === undefined) {
      // if (trace) {
      //   log("i", ln, `props=`);
      //   console.dir(props);
      // }
      throw new Error(ln + `"id" of the component must be defined!`);
    }
    this.id = props.id;

    // ----------- header -------------
    let h = `${props.id}`;
    this.header =
      props.header && props.header.en ? props.header : { ua: h, en: h, ru: h };

    // ----------- comment -------------
    this.comment =
      props.comment && props.comment.en
        ? props.comment
        : { ua: ``, en: ``, ru: `` };

    // ----------- ln -------------
    this.ln = props.ln ? props.ln : this.id + "::";
  }
  getAll() {
    return {
      id: this.id,
      header: this.header,
      comment: this.comment,
      ln: this.ln,
    };
  }
};
