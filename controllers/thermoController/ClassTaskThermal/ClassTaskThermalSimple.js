/**
 * Опис кроку програми простого кроку термообробки tT+H+Y
 */
const ClassTaskGeneral = require("../../tasksController/ClassTaskGeneral.js");
const ClassReg_number = require("../../regsController/ClassReg_number.js");
const ClassReg_timer = require("../../regsController/ClassReg_timer.js");

class ClassThermalTaskSimple extends ClassTaskGeneral {
  constructor(props) {
       
   
    props.id = "thermalTaskSimple";
    props.type="thermalTaskSimple";
    props.value=null;
    props.header = props.header && props.header.ua ? props.header : {
        ua: "Термообробка",
        en: "Thermal treatment",
        ru: "Термообработка",
      };
    props.comment = props.comment && props.comment.ua ? props.comment : {
        ua: "Термообробка tT+H+Y",
        en: "Thermal treatment tT+H+Y",
        ru: "Термообработка tT+H+Y",
      };
      props.ln = props.ln ? props.ln : props.header.ua + "::";
    props.editable=true;

    super(props);
    
    if (! Number.isFinite(props.maxT) ) {
        this.log("i", this.ln + "constructor()::", `maxT=${props.maxT}`);
        throw new Error("maxT must be a defined number");
    }
    this.maxT = props.maxT;
    
    let timeUnits = {ua:"хв", en:"min", ru:"мин"};

    //Цільова температура
    this.regs.tT = new ClassReg_number({
      id: "tT",
      header:{ua:"tT", en:"tT", ru:"tT"},
      comment: {
        ua: "Цільова температура",
        en: "Target temperature",
        ru: "Целевая температура",
      },
      unit: {ua:"°C", en:"°C", ru:"°C"},
      min: 0,
      max: this.maxT,
      value: props.tT,
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
        unit: timeUnits,
        min: 0,
        max: 99*60,
        value: props.H,
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
        unit: timeUnits,
        min: 0,
        max: 99*60,
        value: props.Y,
      });
  }

}

module.exports = ClassThermalTaskSimple;