<template>


    <div class="row " style="margin-right:0px; margin-left:0px;">


        <div class="col task-content-wraper">

            <div class="row">
                <div class="col task-step-wraper" :class="stateClass" :title>
                    <div class="task-step-header">{{ task.header }}</div>
                </div>
            </div>

            <div class="row">
                <template v-for="step in props.task.steps">

                    <ThermoTaskSubStep :step="step">

                    </ThermoTaskSubStep>

                    <!-- <ProcessTaskGeneral v-bind="step">
                        <div class="task-step-header">{{ step.header }}</div>
                    </ProcessTaskGeneral> -->
                </template>
            </div>


        </div>
    </div>



</template>

<script setup>
import { computed, ref } from 'vue';
import ThermoTaskSubStep from "@root/controllers/thermoController/vue/ThermoTaskSubStep.vue"
import TaskStateIcon from "@root/controllers/VueTaskGeneral/TaskStateIcon.vue"



const props = defineProps({
    task: {
        type: Object,
        required: true,
    },

});

const title = computed(() => {
    return `Стан: [ ${props.task.state} ]\n ${props.task.note} \n Початок: ${props.task.startTime} \n Тривалість: ${props.task.duration}`;
});

const stateClass = computed(() => {
    switch (props.task.state) {
        case "waiting": return "state-waiting";
        case "going": return "state-going";
        case "finished": return "state-finished";
        case "stoped": return "state-stoped";
        case "error": return "state-error";
        default: return "";
    }
});
</script>

<style scoped>
.task-step-header {
    text-align: center;
}
</style>