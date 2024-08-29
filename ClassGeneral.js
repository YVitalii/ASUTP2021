/** загальні елементи для всіх класів */
// const log = require("./tools/log");
module.exports = class ClassGeneral {
  constructor(props) {
    // let trace = 1,
    //   ln = "constructor::";

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
};
