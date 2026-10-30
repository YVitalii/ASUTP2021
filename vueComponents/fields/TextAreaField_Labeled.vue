<template>
  <label class="labeled-field">
    <span class="labeled-field__caption">{{ caption }}</span>
    <TextAreaField
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TextAreaField from "./TextAreaField.vue";
import { fieldLabelText, type FieldLabel } from "./fieldLabel";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  /** Підпис поля: { ua, en, ru, ... }. */
  label: FieldLabel;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const caption = computed(() => fieldLabelText(props.label));
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
</style>
