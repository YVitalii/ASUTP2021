<template>
  <div class="parent-container">
    <h2>Панель керування джойстиком</h2>

    <!-- Панель керування станами (кнопки) -->
    <div class="controls">
      <button @click="toggleEnable">
        {{ isEnabled ? 'Disable' : 'Enable' }}
      </button>
      <button @click="toggleVisibility">
        {{ isVisible ? 'Hide' : 'View' }}
      </button>
    </div>

    <!-- Сам джойстик, куди передаємо стани та слухаємо подію command -->
    <div class="joystick-wrapper">
      <MyJoystick :enable="isEnabled" :visible="isVisible" @command="handleJoystickCommand" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MyJoystick from './joystick_upDownInsDel.vue'; // Шлях до твого компонента джойстика

// Реактивні змінні для керування станами
const isEnabled = ref<boolean>(true);
const isVisible = ref<boolean>(true);

// Функція перемикання стану Enable / Disable
const toggleEnable = () => {
  isEnabled.value = !isEnabled.value;
  console.log(`[State Changed] Джойстик тепер: ${isEnabled.value ? 'Enabled' : 'Disabled'}`);
};

// Функція перемикання стану View / Hide
const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
  console.log(`[State Changed] Джойстик тепер: ${isVisible.value ? 'Visible' : 'Hidden'}`);
};

// Обробник подій від джойстика
const handleJoystickCommand = (action: string) => {
  console.console?.log ? console.log(`[Event Received] Натиснуто кнопку: ${action}`) : console.log(`[Event Received] Натиснуто кнопку: ${action}`);
};
</script>

<style scoped>
.parent-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.controls button:hover {
  background-color: #35495e;
}

/* Фіксуємо розмір контейнера для джойстика, як ми обговорювали раніше */
.joystick-wrapper {
  width: 120px;
  height: 120px;
}
</style>