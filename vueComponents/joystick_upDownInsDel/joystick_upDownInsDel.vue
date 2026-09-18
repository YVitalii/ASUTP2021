<template>
    <div v-show="visible" :class="['joystick-container', { disabled: !enable }]">
        <div class="quadrant leftTop" @click="handleClick('UP')">▲</div>
        <div class="quadrant rightTop" @click="handleClick('DELETE')">x</div>
        <div class="quadrant leftBottom" @click="handleClick('DOWN')">▼</div>
        <div class="quadrant rightBottom" @click="handleClick('INSERT')">+</div>
    </div>
</template>

<script setup lang="ts">
// Визначаємо вхідні параметри (пропси) з типізацією TypeScript
interface Props {
    enable?: boolean;  // Стан активності (true/false)
    visible?: boolean; // Стан видимості (true/false)
}

// Задаємо значення за замовчуванням для пропсів
withDefaults(defineProps<Props>(), {
    enable: ! true,
    visible: ! true
});

// Оголошуємо подію для передачі команди батьківському компоненту
const emit = defineEmits<{
    (e: 'command', action: string): void;
}>();

// Обробник кліку по квадрантах
const handleClick = (action: string) => {
    emit('command', action);
};
</script>

<style scoped>
.joystick-container {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    background-color: #e0e0e0;
    /* Колір внутрішніх ліній сітки */
    box-sizing: border-box;

    /* Додаємо зовнішню рамку та заокруглення */
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    /* Гарантує, що кути дочірніх елементів не вилазять за заокруглення */
}

.quadrant {
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
}

/* Внутрішні лінії між квадрантами */
.leftTop {
    border-right: 2px solid #e0e0e0;
    border-bottom: 2px solid #e0e0e0;
}

.rightTop {
    border-bottom: 2px solid #e0e0e0;
}

.leftBottom {
    border-right: 2px solid #e0e0e0;
}

.quadrant:hover {
    background-color: #f0f0f0;
}

/* Стан disable: напівпрозорість та відключення подій миші */
.disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>