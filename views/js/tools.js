var myTools = {};
myTools.dummy = async function (
  period = 1000,
  randomize = false,
  trace = false
) {
  /** Асинхронна заглушка для імітації асинхронних операцій
   * @param {Number} period=1000 - мс, період очікування
   * @param {Boolean} randomize=false - якщо true то період множиться на випадковий коефіцієнт
   * @param {Boolean} trace=false - якщо true то в консоль виводяться повідомлення
   */
  return new Promise((resolve, reject) => {
    let time = parseInt(period * (randomize ? Math.random() : 1));
    setTimeout(() => {
      trace ? console.log(`DummyPromise(${period}): Task complete`) : null;
      resolve();
    }, time);
  });
};
