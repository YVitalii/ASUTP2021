<script setup>
import { ref } from 'vue';

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
    }
});

// Створюємо реактивну змінну для відстеження стану чекбокса
const isChecked = ref(false);
</script>

<template>
    <div class="checkbox-container">
        <input type="checkbox" :id="id" :required="required" v-model="isChecked" />
        <label :for="id" :class="{ 'strikethrough': isChecked }">{{ label }}</label>
    </div>
</template>

<style scoped>
.checkbox-container {
    display: flex;
    align-items: center;
    gap: 10px;
    /* Відстань між чекбоксом і текстом */
}

.strikethrough {
    text-decoration: line-through;
    /* Закреслення тексту */
    color: #888;
    /* Зміна кольору для кращої візуалізації */
}
</style>