/** загальні елементи для всых класів */

module.exports = class ClassGeneral {
  constructor(props) {
    let trace = 1,
      ln = "constructor::";
    // ----------- id -------------
    if (!props.id) {
      if (trace) {
        log("i", ln, `props=`);
        console.dir(props);
      }
      throw new Error(ln + `"id" of the component must be defined!`);
    }
    this.id = props.id;

    // ----------- header -------------
    let h = `${props.id}::`;
    this.header =
      props.header && props.header.en ? props.header : { ua: h, en: h, ru: h };

    // ----------- comment -------------

    this.comment =
      props.comment && props.comment.en ? props.comment : this.header;

    // ----------- ln -------------

    this.ln = props.ln ? props.ln : { ua: h, en: h, ru: h };
    this.ln += "::";
  }
};