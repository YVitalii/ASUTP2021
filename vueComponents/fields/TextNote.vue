<template>
  <div class="text-note" :class="{ stacked: long }">
    <div class="text-note__body">
      <span class="text-note__label">{{ label }}</span>
      <span class="text-note__content">{{ content }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  content: string;
}>();

/** Довший за 25 символів текст завжди стоїть під підписом. */
const long = computed(() => (props.content ?? "").length > 25);
</script>

<style scoped>
.text-note {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  container-name: text-note;
}

.text-note__body {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.text-note.stacked .text-note__body {
  flex-direction: column;
  align-items: stretch;
  gap: 0.15rem;
}

@container text-note (width < 150mm) {
  .text-note__body {
    flex-direction: column;
    align-items: stretch;
    gap: 0.15rem;
  }
}

.text-note__label {
  flex: 0 0 auto;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.2;
}

.text-note__content {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.2;
  overflow-wrap: break-word;
}
</style>
