// ------- myElR_alert.js -----------------------------------
beforeTrace = trace;
trace = 1;
/** Створює та повертає елемент alert
 *
 */
myElementsRender["alert"] = class ClassAlert extends (
  myElementsRender.ClassGeneralElement
) {
  constructor(props = {}) {
    props.ln = props.ln ? props.ln : `buttonGroup()::`;
  } // constructor
};
