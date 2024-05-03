/**
 * Задача модуля записувати події що виникають під час роботи
 */
const logger = require("../tools/log.js");

class EventLogger {
  /**
   *
   * @param {String} fileName -  повне імя файлу в який буде виконуватися запис подій, наприклад: "./public/logs/SShAM-712-7/eventLogs"
   * @param {*} params - параметри (поки не використовуються).
   */
  constructor(fileName, params) {
    this.fileName = fileName;
    this.fh = null; // дескриптор файлу
  }
  l(str) {
    logger();
  }
}
