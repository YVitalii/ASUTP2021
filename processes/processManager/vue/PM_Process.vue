<template>
  <div class="pm-frame" :style="frameStyle">
    <section
      v-if="loading"
      class="pm-description-loading"
      :style="{ backgroundColor: stateColors.background }"
      aria-label="Опис програми"
    >
      <div class="pm-loading" role="status">
        <span class="pm-spinner" />
        <span>Завантаження…</span>
      </div>
    </section>
    <slot v-else name="description" />
    <div v-if="loading" class="pm-loading pm-content-loading" role="status">
      <span class="pm-spinner" />
      <span>Завантаження…</span>
    </div>
    <PM_Process_Content
      v-else-if="program"
      :state="program"
      @select-step="(step) => emit('select-step', step)"
    />
    <pre v-else class="pm-state">{{ errorMessage }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { usePostJson } from "../../../vueComponents/composables/usePostJson";
import PM_Process_Content from "./PM_Process_Content.vue";
import { settings } from "./settings.js";

const props = withDefaults(
  defineProps<{
    /** Стан програми: waiting, going, error, finished, stoped. */
    stateId?: string;
    /** Збільшується після Старт/Стоп, щоб одразу перечитати стан. */
    reloadToken?: number;
  }>(),
  { stateId: "waiting", reloadToken: 0 },
);

type LocalizedMessage = { ua?: string; en?: string; ru?: string };

type ProgramState = {
  header?: string | LocalizedMessage;
  comment?: string | LocalizedMessage;
  startTime?: string | null;
  duration?: string;
  note?: string | LocalizedMessage | null;
  _id?: string;
  tasks?: unknown;
};

type StateResponse = {
  err: LocalizedMessage | null;
  data: { content: ProgramState } | null;
};

const emit = defineEmits<{
  loaded: [program: ProgramState];
  "update:stateId": [id: string];
  "select-step": [step: { id: string; header?: ProgramState["header"] }];
}>();

const stateIds = Object.keys(settings.states);

const loading = ref(true);
const program = ref<ProgramState | null>(null);
const errorMessage = ref("");
/** JSON попереднього стану: однаковий відповідь не замінює program. */
let lastStateJson = "";
const activeId = ref(props.stateId);
/** Опитування стану, мс. */
const pollMs = 10_000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollBusy = false;

watch(
  () => props.stateId,
  (id) => {
    if (id) activeId.value = id;
  },
);

const stateColors = computed(() => {
  const id = stateIds.includes(activeId.value) ? activeId.value : "waiting";
  return settings.states[id as keyof typeof settings.states];
});

const frameStyle = computed(() => ({
  borderColor: stateColors.value.board,
}));

watch(activeId, (id) => {
  if (id && id !== props.stateId) emit("update:stateId", id);
});

watch(
  () => props.reloadToken,
  () => {
    void loadState();
  },
);

/** baseUrl сторінки + шлях стану з settings ("./process/state" → "/process/state"). */
function processStateUrl() {
  const baseUrl = window.location.pathname.replace(/\/+$/, "");
  const statePath = String(settings.url.state).replace(/^\.\//, "/");
  return baseUrl + (statePath.startsWith("/") ? statePath : `/${statePath}`);
}

function errorText(err: LocalizedMessage | string | null | undefined) {
  if (!err) return "Немає даних";
  if (typeof err === "string") return err;
  return err.ua || err.en || err.ru || "Немає даних";
}

async function loadState() {
  if (pollBusy) return;
  pollBusy = true;
  try {
    const response = await usePostJson<StateResponse>(processStateUrl(), {});
    if (response?.err || response?.data?.content == null) {
      if (!program.value) errorMessage.value = errorText(response?.err);
      return;
    }
    const content = response.data.content;
    const nextJson = JSON.stringify(content);
    if (nextJson === lastStateJson) return;
    lastStateJson = nextJson;
    errorMessage.value = "";
    program.value = content;
    if (content._id) activeId.value = content._id;
    emit("loaded", content);
  } catch (error) {
    if (!program.value) {
      errorMessage.value =
        error instanceof Error ? error.message : "Немає зв'язку з сервером";
    }
  } finally {
    pollBusy = false;
    loading.value = false;
  }
}

onMounted(() => {
  void loadState();
  pollTimer = setInterval(() => {
    void loadState();
  }, pollMs);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.pm-frame {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 5px solid #808080;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
}

.pm-description-loading {
  box-sizing: border-box;
  border: 2px solid #d9d9d9;
  margin: 2px 2px 0;
  padding: 5px;
  min-width: 0;
  border-radius: 5px 5px 0 0;
}

.pm-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.pm-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e6e6e6;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: pm-spin 0.8s linear infinite;
  flex: 0 0 auto;
}

.pm-content-loading {
  box-sizing: border-box;
  flex: 1 1 auto;
  margin: 2px;
  padding: 5px;
}

.pm-state {
  margin: 2px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

@keyframes pm-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
