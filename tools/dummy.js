/** Асинхронна заглушка для імітації асинхронних операцій */
async function dummyPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      //console.log(ln, "Dummy(): Task complete");
      resolve();
    }, parseInt(Math.random() * 1000));
  });
}

module.exports.dummyPromise = dummyPromise;
