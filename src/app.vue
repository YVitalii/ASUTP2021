<template>
  <div class="vue-container container">
    <h1>Привіт з Vue!</h1>
    <p>Це мій перший Single File Component.</p>
    <button @click="count++">Лічильник: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const count = ref(0);
</script>

<style scoped>
.vue-container {
  border: 1px solid #42b883;
  padding: 20px;
  margin-top: 20px;
  border-radius: 8px;
  background-color: #f0fdf4;
  color: #35495e;
}
button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}
button:hover {
  background-color: #35495e;
}
</style>