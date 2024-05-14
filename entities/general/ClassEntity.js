const log = require("../../tools/log.js");
const TasksManager = require("../../controllers/tasksController/ClassTasksManager.js");
const ClassDevicesManager = require("../../devices/devicesManager/ClassDevicesManager.js");

class ClassEntity {
  constructor(props) {
    // id печі
    if (props.id) {
      this.id = props.id;
    } else {
      throw new Error("fullName must be defined!");
    }
    // заголовок для логування
    this.ln = this.id + "::";
    // коротка назва
    if (props.shortName && props.shortName.ua) {
      this.shortName = props.shortName;
    } else {
      throw new Error("shortName must be defined!");
    }

    // повна назва
    this.fullName =
      props.fullName && props.fullName.ua ? props.fullName : this.shortName;

    // домашня директорія
    this.homeDir = props.homeDir ? props.homeDir : pathNormalize(__dirname);

    // домашня URL адреса виробу
    this.homeUrl = (props.baseUrl ? props.baseUrl : "") + "/entity/" + this.id;

    this.devicesManager = new DeviceManager({ baseUrl: this.homeUrl });

    this.tasksManager = new TasksManager(props);
  }
}
