const ThermProcess = require("../../processes/ThermProcess/thermStep.js");
let thermProcess = new ThermProcess();
thermProcess.addStep({ holdTime: 50 });
