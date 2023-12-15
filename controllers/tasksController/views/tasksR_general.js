// створюємо прапорці трасування, так як в нас багато файлів нам потрыбно в кожному
// з них вмикати трасування окремо від інших , тому кожний файл з кодом
// перед виконанням свого коду запамятовує поточне значення trace в beforeTrace: 'beforeTrace=trace'
// після завершення відновлює попереднє значення 'trace=beforeTrace', таким чином модулі не будуть заважати іншим
let trace = 1,
  beforeTrace = 0;

/**
 *
 * @param {String} prefix  - префікс
 * @param {Object} reg - обєкт в якому визначена властивість "id"
 * @returns {String} "prefix__reg.id" - два підкреслення (щоб легко відділяти id регістру)
 */

tasks.createId = function (prefix, reg) {
  return (id = prefix + "__" + reg.id);
};
