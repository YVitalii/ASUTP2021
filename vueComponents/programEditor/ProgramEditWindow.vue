<template>
  <div class="program-edit-window-host" :style="hostStyle">
    <div class="editor-page-header">
      <h2>{{ settings.header }}</h2>
      <span v-if="state.programEdited" class="edited-badge">⚠️ Є зміни</span>
    </div>

    <div v-if="state.lastError" class="error-banner" :class="{ 'load-error': loadFailed }">
      {{ state.lastError }}
    </div>

    <div
      class="program-edit-window"
      :class="{ wide: isWide }"
      :style="rootStyle"
    >
      <section class="control-area" aria-label="ControlArea" :style="controlStyle">
        <div v-if="showSpinner" class="area-loading">
          <div class="spinner"></div>
          <p>Завантаження списку програм...</p>
        </div>
        <ProgramEditor v-else />
      </section>
      <section class="content-area" aria-label="ContentArea" :style="contentStyle">
        <ProgramManager v-if="!loadFailed" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from "vue";
import { useProgramEditAgent } from "./ProgramEditAgent";
import { programEditorContextKey } from "./editorContext";
import ProgramEditor from "./ProgramEditor.vue";
import ProgramManager from "./ProgramManager.vue";
import { settings } from "./settings";

const agent = useProgramEditAgent();
const { state, loadInitialData } = agent;

provide(programEditorContextKey, {
  ...agent,
  settings,
});

const showSpinner = computed(
  () => state.isLoading || (state.programList === null && !state.lastError),
);

const loadFailed = computed(
  () => state.programList === null && Boolean(state.lastError),
);

const isWide = ref(false);

const hostStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const rootStyle = computed(() => ({
  width: "100%",
  flexGrow: "1",
  flexShrink: "1",
  flexBasis: "auto",
  minHeight: "0",
  display: "flex",
  flexDirection: isWide.value ? "row" : "column",
  "--control-area-width": `${settings.minControlAreaWidth}px`,
}));

const controlStyle = computed(() =>
  isWide.value
    ? {
        width: `${settings.minControlAreaWidth}px`,
        flexBasis: `${settings.minControlAreaWidth}px`,
        flexGrow: "0",
        flexShrink: "0",
      }
    : {
        width: "100%",
      },
);

const contentStyle = computed(() => ({
  flex: "1 1 auto",
  width: isWide.value ? "auto" : "100%",
}));

function syncLayout() {
  isWide.value = window.innerWidth >= settings.minScreenWidth;
}

syncLayout();

onMounted(() => {
  syncLayout();
  window.addEventListener("resize", syncLayout);
  void loadInitialData().catch(() => undefined);
});

onUnmounted(() => {
  window.removeEventListener("resize", syncLayout);
});
</script>

<style scoped>
.program-edit-window-host {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 2px solid #3498db;
}

.editor-page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.edited-badge {
  background-color: #e67e22;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.error-banner {
  background-color: #fdecea;
  color: #c0392b;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.area-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 8px;
  color: #666;
  font-size: 14px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.program-edit-window {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.control-area,
.content-area {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.content-area {
  flex: 1 1 auto;
}

.program-edit-window.wide {
  flex-direction: row;
}

.program-edit-window.wide .control-area {
  width: var(--control-area-width);
  flex: 0 0 var(--control-area-width);
  height: 100%;
}

.program-edit-window.wide .content-area {
  width: auto;
  flex: 1 1 auto;
  height: 100%;
}
</style>
