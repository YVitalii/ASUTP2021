const ClassDriverGeneral = require("./ClassDriverGeneral");

class ClassDriverFake extends ClassDriverGeneral {
  constructor(props = {}) {
    props.id = "fakeDriver";
    props.header = {
      ua: `fake_driver`,
      en: `fake_driver`,
      ru: `fake_driver`,
    };
    props.comment = props.header;
    props.timeout = 2000;
    super(props);
  }
}

module.exports = ClassDriverFake;
