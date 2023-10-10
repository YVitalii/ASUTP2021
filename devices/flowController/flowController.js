/**
 Class 
constructor (props)
this.currValue =0..100% поточна витрата в % - перенесена в processValue
this.
this.
this.setPoint = 0...100 - [%]  - поточна цільова витрата
this.processValue = 0..100 - [%]  - поточна реальна витрата
this.
this.work=true - індикатор робота/очікування 
this.stabilization=false - індикатор перехідного процесу (щоб не було помилки періодичн. перевірки під час зміни цільової витрати)
this.
this.period = this.periodSets.waiting  // поточний період опитування стану РВ
this.tryTimes=3 - кількість спроб при очікуванні зміни потоку
this.
this.
this.defaultTestValuesList=[0,25,50,75,100]  // список точок для перевірки стартової витрати
this.getFlow() - повертає поточну витрату газу в м3/год 

*/

/**
 * Класс FlowController, що керує роботою регулятора потоку
 */

// const device = require("../WAD-MIO-MAXPro-645/driver.js"); //драйвер приладу
const log = require("../../tools/log.js");

class FlowControler {
  /**
   * @param {Object}  props - об'єкт з налаштуваннями
   * @param {Object}  props.regErr = {low:90; high:110}, [%]- помилка регулювання
   * @param {Number}  props.id = адреса в мережі RS485
   * @param {String}  props.shortName = коротка назва "АмВ" для логів
   * @param {String}  props.fullName =  назва контролера, наприклад "Аміак. Великий"
   * @param {Object}  props.scale = {low,high} [м3/год] - градуювання регулятора витрати для розрахунку поточної витрати в м3/год
   * @param {Object}  props.getValue() = async функція драйвера приладу , яка має повертати поточну витрату fullfilled(прочитана витрата 0..100%) або reject якщо прочитати неможна
   * @param {Object}  props.setValue() = async функція драйвера приладу , яка має записувати поточну витрату в прилад та повертати fulfilled(витрата 0..100%) або reject якщо записати не можна
   * @param {Object}  props.periodSets ={working:30,waiting:120,stabilization:30} [сек]  = час періодичного опитування стану контролера та час очікування стабілізації витрати
   * */
  constructor(props = null) {
    /** @private {String} ln - загальний підпис для логування */
    this.ln = `FlowControler(+ ${
      props.shortName ? props.shortName : "null"
    })::`;
    let ln = this.ln + "constructor()::";

    // --------- this.regErr ------------------
    this.regErr = {};
    this.regErr.low = props.regErr.low ? props.regErr.low : 90;
    this.regErr.high = props.regErr.high ? props.regErr.low : 110;

    // ----------------this.id
    this.id = props.id ? props.id : "null";

    // ----------------this.shortName
    this.shortName = props.shortName ? props.shortName : "null";

    // ----------------this.fullName
    this.fullName = props.fullName ? props.fullName : "null";

    // --------- this.scale ------------------
    this.scale = {};
    this.scale.low = props.scale.low ? props.scale.low : 0;
    this.scale.high = props.scale.high ? props.scale.low : 1;

    // -------- id  ---------------
    if (!id) {
      let err = ln + "Має бути вказана адреса приладу";
      log("e", err);
      throw new Error(err);
    }
    this.id = id;
    // ----- iface --------------------------------
    if (!iface) {
      let err = ln + "Має бути вказаний інтерфейс для звязку з приладом";
      log("e", err);
      throw new Error(err);
    }
    this.iface = iface;
    this.value;
  }
}
