<template>
  <section
    ref="host"
    class="pm-description"
    :style="sectionStyle"
    aria-label="Опис програми"
    @mouseenter="showCaption"
    @mouseleave="hideCaption"
  >
    <TextNote
      class="pm-row"
      :label="localized(headerField.label)"
      :content="headerField.value ?? ''"
    />
    <TextNote
      class="pm-row"
      :label="localized(commentField.label)"
      :content="commentField.value ?? ''"
    />
    <div class="pm-times">
      <DayTimeField_Labeled
        class="pm-time"
        :model-value="durationField.value ?? ''"
        :label="durationField.label"
        disabled
      />
    </div>
    <CaptionSimple ref="caption" :content="captionText" />
  </section>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import TextNote from "../../../vueComponents/fields/TextNote.vue";
import CaptionSimple from "../../../vueComponents/fields/CaptionSimple.vue";
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
    /** Примітка стану програми. Рядок або {ua, en, ru}. */
    note?: string | LocalizedText | null;
    /** _id програми: waiting, going, error, finished, stoped. */
    stateId?: string;
  }>(),
  {
    header: "",
    comment: "",
    duration: "",
    startTime: null,
    note: null,
    stateId: "waiting",
  },
);

type LocalizedText = {
  ua?: string;
  en?: string;
  ru?: string;
};

const description = settings.process.description;
const noteLabel = { ua: "Примітка:", en: "Note:", ru: "Примечание:" };
const fieldOrder = ["header", "comment", "startTime", "duration"] as const;
const host = useTemplateRef<HTMLElement>("host");
const caption = useTemplateRef<InstanceType<typeof CaptionSimple>>("caption");

function localized(value: string | LocalizedText | null | undefined) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const lang = (globalThis as { lang?: string }).lang;
  if (lang === "en" || lang === "ru") {
    return value[lang] || value.ua || "";
  }
  return value.ua || value.en || value.ru || "";
}

/** ISO-час → локальний рядок. Порожнє значення — "???". */
function formatStart(value: string | null | undefined) {
  if (value == null || value === "") return "???";
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":");
    return `${hours}:${minutes}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "???";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shown(value: string | null | undefined) {
  if (value == null || value === "") return "???";
  return value;
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
const durationField = computed(() => fields.value.duration);

const captionText = computed(() => {
  const lines = [
    values.value.header,
    `${localized(description.startTime.label)} ${formatStart(props.startTime)}`,
    `${localized(description.duration.label)} ${shown(props.duration)}`,
    `${localized(noteLabel)} ${localized(props.note) || "???"}`,
  ];
  const about = values.value.comment;
  if (about) lines.push(`${localized(description.comment.label)} ${about}`);
  return lines.filter((line) => line !== "").join("\n");
});

function showCaption() {
  if (host.value) void caption.value?.show(host.value);
}

function hideCaption() {
  caption.value?.hide();
}
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
