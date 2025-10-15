<template>
  <div class="container">
    <template v-if="taskState._id != 'going'">
      <UserConfirmTaskShort :id="taskState._id" @ok="console.log('Click Ok received')" @stop="console.log('Click Stop received')"  :state="taskState.state" :note=taskState.note
        :header=taskState.header.ua :comment=taskState.comment.ua :startTime=taskState.startTime
        :duration=taskState.duration :regs=taskState.regs />
    </template>
    <button @click="changeState()">Change state</button>
  </div>

</template>



<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:stepTest": "cross-env VITE_APP_ROOT=./controllers/CheckListTask/vue vite",
// потім запустити: npm run dev:vue:stepTest

import { ref } from 'vue';
import UserConfirmTaskShort from './UserConfirmTaskShort.vue';


let taskState = ref({
  _id: "st1-1",
  state: "waiting", // ["waiting","going","finished","stoped","error"]
  note: "Підготовчі операції",
  header: { ua: `0:1. Підготовка газової системи`, en: ``, ru: `` },
  comment: { ua: `Продувка N2`, en: ``, ru: `` },
  startTime: "17:05:15",
  duration: "00:05:15",
  regs:[
    {id:"p-0", label:"Відкрити вентиль подачі Азоту", comment:"Тиск на редукторі: ~5±0,5 атм", required:true, checked:false},
    {id:"p-1", label:"Відкрити вентиль подачі Аміаку", comment:"Тиск на редукторі: ~1,5±0,5 атм", required:true, checked:false},
    {id:"p-1", label:"Відкрити вентиль подачі Вуглекислоти", comment:"Тиск на редукторі: ~5±0,5атм", required:true, checked:false},
    {id:"p-1", label:"Тиск на манометрах газового щита: N2=3атм; NH3-1атм; СО2-1атм;", comment:"За потреби підрегулювати регулятором тиску", required:true, checked:false},
  ]
});
let states=["waiting", "going", "finished", "stoped", "error"];
let currStateCode=0;
function changeState(n=0) {
  
  currStateCode++;
  if(currStateCode>=states.length) currStateCode=0;
  let newState=states[currStateCode];
  taskState.value.state = newState;
  console.log("Change state: "+newState);
}
// setTimeout(() => {
    
//     props.state = "finished";
// }, 2000);

</script>


<style scoped>
.vue-container {
  border: 1px solid #42b860;
  padding: 10px;
  border-radius: 10px;
  background-color: #f0fdf4;
  color: #35495e;
}
</style>