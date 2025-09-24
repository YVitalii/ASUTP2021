const dummy = require("../../tools/dummy").dummyPromise;
const log = require("../../tools/log");
class ElectricOvenModel {
  /**
   *
   * @param {Object} props // додаткові налаштування
   * @param {*} props.gain=300 //Коефіцієнт підсилення (наприклад, °C/%): Наскільки градусів змінюється температура при зміні потужності на 100%  у сталому режимі.
   * @param {Number} props.timeConstant=30 // Постійна часу (наприклад, секунди): Час, за який температура досягає приблизно 63.2% своєї повної зміни. Це ключовий показник інерційності.
   * @param {Number} props.deadTime=10 - // Чиста затримка (наприклад, секунди): Час, протягом якого вихід не реагує на зміну входу (наприклад, тепло від нагрівачів доходить до датчика).
   * @param {Number} props.initialTemperature=20 // початкова температура
   * @param {Number} props.ambientTemperature=20 // температура навколишнього середовища
   * @param {Number} props.deltaTime=1 // секунди, крок симуляції
   */
  constructor(props = {}) {
    // Параметри моделі передавальної функції
    this.K = props.gain ? props.gain : 300; // Коефіцієнт підсилення (наприклад, °C/%)
    this.T1 = props.timeConstant ? props.timeConstant : 30; // Постійна часу (наприклад, секунди)
    this.tau = props.deadTime ? props.deadTime : 10; // Чиста затримка (наприклад, секунди)
    this.ln = "furnaceModel_transferF::";
    // Поточний стан моделі
    this.currentTemperature = props.initialTemperature
      ? props.initialTemperature
      : 20;
    this.ambientTemperature = props.ambientTemperature
      ? props.ambientTemperature
      : 20;
    this.outputBeforeDelay = this.currentTemperature; // Температура до застосування затримки
    // крок симуляції,
    this.deltaTime = props.deltaTime ? props.deltaTime : 1;
    this.currentPower = 0;
    this.currentTime = 0;
    // Буфер для імітації чистої затримки
    // Зберігає значення входу потужності для "tau" секунд у минулому
    this.delayBuffer = [];
    this.bufferSize = Math.ceil(this.tau / this.deltaTime); // Розмір буфера, якщо крок симуляції this.step сек
    for (let i = 0; i < this.bufferSize; i++) {
      this.delayBuffer.push(this.currentTemperature); // Початкові значення в буфері
    }
    this.update();
  } // constructor

  async setPower(power) {
    let trace = 1,
      ln = this.ln + `setPower(${power})::`;
    power = power < 0 ? 0 : power;
    power = power > 100 ? 100 : power;
    this.currentPower = power;
    trace
      ? log(
          "w",
          ln,
          `currentTime = ${this.currentTime}; currentPower=`,
          this.currentPower
        )
      : null;
    return power;
  }

