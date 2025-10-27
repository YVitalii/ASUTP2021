<!-- Підкрок задачі нагрівання -->

<template>
    <div v-if="props.step.type == 'quickHeating'" :title="title" class="col task-step-header" :class="stateClass">
        ↑↑
    </div>
    <div v-else-if="props.step.type == 'heating'" :title="title" class="col task-step-header" :class="stateClass">
        ↑
    </div>
    <div v-else-if="props.step.type == 'holding'" :title="title" class="col task-step-header" :class="stateClass">
        🕐
    </div>
</template>


<script setup>
import { computed, ref } from 'vue';
const props = defineProps({
    step: {
        type: Object,
        required: true,
    },
    // type: { // "quickHeating", "heating", "holding"
    //     type: String,
    //     required: true,
    // },
    // state: { //waiting, going, finished, stoped, error
    //     type: String,
    //     required: true,
    // },
    // title: { // примітка title
    //     type: String,
    //     required: false,
    //     default: "??",
    // },
});

const title = computed(() => {
    return `Стан: [ ${props.step.state} ]\n ${props.step.note} \n Початок: ${props.step.startTime} \n Тривалість: ${props.step.duration}`;
});

const stateClass = computed(() => {
    switch (props.step.state) {
        case "waiting": return "state-waiting";
        case "going": return "state-going";
        case "finished": return "state-finished";
        case "stoped": return "state-stoped";
        case "error": return "state-error";
        default: return "";
    }
});
</script>

<style scoped></style>