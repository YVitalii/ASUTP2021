/**
 * Ця функція виконує передану їй функцію item , якщо невдача то виклик повторюється тричі
 * @param {async Function} item - функцію, яку потрібно виконати кілька разів
 * @param {object} params - дані що передаються в функцію item {regName,id,iface..}
 * @param {Number} times=3 - кількість спроб
 * @returns {Promise} Promise resolved when Ok
 */
async function trySomeTimes(item, params, times = 3) {
  // додати перевірку на тип помилки, бо коли помилка в назві регистра не потрібно повторювати тричі
  return new Promise(async (resolve, reject) => {
    let trace = 0,
      ln = this.ln + `trySomeTimes(${params.regName}=${params.value})::`;
    let res = null;
    let err = null;
    for (let i = 0; i < times; i++) {
      trace ? console.log(ln, "Спроба:" + i) : null;
      try {
        res = await item(params);
        trace ? console.log(ln, "res=") : null;
        trace ? console.dir(res) : null;
        resolve(res);
        break;
        return;
      } catch (error) {
        log("e", ln, "Невдала спроба:" + error);
        err = error;
        continue;
      }
      //await item(params);
    } //for
    // всі спроби невдалі
    reject(err);
  });
} //trySomeTimes(item, params)

module.exports = trySomeTimes;
