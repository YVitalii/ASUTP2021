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
    <PM_Process_Content>
      <div v-if="loading" class="pm-loading" role="status">
        <span class="pm-spinner" />
        <span>Завантаження…</span>
      </div>
      <pre v-else class="pm-state">{{ stateText }}</pre>
    </PM_Process_Content>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { usePostJson } from "../../../vueComponents/composables/usePostJson";
import PM_Process_Content from "./PM_Process_Content.vue";
import { settings } from "./settings.js";

const props = withDefaults(
  defineProps<{
    /** Стан програми: waiting, going, error, finished, stoped. */
    stateId?: string;
  }>(),
  { stateId: "waiting" },
);

type LocalizedMessage = { ua?: string; en?: string; ru?: string };

type ProgramState = {
  header?: string | LocalizedMessage;
  comment?: string | LocalizedMessage;
  startTime?: string | null;
  duration?: string;
  _id?: string;
};

type StateResponse = {
  err: LocalizedMessage | null;
  data: { content: ProgramState } | null;
};

const emit = defineEmits<{
  loaded: [program: ProgramState];
  "update:stateId": [id: string];
}>();

const stateIds = Object.keys(settings.states);

const loading = ref(true);
const stateText = ref("");
const activeId = ref(props.stateId);

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

onMounted(async () => {
  try {
    const response = await usePostJson<StateResponse>(processStateUrl(), {});
    if (response?.err || response?.data?.content == null) {
      stateText.value = errorText(response?.err);
      return;
    }
    const content = response.data.content;
    stateText.value = JSON.stringify(content, null, 2);
    if (content._id) activeId.value = content._id;
    emit("loaded", content);
  } catch (error) {
    stateText.value =
      error instanceof Error ? error.message : "Немає зв'язку з сервером";
  } finally {
    loading.value = false;
  }
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

.pm-state {
  margin: 0;
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
