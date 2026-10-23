<template>
  <div class="page">
    <h1>naviButtons</h1>

    <section class="wide">
      <p>Широкий контейнер</p>
      <NaviButtons entity-id="demo" />
    </section>

    <section class="narrow">
      <p>Вузький контейнер</p>
      <NaviButtons entity-id="demo" />
    </section>
  </div>
</template>

<script setup lang="ts">
import NaviButtons from "./naviButtons.vue";
</script>

<style scoped>
.page {
  box-sizing: border-box;
  width: 100%;
  padding: 16px;
  font-family: Arial, sans-serif;
}

.wide,
.narrow {
  margin-bottom: 24px;
}

.narrow {
  width: 220px;
}

p {
  margin: 0 0 8px;
}
</style>
