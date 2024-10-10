// console.log("Hello, World!");

const log = require("../tools/log");

class Furnace {
  constructor({
    initialTemperature = 20,
    ambientTemperature = 20,
    heatCapacity = 1000,
    heatLossCoefficient = 0.1,
    power = 1000,
    deltaTime = 2,
  } = {}) {
    this.currentTemperature = initialTemperature;
    this.heatingPower = 0;
    this.ambientTemperature = ambientTemperature;
    this.heatCapacity = heatCapacity;
    this.heatLossCoefficient = heatLossCoefficient;
    this.power = power;
    this.deltaTime = deltaTime;
    this.updateTemperature();
  }

  updateTemperature() {
    let deltaTime = this.deltaTime;
    // Calculate heat added by the heating element
    const heatAdded = this.heatingPower * deltaTime;

    // Calculate heat lost to the environment
    const heatLost =
      this.heatLossCoefficient *
      (this.currentTemperature - this.ambientTemperature) *
      deltaTime;

    // Update the current temperature
    this.currentTemperature += (heatAdded - heatLost) / this.heatCapacity;
    // log(
    //   "i",
    //   "Furnace::updateTemperature()",
    //   `Current temperature: ${this.currentTemperature}`
    // );
    setTimeout(() => {
      this.updateTemperature();
    }, deltaTime * 1000);
  }

  setHeatingPower(power) {
    //power in % 0...100
    this.heatingPower = (power / 100) * this.power;
    // console.log("Heating power set to: ", this.heatingPower);
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
