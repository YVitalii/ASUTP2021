<template>
    <div class="time-field-container">
        <!-- Поле для годин -->
        <input type="text" inputmode="numeric" maxlength="2" v-model="hoursText" @blur="updateValue"
            @keydown="onKeydown($event, 'hours')" :disabled="disabled" placeholder="ГГ" class="time-input" />
        <span class="separator">:</span>
        <!-- Поле для хвилин -->
        <input type="text" inputmode="numeric" maxlength="2" v-model="minutesText" @blur="updateValue"
            @keydown="onKeydown($event, 'minutes')" :disabled="disabled" placeholder="ХХ" class="time-input" />
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

const hoursText = ref<string>("00");
const minutesText = ref<string>("00");

const pad2 = (value: number) => value.toString().padStart(2, "0");

// Локальна установка значень із підтримкою String та Number
const setLocalValues = (val: string | number | undefined) => {
    const totalMinutes = parseToMinutes(val);

    let clampedMinutes = totalMinutes;
    if (isNaN(clampedMinutes) || clampedMinutes < 0) clampedMinutes = 0;
    if (clampedMinutes > maxTotalMinutes) clampedMinutes = maxTotalMinutes;

    hoursText.value = pad2(Math.floor(clampedMinutes / 60));
    minutesText.value = pad2(clampedMinutes % 60);
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

    let h = parseInt(hoursText.value, 10) || 0;
    let m = parseInt(minutesText.value, 10) || 0;

    if (h < 0) h = 0;
    if (h > maxHours) h = maxHours;

    if (m < 0) m = 0;
    if (m > 59) m = 59;

    const formattedHours = pad2(h);
    const formattedMinutes = pad2(m);
    hoursText.value = formattedHours;
    minutesText.value = formattedMinutes;

    const timeString = `${formattedHours}:${formattedMinutes}`;

    emit('update:modelValue', timeString);
};

const onKeydown = (event: KeyboardEvent, part: "hours" | "minutes") => {
    if (props.disabled) return;

    if (event.key === "Enter") {
        event.preventDefault();
        (event.target as HTMLInputElement).blur();
        return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const delta = event.key === "ArrowUp" ? 1 : -1;
    const wrap = (value: number, max: number) => {
        const span = max + 1;
        return ((value % span) + span) % span;
    };

    if (part === "hours") {
        const h = wrap((parseInt(hoursText.value, 10) || 0) + delta, maxHours);
        hoursText.value = pad2(h);
    } else {
        const m = wrap((parseInt(minutesText.value, 10) || 0) + delta, 59);
        minutesText.value = pad2(m);
    }

    updateValue();
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