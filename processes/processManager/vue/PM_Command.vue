<template>
  <section class="pm-command" aria-label="Керування">
    <slot>Керування</slot>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.pm-command {
  box-sizing: border-box;
  border: 2px solid #d9d9d9;
  margin: 0 0 2px;
  padding: 5px;
  min-width: 0;
  border-radius: 12px;
}
</style>
