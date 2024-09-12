/** Асинхронна заглушка для імітації асинхронних операцій
 * @param {Number} period [period=1000] - мс, період очікування
 * @param {Boolean} randomize [randomize=false] - якщо true то період множиться на випадковий коефіцієнт
 * @param {Boolean} trace [ trace=false ] - якщо true то в консоль виводяться повідомлення
 */
async function dummyPromise(period = 1000, randomize = false, trace = false) {
  return new Promise((resolve, reject) => {
    let time = parseInt(period * (randomize ? Math.random() : 1));
    setTimeout(() => {
      trace ? console.log(`DummyPromise(${period}): Task complete`) : null;
      resolve();
    }, time);
  });
}

module.exports.dummyPromise = dummyPromise;
