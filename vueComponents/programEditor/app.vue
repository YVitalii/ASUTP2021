<template>
  <div class="parent-container">
    <ProgramEditWindow />
  </div>
</template>

<script setup lang="ts">
import ProgramEditWindow from "./ProgramEditWindow.vue";
</script>

<style scoped>
.parent-container {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 80vh;
  font-family: Arial, sans-serif;
}
</style>
