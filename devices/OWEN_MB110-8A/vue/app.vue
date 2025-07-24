<template>
    <div class="row">
        <div class="col-md-12">
            <h2 class="text-center">MB110-8A</h2>
        </div>
    <div class="row">
        <div class="col-3">T1</div>
        <div class="col-3">T2</div>
        <div class="col-3">T3</div>
    </div>
    <div class="row">
        <div class="col-3">T4</div>
        <div class="col-3">T5</div>
        <div class="col-3">T6</div>
    </div>
    
    <!-- <h2>MB-110-8A</h2>
    <button @click="count++">Лічильник: {{ count }}</button>
    <p> Device </p> -->
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