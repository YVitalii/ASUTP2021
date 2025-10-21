import { ref } from "vue";
const props = ref({
  // інформація для ProcessMan_Program
  header: {
    //=header.lang
    type: String,
    required: true,
  },
  description: {
    //=comment.lang
    type: String,
    default: "",
  },
  programState: {
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
  tasks: {
    type: Array,
    default: [],
  },
});

export default props;
