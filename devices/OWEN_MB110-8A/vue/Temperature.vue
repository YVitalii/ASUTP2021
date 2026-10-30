<template>
  <h6 :title="title" class="text-center border rounded">{{ shown }}</h6>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    value?: number | string | null;
    title?: string;
  }>(),
  {
    value: "?",
    title: "?",
  },
);

const title = props.title;
const shown = ref<string>(String(props.value ?? "?"));

watch(
  () => props.value,
  (incoming) => {
    if (incoming === undefined || incoming === null) {
      shown.value = "?";
      return;
    }
    const formatted = parseFloat(String(incoming)).toFixed(1);
    console.log(
      `Temperature.vue::newValue(${incoming}):: ${title}=${formatted}`,
    );
    shown.value = formatted;
  },
  { immediate: true },
);
</script>
