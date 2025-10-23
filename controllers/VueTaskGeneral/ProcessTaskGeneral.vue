<template>

    <div class="task-container">

        <slot> Вміст кроку</slot>

    </div>

</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    id: { // номер кроку
        type: String,
        required: true,
    },
    type: { // "thermo", "checklist", "flow"...
        type: String,
        required: true,
        default: "",
    },
    state: { //waiting, going, finished, stoped, error
        type: String,
        required: true,
    },
    note: { // примітка title
        type: String,
        required: false,
        default: "",
    },
    duration: {
        type: String, //"03:05:00"
        required: false,
        default: "??",
    },
    startTime: {
        type: String, //(new Date()).toLocaleString()="16.10.2025, 12:30:00"
        required: false,
        default: "",
    },
    header: { // Заголовок кроку
        type: String,
        required: true,
    },
    comment: { // Коментар кроку входить в спливаючу підказку
        type: String,
        required: false,
        default: "",
    },
    tasks: { // Таблиця чеклісту
        type: Object,
        required: false,
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
})

const popup = computed(() => {
    let popup = `Заголовок: ${props.header}\nСтан: ${props.state}\nПримітка: ${props.note}\nКоментар: ${props.comment}\nЧас початку: ${props.startTime}\nТривалість: ${props.duration}`;
    return popup;
});

</script>

<style scoped>
.task-container {
    height: 5vW;
    border-color: black;
    border-width: 1px;
    border-style: solid;
    border-radius: 5px;
}

.state-waiting {
    background-color: lightgray;
    /* Світло-сірий фон для очікування */
    color: #000;
    /* Чорний текст */
}

.state-going {
    background-color: lightgreen;
    color: black;
}

.state-finished {
    background-color: lightblue;
    color: white;
}

.state-stoped {
    background-color: darkorange;
    color: black;
}

.state-error {
    background-color: crimson;
    color: white;
}
</style>