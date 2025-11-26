// console.log("Hello, World!");

const log = require("../../tools/log");

class Furnace {
  /**
   *
   * @param {Object} props
   * @property {Number} props.initialTemperature=20 - початкова температура печі
   * @property {Number} props.ambientTemperature=20 - температура навколишнього середовища
   * @property {Number} props.heatCapacity=1000 - теплоємність печі
   * @property {Number} props.heatLossCoefficient=0.002 * this.heatCapacity - коефіцієнт тепловтрат печі
   * @property {Number} props.power=1000 - максимальна потужність печі в Вт
   * @property {Number} props.deltaTime=2 - часовий крок моделювання в секундах
   */
  constructor(props = {}) {
    this.ln = "FurnaceModel::";
    // початкова температура печі
    this.currentTemperature = props.initialTemperature
      ? props.initialTemperature
      : 20;
    // температура навколишнього середовища
    this.ambientTemperature = 20;
    // теплоємність печі
    this.heatCapacity = props.heatCapacity ? props.heatCapacity : 1000;
    // коефіцієнт тепловтрат печі
    this.heatLossCoefficient = props.heatLossCoefficient
      ? props.heatLossCoefficient
      : 0.002 * this.heatCapacity;
    // максимальна потужність печі в Вт
    this.power = props.power ? props.power : 1000;
    // часовий крок моделювання в секундах
    this.deltaTime = props.deltaTime ? props.deltaTime : 2; // seconds
    // % потужність нагрівача в даний момент часу
    this.heatingPower = 0;
    // накопичена енергія печі
    this.accumulatedEnergy = this.currentTemperature * this.heatCapacity;
    // накопичена енергія в нагрівачі
    this.heater = {
      accumulatedEnergy: 0, // накопичена енергія нагрівача
      temperature: this.ambientTemperature, // температура нагрівача
      heatCapacity: this.heatCapacity * 0.15, // теплоємність нагрівача
      heatTransferCoefficient: 5, // коефіцієнт теплопередачі між нагрівачем і піччю
    };
    this.heater.accumulatedEnergy =
      this.heater.temperature * this.heater.heatCapacity;
    this.heater.heatTransferCoefficient = this.heatCapacity * 0.05; // коефіцієнт теплопередачі між нагрівачем і піччю
    // запускаємо оновлення температури

    this.updateTemperature();
  }

  /**
   * Оновлює температуру печі на основі потужності нагрівача та тепловтрат
   */
  updateTemperature() {
    let trace = 1;
    let msg = "furnaceModel::";
    let deltaTime = this.deltaTime;

    // Енегія що приходить в нагрівач
    let energyToHeater = this.heatingPower * deltaTime;
    msg += ` power=${this.heatingPower.toFixed(
      2
    )}W; energyToHeater=${energyToHeater.toFixed(2)}W; `;
    // Енегія що передається від нагрівача до печі
    let heatLostToFurnace =
      this.heater.heatTransferCoefficient *
      (this.heater.temperature - this.currentTemperature) *
      deltaTime;

    msg += ` heatLostToFurnace=${heatLostToFurnace.toFixed(2)}W; `;
    let dQ = energyToHeater - heatLostToFurnace;
    // Оновлюємо накопичену енергію нагрівача
    this.heater.accumulatedEnergy += dQ; // reset accumulated energy
    msg += ` heaterEnergy=${this.heater.accumulatedEnergy.toFixed(2)}W; `;
    // Оновлюємо температуру нагрівача
    this.heater.temperature =
      this.heater.accumulatedEnergy / this.heater.heatCapacity;
    msg += ` heaterTemp=${this.heater.temperature.toFixed(2)}C; `;

    // Calculate heat lost to the environment
    let heatLost =
      this.heatLossCoefficient *
      (this.currentTemperature - this.ambientTemperature) *
      deltaTime;

    msg += ` furnaceHeatLost=${heatLost.toFixed(2)}W; `;
    // Calculate heat added by the heating element
    this.accumulatedEnergy += heatLostToFurnace - heatLost;
    msg += ` furnaceEnergy=${this.accumulatedEnergy.toFixed(2)}W; `;
    // Update the current temperature
    this.currentTemperature = this.accumulatedEnergy / this.heatCapacity;
    msg += ` furnaceTemp=${this.currentTemperature.toFixed(2)}C; `;
    // log(
    //   "i",
    //   "Furnace::updateTemperature()",
    //   `Current temperature: ${this.currentTemperature}`
    // );
    if (trace) {
      console.log(msg);
    }
    setTimeout(() => {
      this.updateTemperature();
    }, deltaTime * 1000);
  }
  /**
   *
   * @param {Number} power - потужність нагрівача в %
   */
  setHeatingPower(power) {
    let trace = 1,
      ln = this.ln + `setHeatingPower(${power})::`;
    power = power < 0 ? 0 : power;
    power = power > 100 ? 100 : power;

    this.heatingPower = (power / 100) * this.power;
    trace
      ? log(
          "i",
          ln,
          `power set to ${power}% this.heatingPower=${this.heatingPower}W`
        )
      : null;
    // console.log("Heating power set to: ", this.heatingPower);
  }

  /**
   * Асинхронно встановлює потужність нагрівача
   * @param {Number} power - потужність нагрівача в %
   * @returns
   */
  async setPower(power) {
    this.setHeatingPower(power);
    return Promise.resolve(power);
  }

  getT() {
    return Promise.resolve(this.currentTemperature);
  }
}

if (!module.parent) {
  // Example usage
  const furnace = new Furnace({
    initialTemperature: 20,
    ambientTemperature: 20,
    heatCapacity: 1000,
    heatLossCoefficient: 0.1,
    power: 10000,
  });

  furnace.setHeatingPower(50);
  for (let i = 0; i < 10; i++) {
    furnace.updateTemperature(1);
    console.log(
      `Time: ${i + 1}s, Temperature: ${furnace.currentTemperature.toFixed(2)}°C`
    );
  }
}

module.exports = Furnace;
