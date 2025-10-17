<template>

  <div class="program-task-container container-fluide">

    <template v-if="datas.type == 'thermo'">
      <div class="row">
        <ProcessTaskGeneral v-bind="datas">
          <ThermoTask v-bind="datas"> </ThermoTask>
        </ProcessTaskGeneral>

      </div>
    </template>

    <h5 v-else> {{ ln }} Not defined type of task({{ datas.id }}): [{{ datas.type }}] </h5>



  </div>
  <button class="btn btn-primary" @click="clickNextState">Next</button>

</template>

<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:test": "cross-env VITE_APP_ROOT=./src/ontrollers/CheckListTask/vue vite",
// потім запустити: npm run dev:vue:test

import ProcessTaskGeneral from "@root/controllers/VueTaskGeneral/ProcessTaskGeneral.vue"
import ThermoTask from "@root/controllers/thermoController/vue/ThermoTask.vue"
import { ref } from 'vue';
let ln = "/controllers/thermoController/vue/app.vue" + "::";
let activeStep = 0;

const statesOrder = [
  () => { datas.value.state = "going", datas.value.tasks[0].state = "going" }, //0
  () => { datas.value.tasks[0].state = "finished" }, //1
  () => { datas.value.tasks[1].state = "going" }, //2
  () => { datas.value.tasks[1].state = "stoped" }, //3
  () => { datas.value.tasks[1].state = "error" }, //4
  () => { datas.value.state = "finished"; },
  () => { datas.value.state = "stoped"; }, //5
  () => { datas.value.state = "error" }, //6
  () => { datas.value.tasks[0].state = datas.value.tasks[1].state = datas.value.state = "waiting"; }, //7
];
function clickNextState() {

  statesOrder[activeStep]()

  console.log(`Step:${activeStep}; Next: ${datas.value.state}:[${datas.value.tasks[0].state};${datas.value.tasks[1].state}]`)
  activeStep += 1;
  if (activeStep == statesOrder.length) { activeStep = 0 }

}
let datas = ref({
  "id": "st_1",
  type: "thermo",
  "state": "waiting",
  "note": "Очікування",
  "duration": "0",
  "changed": "2025-10-16T07:40:43.378Z",
  startTime: "",
  "header": "Термообробка: tT=180; H=90; Y=150",
  "comment": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
  "tasks": [
    {
      "type": "quickHeating",
      "id": "st_1_1",
      "state": "waiting",
      "note": "Очікування",
      "duration": "0",
      startTime: "",
      "changed": "2025-10-16T07:40:43.377Z",
      "header": "=>180°C",
      "comment": "ТРМ251.Нагрівання до 180°C",
    },
    {
      "type": "heating",
      "id": "st_1_2",
      "state": "waiting",
      "note": "Очікування",
      "duration": "0",
      startTime: "",
      "changed": "2025-10-16T07:40:43.377Z",
      "header": "->180°C",
      "comment": "ТРМ251.Нагрівання до 180°C"
    },
    {
      "state": "waiting",
      "id": "st_1_3",
      "note": "Очікування",
      startTime: "",
      "duration": "0",
      "changed": "2025-10-16T07:40:43.378Z",
      "type": "holding",
      "header": "= 180°C",
      "comment": "ТРМ251.Витримка 180°C"
    }
  ]
} // 

);
</script>

<style scoped>
.program-task-container {
  border: 1px solid #42b860;
  padding: 10px;
  border-radius: 10px;
}
</style>