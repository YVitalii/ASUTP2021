<template>
  <section class="pm-description" :style="sectionStyle" aria-label="Опис програми">
    <component
      :is="componentFor(headerField.type)"
      class="pm-row"
      :model-value="headerField.value"
      :label="headerField.label"
      disabled
    />
    <component
      :is="componentFor(commentField.type)"
      class="pm-row"
      :model-value="commentField.value"
      :label="commentField.label"
      disabled
    />
    <div class="pm-times">
      <component
        :is="componentFor(startField.type)"
        class="pm-time"
        :model-value="startField.value"
        :label="startField.label"
        disabled
      />
      <component
        :is="componentFor(durationField.type)"
        class="pm-time"
        :model-value="durationField.value"
        :label="durationField.label"
        disabled
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import TextField_Labeled from "../../../vueComponents/fields/TextField_Labeled.vue";
import TextAreaField_Labeled from "../../../vueComponents/fields/TextAreaField_Labeled.vue";
import DateTimeField_Labeled from "../../../vueComponents/fields/DateTimeField_Labeled.vue";
import DayTimeField_Labeled from "../../../vueComponents/fields/DayTimeField_Labeled.vue";
import { settings } from "./settings.js";

const props = withDefaults(
  defineProps<{
    /** Заголовок програми. Рядок або {ua, en, ru}. */
    header?: string | LocalizedText | null;
    /** Опис програми. Рядок або {ua, en, ru}. */
    comment?: string | LocalizedText | null;
    /** Тривалість програми, "ДДdГГ:ХХ:СС". */
    duration?: string | null;
    /** Час старту. null — крок ще не починався. */
    startTime?: string | null;
    /** _id програми: waiting, going, error, finished, stoped. */
    stateId?: string;
  }>(),
  {
    header: "",
    comment: "",
    duration: "",
    startTime: null,
    stateId: "waiting",
  },
);

type LocalizedText = {
  ua?: string;
  en?: string;
  ru?: string;
};

const fieldComponents: Record<string, Component> = {
  TextField_Labeled,
  TextAreaField_Labeled,
  DateTimeField_Labeled,
  DayTimeField_Labeled,
};

const description = settings.process.description;
const fieldOrder = ["header", "comment", "startTime", "duration"] as const;

function localized(value: string | LocalizedText | null | undefined) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const lang = (globalThis as { lang?: string }).lang;
  if (lang === "en" || lang === "ru") {
    return value[lang] || value.ua || "";
  }
  return value.ua || value.en || value.ru || "";
}

function componentFor(type: string) {
  return fieldComponents[type] ?? TextField_Labeled;
}

const values = computed(() => ({
  header: localized(props.header),
  comment: localized(props.comment),
  startTime: props.startTime,
  duration: props.duration ?? "",
}));

const fields = computed(() =>
  Object.fromEntries(
    fieldOrder.map((key) => {
      const spec = description[key];
      return [
        key,
        {
          type: spec.type,
          label: spec.label,
          value: values.value[key],
        },
      ];
    }),
  ),
);

const stateIds = Object.keys(settings.states);

const sectionStyle = computed(() => {
  const id = stateIds.includes(props.stateId) ? props.stateId : "waiting";
  const colors = settings.states[id as keyof typeof settings.states];
  return { backgroundColor: colors.background };
});

const headerField = computed(() => fields.value.header);
const commentField = computed(() => fields.value.comment);
const startField = computed(() => fields.value.startTime);
const durationField = computed(() => fields.value.duration);
</script>

<style scoped>
.pm-description {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 2px solid #d9d9d9;
  margin: 2px 2px 0;
  padding: 5px;
  min-width: 0;
  border-radius: 5px 5px 0 0;
}

.pm-row {
  width: 100%;
  min-width: 0;
}

.pm-times {
  display: flex;
  gap: 8px;
  min-width: 0;
}

.pm-time {
  flex: 1 1 0;
  min-width: 0;
}
</style>
