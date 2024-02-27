const ClassFileManager = class FileManager {
  constructor(props) {
    this.ln = `ClassFileManager(${props.id})::`;
    let trace = 1,
      ln = this.ln + "constructor()::";
    if (trace) {
      console.log(ln + `props=`);
      console.dir(props);
    }
    this.id = props.id;
    // list of types
    this.types = props.types;

    // container
    this.container = props.container
      ? props.container
      : console.error(this.ln + "Container not defined!");

    // list of buttons
    this.buttons = {};
    if (props.buttons) {
      props.buttons.types = this.types;
      this.buttons = new this.types["buttonGroup"](props.buttons);
    }
    // listFiles
    this.listFiles = new this.types["selectGeneral"](props.listFiles);

    this.getListFiles = props.getListFiles
      ? props.getListFiles
      : () => {
          console.log(this.ln + "Function getListFiles() not defined");
          return [];
        };
  } //constructor
};
