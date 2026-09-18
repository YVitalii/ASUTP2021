<template>
    <input type="number" v-model.number="internalValue" @input="updateValue" :min="min" :max="max" :disabled="disabled"
        class="number-input" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: number;          // Значення числа, що приходить із батьківського компонента
    min?: number | string;       // Мінімальний ліміт з конфігурації приладу
    max?: number | string;       // Максимальний ліміт з конфігурації приладу
    disabled?: boolean;          // Стан блокування (для режиму readOnly)
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
}>();

const internalValue = ref<number>(props.modelValue);

// Синхронізація локального значення при зміні ззовні
watch(() => props.modelValue, (newVal) => {
    internalValue.value = newVal;
});

// Обробка введення та перевірка лімітів
const updateValue = () => {
    if (props.disabled) return;

    let val = internalValue.value;

    // Якщо значення не є числом, скидаємо до мінімуму або 0
    if (isNaN(val)) {
        val = Number(props.min) || 0;
    }

    // Суворе дотримання межі min/max, якщо вони задані в конфігурації
    if (props.min !== undefined && val < Number(props.min)) {
        val = Number(props.min);
    }
    if (props.max !== undefined && val > Number(props.max)) {
        val = Number(props.max);
    }

    internalValue.value = val;
    emit('update:modelValue', val);
};
</script>

<style scoped>
.number-input {
    width: 80px;
    padding: 4px;
    text-align: center;
    font-family: monospace;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

/* Візуальне оформлення заблокованого інпуту */
.number-input:disabled {
    background-color: #f5f5f5;
    color: #888;
    cursor: not-allowed;
}
</style>