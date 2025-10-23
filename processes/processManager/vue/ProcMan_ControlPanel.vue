<template>

    <div class="input-group mb-3">
        <div class="input-group-prepend">
            <button class="btn" :class="btnClass" type="button" @click="$emit('click', startStepNumber)"
                id="button-addon1" :title="btnPopUp">
                {{ btnContent }}
            </button>
        </div>
        <input type="number" class="form-control" v-model="startStepNumber" min="1" :max="props.programLength"
            placeholder="" aria-label="Example text with button addon" aria-describedby="button-addon1"
            title="Стартовий номер кроку програми" :disabled="inputDisabled">
    </div>
</template>



<script setup>

import { computed, ref } from 'vue';
defineEmits(['click']);
const props = defineProps({
    btnStartEnable: {
        type: Boolean,
        required: true,
    },
    programLength: {
        type: Number,
        required: false,
        default: 1,
    },
});

const startStepNumber = ref(1);

const btnClass = computed(() => {
    return props.btnStartEnable ? "btn-primary" : "btn-danger";
});

const btnPopUp = computed(() => {
    return props.btnStartEnable ? "Запустити програму" : "Зупинити програму";
});
const btnContent = computed(() => {
    return props.btnStartEnable ? "Start" : "Stop";
});
const inputDisabled = computed(() => {
    return props.btnStartEnable ? false : true;
});

</script>

<style scoped>
.controlPanelWrapper {
    border: 1px solid #8f1e1e;
    padding: 5px;
    border-radius: 5px;
    background-color: #e4bcbc;
}
</style>