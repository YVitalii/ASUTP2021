class Door {
  /**
   *
   * @param {*} iface
   * @param {*} options
   */
  constructor(iface, options) {
    this.state = "opened";
  }
  /**
   * открывает дверь
   */
  openDoor() {
    let cantOpen = this.cantOpen();
    if (cantOpen) {
      throw new Error(cantOpen);
    }
  }
  closeDoor() {}
  isOpened() {
    return;
  }
  isClosed() {
    return;
  }
  canOpen() {}
  canClose() {}
} // class Door
