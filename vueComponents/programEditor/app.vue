<template>
  <div class="parent-container">
    <h2>Панель редагування програми</h2>
    <MyComponent></MyComponent>



  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MyComponent from './component.vue'; // Шлях до  компонента 
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
</style>