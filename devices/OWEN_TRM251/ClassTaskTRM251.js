/**
 * Опис кроку програми для пристрою OWEN_TRM251
 */
const ClassTaskGeneral = require("../../controllers/tasksController/ClassTaskGeneral");

class ClassTaskTRM251 extends ClassTaskGeneral {
  constructor(props) {
       
    props.ln = props.ln ? props.ln : props.header.ua + "::";
    props.id = "taskTRM251";
    props.type="thermoStepTRM251";
    props.value=null;
    props.header = props.header && props.header.ua ? props.header : {
        ua: "ClassTaskTRM251",
        en: "ClassTaskTRM251",
        ru: "ClassTaskTRM251",
      };
    props.comment = props.comment && props.comment.ua ? props.coments : {
        ua: "ClassTaskTRM251",
        en: "ClassTaskTRM251",
        ru: "ClassTaskTRM251",
      };
    props.editable=true;
    super(props);
    
    if (! Number.isFinite(this.maxT) ) {
        this.log("i", this.ln + "constructor()::", `maxT=${this.maxT}`);
        throw new Error("maxT must be a defined number");
    }
    //Цільова температура
    this.regs.tT = new ClassReg_number({
      id: "tT",
      header:{ua:"tT", en:"tT", ru:"tT"},
      comment: {
        ua: "Цільова температура",
        en: "Target temperature",
        ru: "Целевая температура",
      },
      unit: "°C",
      min: 0,
      max: this.maxT,
      value: 0,
    });
    //Нагрівання
    this.regs.H = new ClassReg_timer({
        id: "H",
        header: {
          ua: "H",
          en: "H",
          ru: "H",
        },
        comment: {
          ua: "Нагрівання",
          en: "Heating",
          ru: "Нагрев",
        },
        unit: "хв",
        min: 0,
        max: 99*60,
        value: 0,
      });
      //Витримка
      this.regs.Y = new ClassReg_timer({
        id: "Y",
        header: {
          ua: "Y",
          en: "Y",
          ru: "Y",
        },
        comment: {
          ua: "Витримка",
          en: "Holding",
          ru: "Выдержка",
        },
        unit: "хв",
        min: 0,
        max: 99*60,
        value: 0,
      });
  }

}

module.exports = ClassTaskTRM251;