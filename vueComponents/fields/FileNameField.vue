<template>
    <div class="tooltip-container">
        <!-- Базове поле вводу для назви файлу -->
        <TextField :modelValue="modelValue" :disabled="disabled" @update:modelValue="handleInput" />

        <!-- Спливаюча примітка ( tooltip ), яка з'являється при наведенні мишки -->
        <div class="tooltip-popup">
            Не використовуйте в назві програми символи: \ / : * ? " &lt; &gt; |
        </div>
    </div>
</template>

<script setup lang="ts">
import TextField from './TextField.vue';

const props = defineProps<{
    modelValue: string;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const handleInput = (value: string) => {
    if (props.disabled) return;

    // Регулярний вираз для фільтрації заборонених файлових символів
    const forbiddenCharsRegex = /[\\/:*?"<>|]/g;
    const cleanedValue = value.replace(forbiddenCharsRegex, '');

    emit('update:modelValue', cleanedValue);
};
</script>

<style scoped>
/* Контейнер обгортки має відносне позиціонування, щоб примітка прив'язувалася до поля */
.tooltip-container {
    position: relative;
    display: inline-block;
    width: 100%;
}

/* Стилі для спливаючої примітки за замовчуванням приховані */
.tooltip-popup {
    visibility: hidden;
    background-color: #333333;
    color: #ffffff;
    text-align: center;
    border-radius: 4px;
    padding: 6px 10px;
    position: absolute;
    z-index: 100;
    bottom: 125%;
    /* Розміщуємо підказку прямо над полем вводу */
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    /* Щоб підказка не перехоплювала кліки миші */
}

/* Стрілочка знизу примітки для гарного візуального оформлення */
.tooltip-popup::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333333 transparent transparent transparent;
}

/* Показуємо примітку, коли користувач наводить мишку на контейнер поля вводу */
.tooltip-container:hover .tooltip-popup {
    visibility: visible;
    opacity: 1;
}
</style>