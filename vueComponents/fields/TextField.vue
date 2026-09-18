<template>
    <input type="text" v-model="internalValue" @input="updateValue" :disabled="disabled" class="text-input" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: string;  // Текст, що приходить із батьківського компонента
    disabled?: boolean;  // Стан блокування (для режиму readOnly)
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const internalValue = ref<string>(props.modelValue);

// Синхронізація локального значення, якщо воно змінюється ззовні
watch(() => props.modelValue, (newVal) => {
    internalValue.value = newVal;
});

// Передача оновленого значення наверх
const updateValue = () => {
    if (props.disabled) return;
    emit('update:modelValue', internalValue.value);
};
</script>

<style scoped>
.text-input {
    width: 100%;
    padding: 6px 10px;
    font-family: inherit;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}

/* Візуальне оформлення заблокованого поля */
.text-input:disabled {
    background-color: #f5f5f5;
    color: #555;
    cursor: not-allowed;
    border-color: #e0e0e0;
}
</style>