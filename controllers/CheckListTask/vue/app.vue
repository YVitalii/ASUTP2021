<template>
  <div class="container-fluid swg-wrapper">
    <template v-if="taskState._id != 'going'">
      <UserConfirmTaskShort :state="taskState._id" :note=taskState.note :header=taskState.header.ua
        :comment=taskState.comment.ua :startTime=taskState.startTime :duration=taskState.duration />
    </template>

  </div>

</template>

<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:stepTest": "cross-env VITE_APP_ROOT=./controllers/CheckListTask/vue vite",
// потім запустити: npm run dev:vue:stepTest

import { ref } from 'vue';
import UserConfirmTaskShort from './UserConfirmTaskShort.vue';


let taskState = ref({
  _id: "waiting", // ["waiting","going","finished","stoped","error"]
  note: "Очікування",
  header: { ua: `Крок 1:1`, en: ``, ru: `` },
  comment: { ua: `Продувка N2`, en: ``, ru: `` },
  startTime: "17:05:15",
  duration: "00:05:15",
});
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