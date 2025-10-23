<template>
    <div class=" processMan-header-wraper " :class="stateClass" :title="stateTitle">
        <div class="">Програма:</div>
        <div class="h4 text-center programNameWrapper">{{ name }}</div>
        <pre class="font-italic">{{ description }}</pre>
    </div>
</template>

<script setup>

import { computed } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
        default: "",
    },
    state: { //waiting, going, finished, stoped, error
        type: String,
        required: true,
    },
});
const stateClass = computed(() => {
    switch (props.state) {
        case "waiting": return "state-waiting";
        case "going": return "state-going";
        case "finished": return "state-finished";
        case "stoped": return "state-stoped";
        case "error": return "state-error";
        default: return "";
    }
});
const stateTitle = computed(() => {
    switch (props.state) {
        case "waiting": return "Очікування";
        case "going": return "Виконується";
        case "finished": return "Завершена";
        case "stoped": return "Зупинена";
        case "error": return "Помилка";
        default: return "Не визначений стан";
    }
});
</script>

<style scoped>
.programNameWrapper {
    border: 2px solid #be4c4c;
    border-radius: 5%;
}

.processMan-header-wraper {
    border: 1px solid #1e6f1e;
    padding: 5px;
    border-radius: 5px;
}
</style>