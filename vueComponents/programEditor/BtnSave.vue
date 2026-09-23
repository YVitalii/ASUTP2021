<!-- src/ProgramEditor/BtnSave.vue -->
<template>
    <BaseButton text="Зберегти" bg-color="#27ae60" :disabled="disabled" @click="handleClick" />
</template>

<script setup lang="ts">
import BaseButton from '../fields/Button.vue';

// Приймаємо пропс disabled від батьківського компонента (наприклад, ProgramEditor)
defineProps<{
    disabled?: boolean;
}>();

const emit = defineEmits<{
    (e: 'click'): void;
}>();

const handleClick = () => {
    console.log(`BtnSave.vue clicked`)
    emit('click');
};
</script>