<template>
  <label class="labeled-field">
    <span class="labeled-field__caption">{{ caption }}</span>
    <span v-if="shown == null" class="labeled-field__unknown">???</span>
    <input v-else class="labeled-field__value" type="text" :value="shown" disabled />
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { fieldLabelText, type FieldLabel } from "./fieldLabel";

const props = defineProps<{
  /** ISO-час, "ГГ:ХХ" або null, якщо старт ще не було. */
  modelValue: string | null;
  disabled?: boolean;
  label: FieldLabel;
}>();

const caption = computed(() => fieldLabelText(props.label));

const shown = computed(() => {
  const value = props.modelValue;
  if (value == null || value === "") return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":");
    return `${hours}:${minutes}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});
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

.labeled-field__value,
.labeled-field__unknown {
  box-sizing: border-box;
  min-width: 4.5rem;
  padding: 6px 10px;
  font-family: inherit;
  font-size: 16px;
  color: #555;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.labeled-field__unknown {
  text-align: center;
  font-family: monospace;
  color: #888;
}
</style>
