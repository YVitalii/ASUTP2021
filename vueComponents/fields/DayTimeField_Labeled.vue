<template>
  <label class="labeled-field">
    <span class="labeled-field__caption">{{ caption }}</span>
    <input class="labeled-field__value" type="text" :value="shown" disabled />
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { fieldLabelText, type FieldLabel } from "./fieldLabel";

const props = defineProps<{
  /** Тривалість "ДДdГГ:ХХ:СС". */
  modelValue: string;
  disabled?: boolean;
  label: FieldLabel;
}>();

const caption = computed(() => fieldLabelText(props.label));

/** "ДДdГГ:ХХ:СС" → "ДДdГГ:ХХ". Рядок без секунд лишається як є. */
const shown = computed(() =>
  props.modelValue.replace(/^(\d+d\d{2}:\d{2}):\d{2}$/, "$1"),
);
</script>

<style scoped>
.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.labeled-field__caption {
  font-size: 1rem;
  font-style: italic;
  line-height: 1.2;
  color: #444;
}

.labeled-field__value {
  box-sizing: border-box;
  width: 100%;
  padding: 6px 10px;
  font-family: monospace;
  font-size: 16px;
  text-align: center;
  color: #555;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
</style>
