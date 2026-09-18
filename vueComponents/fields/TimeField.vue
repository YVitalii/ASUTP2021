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

const props = defineProps<{
    modelValue: number;
    min?: string | number;
    max?: string | number;
    disabled?: boolean; // Додаємо пропс блокування
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
}>();

const parseToMinutes = (val: string | number | undefined): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const parts = val.toString().split(':');
    if (parts.length === 2) {
        return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return parseInt(val, 10) || 0;
};

const maxTotalMinutes = parseToMinutes(props.max ?? 5999);
const maxHours = Math.floor(maxTotalMinutes / 60);

const hours = ref<number>(0);
const minutes = ref<number>(0);

const setLocalValues = (totalMinutes: number) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) totalMinutes = 0;
    if (totalMinutes > maxTotalMinutes) totalMinutes = maxTotalMinutes;

    hours.value = Math.floor(totalMinutes / 60);
    minutes.value = totalMinutes % 60;
};

setLocalValues(props.modelValue);

watch(() => props.modelValue, (newVal) => {
    setLocalValues(newVal);
});

const updateValue = () => {
    if (props.disabled) return; // Захист від змін, якщо заблоковано

    let h = hours.value || 0;
    let m = minutes.value || 0;

    if (h < 0) h = 0;
    if (h > maxHours) h = maxHours;

    if (m < 0) m = 0;
    if (m > 59) m = 59;

    hours.value = h;
    minutes.value = m;

    const totalMinutes = h * 60 + m;
    emit('update:modelValue', totalMinutes);
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

/* Робимо вигляд заблокованих інпутів більш помітним */
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