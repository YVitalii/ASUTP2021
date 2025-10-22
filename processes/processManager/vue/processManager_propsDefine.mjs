// опис даних
const props = {
  // інформація для ProcessMan_Program
  header: {
    type: String,
    required: true,
    default: "not defined",
  },
  description: {
    //=comment.lang
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "waiting",
  },
  // інформація для панелі контролю ProcessMan_Control
  btnStartEnable: {
    type: Boolean,
    default: false,
  },
  startStepNumber: {
    type: Number,
    default: 1,
  },
  //------ ProcessMan_Program --------
  steps: {
    type: Array,
    default: [],
  },
};

export default props;
