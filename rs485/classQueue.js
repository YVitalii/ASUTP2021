// mocha "./test/test_classQueue.js" -w --watch-list ["./","./test/"] -c --node

/**
 * Клас представляющий очередь
 */
class Queue {
  /**
   * Создает пустую очередь
   */
  constructor() {
    this.items = [];
    this.current = -1;
  } // constructor

  /**
   * текущая длина очереди
   * @return {Number} The number of items
   */
  get length() {
    return this.items.length;
  }

  /**
   * итератор по очереди
   * @return {Object} {end: true|false, value: the next register`s name}
   */
  next() {
    //console.log("this=");
    //console.dir(this);
    if (this.items.length == 0) return { end: true };
    this.current += 1;
    if (this.current >= this.items.length) {
      this.current = -1;
      return { end: true };
    }
    return { end: false, value: this.items[this.current] };
  } //next
  /**
   *
   * @param {string} item имя регистра
   * @returns {Boolean} trye/false успех/неудача
   */
  add(item) {
    item = item.trim();
    // ищем совпадение имен
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i] == item) return false;
    }
    this.items.push(item);
    return true;
  }

  delete(item) {
    item = item.trim();
    let result = false;
    // ищем совпадение имен
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i] == item) {
        this.items.splice(i, 1);
        result = true;
      }
    } //for
    return result;
  } //delete
} // class

module.exports = Queue;
