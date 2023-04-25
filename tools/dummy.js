/** Асинхронна заглушка для імітації асинхронних операцій
 * @param {Number} period=1000 - мс, період очікування
 * @param {Boolean} randomize=false - якщо true то період множиться на випадковий коефіцієнт
 */
async function dummyPromise(period = 1000, randomize = false) {
  return new Promise((resolve, reject) => {
    let time = parseInt(period * (randomize ? Math.random() : 1));
    setTimeout(() => {
      //console.log(ln, "Dummy(): Task complete");
      resolve();
    }, time);
  });
}

module.exports.dummyPromise = dummyPromise;
