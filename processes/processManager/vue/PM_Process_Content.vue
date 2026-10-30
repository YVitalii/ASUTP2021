<template>
  <section class="pm-content" aria-label="Тіло програми">
    <slot>Тіло програми</slot>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.pm-content {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  border: 2px solid #d9d9d9;
  margin: 2px;
  padding: 5px;
  border-radius: 0 0 5px 5px;
  background-color: #fff;
}
</style>
