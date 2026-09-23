<template>
    <div class="time-field-container">
        <!-- Поле для годин -->
        <input type="number" v-model.number="hours" @input="updateValue" :min="0" :max="maxHours" :disabled="disabled"
            placeholder="ГГ" class="time-input" />
        <span class="separator">:</span>
        <!-- Поле для хвилин -->
        <input type="number" v-model.number="minutes" @input="updateValue" :min="0" :max="59" :disabled="disabled"
            placeholder="ХХ" class="time-input" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// 1. Приймаємо пропси, де modelValue, min та max можуть бути або рядком ("ГГ:ХХ"), або числом (хвилини)
const props = defineProps<{
    modelValue: string | number;
    min?: string | number;
    max?: string | number;
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

// Універсальна функція для перетворення вхідних даних (String або Number) у загальну кількість хвилин
const parseToMinutes = (val: string | number | undefined): number => {
    if (typeof val === 'number') {
        return isNaN(val) ? 0 : val;
    }
    if (!val) return 0;

    // Якщо це рядок у форматі "ГГ:ХХ"
    const strVal = val.toString();
    if (strVal.includes(':')) {
        const parts = strVal.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        return h * 60 + m;
    }

    // Якщо це просто рядок-число (наприклад, "90")
    return parseInt(strVal, 10) || 0;
};

// 2. Розраховуємо обмеження залежно від отриманого типу аргументу у max
const maxTotalMinutes = parseToMinutes(props.max ?? "99:59");
const maxHours = Math.floor(maxTotalMinutes / 60);

const hours = ref<number>(0);
const minutes = ref<number>(0);

// Локальна установка значень із підтримкою String та Number
const setLocalValues = (val: string | number | undefined) => {
    const totalMinutes = parseToMinutes(val);

    let clampedMinutes = totalMinutes;
    if (isNaN(clampedMinutes) || clampedMinutes < 0) clampedMinutes = 0;
    if (clampedMinutes > maxTotalMinutes) clampedMinutes = maxTotalMinutes;

    hours.value = Math.floor(clampedMinutes / 60);
    minutes.value = clampedMinutes % 60;
};

// Ініціалізуємо початкове значення
setLocalValues(props.modelValue);

// Слідкуємо за змінами modelValue ззовні
watch(() => props.modelValue, (newVal) => {
    setLocalValues(newVal);
});

// Обробка зміни значень у полях введення
const updateValue = () => {
    if (props.disabled) return;

    let h = hours.value || 0;
    let m = minutes.value || 0;

    if (h < 0) h = 0;
    if (h > maxHours) h = maxHours;

    if (m < 0) m = 0;
    if (m > 59) m = 59;

    hours.value = h;
    minutes.value = m;

    // Форматуємо у звичний рядок "ГГ:ХХ" для батьківського компонента
    const formattedHours = h.toString().padStart(2, '0');
    const formattedMinutes = m.toString().padStart(2, '0');
    const timeString = `${formattedHours}:${formattedMinutes}`;

    emit('update:modelValue', timeString);
};
</script>

<style scoped>
.time-field-container {
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.time-input {
    width: 40px;
    padding: 4px;
    text-align: center;
    font-family: monospace;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.time-input:disabled {
    background-color: #f5f5f5;
    color: #888;
    cursor: not-allowed;
}

.time-input::-webkit-outer-spin-button,
.time-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.separator {
    font-weight: bold;
    font-family: monospace;
    color: #555;
}
</style>