<template>
    <textarea v-model="internalValue" @input="updateValue" :disabled="disabled" rows="2"
        class="textarea-field"></textarea>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: string;  // Текст опису, що приходить із батьківського компонента
    disabled?: boolean;  // Стан блокування (для режиму readOnly)
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const internalValue = ref<string>(props.modelValue);

// Синхронізація локального значення при зміні ззовні
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
.textarea-field {
    width: 100%;
    padding: 6px 10px;
    font-family: inherit;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    resize: vertical;
    /* Дозволяє користувачеві змінювати висоту за потреби */
}

/* Візуальне оформлення заблокованого поля */
.textarea-field:disabled {
    background-color: #f5f5f5;
    color: #555;
    cursor: not-allowed;
    border-color: #e0e0e0;
}
</style>