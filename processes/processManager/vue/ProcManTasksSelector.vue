<!-- Обирає та будує компонент в залежності від його типу -->
<template>
    <div class="task-wraper">
        <!-- <p>{{ task.type }}</p> -->
        <ThermoTask v-if="task.type === 'taskThermal'" v-bind="task">
        </ThermoTask>
    </div>

</template>

<script setup>

import ThermoTask from "@root/controllers/thermoController/vue/ThermoTask.vue";
let trace = 1, gLn = `ProcManTasksSelector::`;
const props = defineProps({
    task: { // масив кроків програми
        type: Object,
        required: true,
    },
});
if (trace) { console.log(gLn + `props.task=`); console.dir(props.task); }

</script>

<style scoped>
.task-wraper {
    border: 2px solid #6683c2;
    width: 100%;
    padding: 5px;
    margin-bottom: 5px;
    margin-left: 5px;
    margin-right: 5px;
    border-radius: 5px;
    background-color: #f9f9f9;
}
</style>