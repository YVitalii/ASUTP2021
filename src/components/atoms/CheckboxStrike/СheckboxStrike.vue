<script setup>
import { ref } from 'vue';
let gLn = "checkbox_strike.vue::script::";
// Визначаємо властивості, які компонент отримуватиме від батька
const props = defineProps({
    label: {
        type: String,
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    id: {
        type: String,
        required: true
    },
    // Додаємо властивість, яка приймає значення від v-model
    modelValue: {
        type: Boolean,
        default: false
    }
});

// Визначаємо подію, яку компонент надсилатиме батьку
const emit = defineEmits(['update:modelValue']);

// Функція-обробник, яка викликається при зміні стану чекбокса
const handleChange = (event) => {
    let trace = 1, ln = gLn + "handleChange()::";
    if (trace) { console.log(ln + `event.target.checked=`); console.dir(event.target.checked); }
    emit('update:modelValue', event.target.checked);
};
</script>

<template>
    <div class="checkbox-container">
        <input type="checkbox" :id="id" :required="required" :checked="modelValue" @change="handleChange" />
        <label :for="id" :class="{ 'strikethrough': modelValue }">{{ label }}</label>
    </div>
</template>

<style scoped>
.checkbox-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.strikethrough {
    text-decoration: line-through;
    color: #888;
}
</style>