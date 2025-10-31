const ClassStepGeneral = require("../ClassStep/ClassStepGeneral");

class ClassStepFlowController extends ClassStepGeneral {
  /**
   *
   * @param {*} props
   * @param {Number} props.flow - потік в %
   * @param {Number} props.duration - хв, тривалість подачі газу
   */

  constructor(props = {}) {
    let trace = 1,
      ln = `${
        props.header && props.header.ua
          ? props.header.ua
          : "ClassStepFlowController"
      }::`;
    if (!typeof props.getFlow == "function") {
      throw new Error(
        ln +
          `props.getFlow must be async function but received: ${typeof props.getFlow}`
      );
    }
    super(props);
  }
} // class

module.exports = ClassStepFlowController;
