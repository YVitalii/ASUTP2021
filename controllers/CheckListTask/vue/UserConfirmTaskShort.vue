<template>

    <div class="task-container" :class="stateClass" :id="id"
        :title="comment + '\nПочаток: ' + startTime + ' Тривалість: ' + duration + '\nПримітка: ' + note">
        <TaskStatesIcons :state="state" />
    </div>
    <!-- Модальне вікно з детальною інформацією про крок -->
    <ModalWindow v-if="showModal" @close="showModal = false" :show="showModal" :header="header"
        :headerButtonExitActive="false">

        <!-- Check List -->
        <CheckList :table="props.regs"> </CheckList>

        <div class="row justify-content-end" style="margin-top:10px;">

            <div class="col-3">
                <button class="btn btn-primary" @click="ok" :disabled="disableButtonOk">Готово</button>
            </div>
            <div class="col-3">
                <button class="btn btn-warning" @click="stop">Стоп</button>
            </div>
        </div>

    </ModalWindow>

</template>

<script setup>

//  function statesSelector(n=0){

//  }


import { ref, onMounted, computed } from 'vue';
import TaskStatesIcons from '@root/controllers/taskState_VueGeneral/TaskStateIcon.vue';
import ModalWindow from '@atoms/ModalWindow/ModalWindow.vue';
import CheckList from '@molecules/CheckList/СheckList.vue';


let showModal = ref(false);

const stop = () => {
    showModal.value = false;
    emit('stop');
    console.log("Stop clicked");

},
    ok = () => {
        showModal.value = false;
        emit('ok');
        console.log("Ok clicked");
    };

const emit = defineEmits(['stop', 'ok']);

let props = defineProps({
    id: { // id кроку
        type: String,
        required: true,
        default: ""
    },
    state: { //стан = ["waiting","going","finished","stoped","error"]
        type: String,
        required: true
    },
    note: { // Примітка
        type: String,
        required: false,
        default: ""
    },
    header: { // Заголовок
        type: String,
        required: true,
    },
    comment: { // Коментар
        type: String,
        required: false,
        default: ""
    },
    startTime: { // Час початку
        type: String,
        required: false,
        default: ""
    },
    duration: { // Тривалість
        type: String,
        required: false,
        default: ""
    },
    regs: { // Таблиця чеклісту
        type: Array,
        required: false,
        default: () => [{ id: "p-0", label: "Test", comment: "Test comment", required: true, checked: false }]
    },

});

const stateClass = computed(() => {
    switch (props.state) {
        case "waiting": return "state-waiting";
        case "going":
            showModal.value = true;
            return "state-going";
        case "finished": return "state-finished";
        case "stoped": return "state-stoped";
        case "error": return "state-error";
        default: return "";
    }
})

const disableButtonOk = computed(() => {
    if (!props.regs || props.regs.length == 0) return false;
    return props.regs.some(r => r.required && !r.checked);
});

onMounted(() => {
    console.log("UserConfirmTaskShort mounted");
    console.log("state=", props.state);
    console.dir(props)
});


</script>

<style scoped>
/* Контейнер SVG, який займає всю доступну висоту */
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

.svg-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Сам SVG елемент має фіксований розмір */
svg {
    width: auto;
    height: 100%;
    flex-shrink: 0;
    /* `viewBox` у SVG забезпечує масштабування контенту всередині */
}
</style>