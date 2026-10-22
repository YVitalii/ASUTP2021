const ClassReg_number = require("./ClassReg_number.js");

/**
 * Число або "ГГ:ХХ" → цілі хвилини.
 * Непридатне значення, наприклад "badValue", повертає undefined.
 */
function toMinutes(val) {
  if (typeof val === "number" && Number.isFinite(val)) return Math.round(val);
  if (typeof val !== "string") return undefined;

  const text = val.trim();
  const time = /^(\d+):(\d{1,2})$/.exec(text);
  if (time) return parseInt(time[1], 10) * 60 + parseInt(time[2], 10);

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) {
    const num = Number(text);
    if (Number.isFinite(num)) return Math.round(num);
  }
  return undefined;
}

module.exports = class ClassReg_timer extends ClassReg_number {
  constructor(props = {}) {
    super({
      ...props,
      ln: "ClassReg_timer(" + props.id + ")::",
      min: props.min === undefined ? 0 : props.min,
      max: props.max === undefined ? 99 * 60 : props.max,
      unit: props.unit ? props.unit : {ua:"хв", en:"min", ru:"мин"},
    });
    this.type = "timer";
    this.ln = "ClassReg_timer(" + this.id + ")::";
  }

  setValue(val) {
    const minutes = toMinutes(val);
    if (minutes === undefined) {
      this.log(
        "e",
        ` ${this.ln}setValue():: Value = ${val} is badValue !! Value was not changed `
      );
      return this.value;
    }
    return super.setValue(minutes);
  }
};