  /**
   * Симулює один крок динаміки печі.
   * @param {number} inputPowerPercentage Вхідна потужність у відсотках (наприклад, 0-100%).
   * @param {number} deltaTime Крок симуляції в секундах (рекомендується невеликий, наприклад, 1).
   * @returns {number} Поточна температура печі.
   */
  update() {
    let trace = 0,
      ln = this.ln + `update[${this.currentTime}]::`;

    let inputPowerPercentage = this.currentPower;
    let deltaTime = this.deltaTime;
    // --- 1. Імітація інерційної ланки першого порядку (T1 s + 1) ---
    // Це дискретна апроксимація: dT/dt = (1/T1) * (K * Input - CurrentTemp)
    // Або CurrentTemp_new = CurrentTemp_old + (K * Input - CurrentTemp_old) * (deltaTime / T1)

    // Перетворюємо відсоток потужності в "фактичний" вхід для моделі, враховуючи температуру навколишнього середовища
    // Припускаємо, що 0% потужності відповідає температурі навколишнього середовища, а 100% - K градусів вище навколишнього.
    const targetTemperatureDueToPower =
      this.ambientTemperature + this.K * (inputPowerPercentage / 100);

    // Оновлюємо температуру, що пройшла інерційну ланку, але ще не пройшла затримку
    // Це експоненційне згладжування, яке апроксимує реакцію інерційної ланки
    this.outputBeforeDelay +=
      (targetTemperatureDueToPower - this.outputBeforeDelay) *
      (deltaTime / this.T1);

    // --- 2. Імітація чистої затримки (e^(-tau*s)) ---
    // Додаємо поточне значення до буфера затримки
    this.delayBuffer.push(this.outputBeforeDelay);

    // Видаляємо найстаріше значення з буфера
    // Якщо буфер заповнений, то беремо значення, яке було "tau" секунд тому
    if (this.delayBuffer.length > this.bufferSize) {
      this.currentTemperature = this.delayBuffer.shift();
    } else {
      // Якщо буфер ще не заповнився (на початкових кроках), температура просто слідує за виходом без затримки
      this.currentTemperature = this.outputBeforeDelay;
    }
    this.currentTime += this.deltaTime;
    trace
      ? log(
          "i",
          ln,
          `currentTime = ${this.currentTime}; pow=${
            this.currentPower
          }%; currentTemperature=${this.currentTemperature.toFixed(1)}`
        )
      : null;
    // setTimeout(() => {
    //   this.update();
    // }, this.deltaTime * 1000);

    return this.currentTemperature;
  }
  async getT() {
    return this.currentTemperature;
  }
}

// --- Приклад використання моделі ---

// Параметри печі (можна налаштувати!)
// Припустимо, піч може нагрітися на 300°C вище навколишнього середовища (K=300) при 100% потужності.
// Постійна часу 120 секунд (2 хвилини) - досить повільно нагрівається/охолоджується.
// Чиста затримка 10 секунд - затримка між подачею тепла та його реєстрацією датчиком.
const ovenParameters = {
  gain: 300, // Максимальне підвищення температури відносно навколишнього середовища при 100% потужності
  timeConstant: 120, // Секунди (T1)
  deadTime: 10, // Секунди (tau)
  initialTemperature: 20, // Початкова температура печі
  ambientTemperature: 20, // Температура навколишнього середовища
  deltaTime: 2, // Крок симуляції в секундах
};

const oven = new ElectricOvenModel(ovenParameters);

console.dir(oven);

// const deltaTime = 1; // Крок симуляції в секундах

// Вхідна потужність:
// Спочатку 0%
// Через 10 секунд -> 100%
// Через 100 секунд -> 50%
// Через 200 секунд -> 0% (вимкнути нагрів)

(async () => {
  // Масив для збереження даних для графіку (якщо потрібно)
  const temperatureLog = [
    { time: 0, pow: oven.currentPower, temp: await oven.getT() },
  ];
  let currentTime = 0;
  const simulationTime = 300; // Загальний час симуляції в секундах (5 хвилин)
  console.log("--- Симуляція температури печі ---");
  console.log(
    `Початкова температура: ${oven.currentTemperature.toFixed(2)} °C`
  );
  while (currentTime <= simulationTime) {
    if (currentTime === 10) {
      oven.setPower(100);
    } else if (currentTime === 100) {
      oven.setPower(50);
    } else if (currentTime === 200) {
      oven.setPower(0);
    }
    oven.update();
    let t = await oven.getT();
    temperatureLog.push({
      time: oven.currentTime,
      pow: oven.currentPower,
      temp: parseFloat(t.toFixed(1)),
    });
    currentTime += ovenParameters.deltaTime;
    //await dummy(ovenParameters.props.deltaTime * 1000);
  }
  console.log("\n--- Симуляція завершена ---");
  console.table(temperatureLog);
})();

// Можна вивести лог для подальшої обробки (наприклад, побудови графіку)
