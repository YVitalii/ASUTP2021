<!-- src/fields/Button.vue -->
<template>
    <button class="custom-btn" :style="{ backgroundColor: bgColor }" :disabled="disabled" @click="$emit('click')">
        <slot>{{ text }}</slot>
    </button>
</template>

<script setup lang="ts">
defineProps<{
    text?: string;
    bgColor?: string;
    disabled?: boolean; // Приймаємо стан блокування
}>();

defineEmits<{
    (e: 'click'): void;
}>();
</script>

<style scoped>
.custom-btn {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: bold;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s;
    text-align: center;
}

/* Стиль для заблокованої кнопки */
.custom-btn:disabled {
    background-color: #bdc3c7 !important;
    cursor: not-allowed;
    opacity: 0.7;
}
</style>