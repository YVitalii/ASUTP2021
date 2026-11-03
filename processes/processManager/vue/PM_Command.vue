<template>
  <section class="pm-command" aria-label="Керування">
    <button
      type="button"
      class="pm-command__run"
      :class="running ? 'is-stop' : 'is-start'"
      :disabled="busy || !program"
      @click="onRun"
    >
      {{ running ? stopLabel : startLabel }}
    </button>
    <TextField_Labeled
      class="pm-command__step"
      :model-value="stepText"
      :label="stepLabel"
      disabled
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import TextField_Labeled from "../../../vueComponents/fields/TextField_Labeled.vue";
import { fieldLabelText } from "../../../vueComponents/fields/fieldLabel";
import { usePostJson } from "../../../vueComponents/composables/usePostJson";
import { settings } from "./settings.js";

type LocalizedText = { ua?: string; en?: string; ru?: string };

type TaskState = {
  id?: string;
  _id?: string;
  type?: string;
  header?: string | LocalizedText;
  tasks?: unknown;
};

const props = defineProps<{
  /** Стан програми з POST /state. Кнопка дивиться на program._id. */
  program?: { _id?: string; tasks?: unknown } | null;
  /** id кроку, з якого стартувати. У тілі запиту це stepId. */
  stepId?: string;
  /** Підпис кроку, обраного кліком, поки програма не йде. */
  stepHeader?: string | LocalizedText | null;
}>();

const emit = defineEmits<{ done: [] }>();

const busy = ref(false);
const running = computed(() => props.program?._id === "going");
const startLabel = computed(() => fieldLabelText(settings.process.command.start));
const stopLabel = computed(() => fieldLabelText(settings.process.command.stop));
const stepLabel = settings.process.command.step;

function shownHeader(header: string | LocalizedText | null | undefined) {
  if (header == null) return "";
  if (typeof header === "string") return header;
  const lang = (globalThis as { lang?: string }).lang;
  if (lang === "en" || lang === "ru") return header[lang] || header.ua || "";
  return header.ua || header.en || header.ru || "";
}

function listSteps(tasks: unknown, out: TaskState[] = []) {
  if (!Array.isArray(tasks)) return out;
  for (const item of tasks) {
    if (Array.isArray(item)) {
      listSteps(item, out);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const step = item as TaskState;
    if (Array.isArray(step.tasks) && step.tasks.length) {
      listSteps(step.tasks, out);
      continue;
    }
    if (step.type === "stepDescription" || step.id == null) continue;
    out.push(step);
  }
  return out;
}

/** Поки програма йде, у полі останній крок зі станом going. */
const stepText = computed(() => {
  if (running.value) {
    const going = listSteps(props.program?.tasks).filter((step) => step._id === "going");
    const current = going[going.length - 1];
    if (current) return shownHeader(current.header);
  }
  return shownHeader(props.stepHeader);
});

function processUrl(relative: string) {
  const baseUrl = window.location.pathname.replace(/\/+$/, "");
  const path = String(relative).replace(/^\.\//, "/");
  return baseUrl + (path.startsWith("/") ? path : `/${path}`);
}

async function onRun() {
  if (busy.value || !props.program) return;
  busy.value = true;
  const stopping = running.value;
  const url = processUrl(stopping ? settings.url.stop : settings.url.start);
  try {
    const response = await usePostJson<{ err?: unknown }>(
      url,
      stopping ? {} : { stepId: props.stepId ?? "" },
    );
    if (!response?.err) emit("done");
  } catch {
    // usePostJson уже пише помилку в консоль.
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.pm-command {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 2px solid #d9d9d9;
  margin: 0 0 2px;
  padding: 5px;
  min-width: 0;
  border-radius: 12px;
}

.pm-command__run {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font: inherit;
  font-size: 1rem;
  cursor: pointer;
}

.pm-command__run:disabled {
  cursor: default;
  opacity: 0.7;
}

.is-start {
  background-color: #2e9e4f;
}

.is-stop {
  background-color: #d32f2f;
}

.pm-command__step {
  width: 100%;
  min-width: 0;
}
</style>
