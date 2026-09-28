<template>
  <div class="base-grid">
    <div class="editor-page-header">
      <h2>{{ settings.header }}</h2>
      <span v-if="state.programEdited" class="edited-badge">⚠️ Є зміни</span>
    </div>

    <div v-if="showSpinner" class="global-loading-container">
      <div class="spinner"></div>
      <p>Завантаження списку програм...</p>
    </div>

    <div v-else-if="loadFailed" class="error-banner load-error">
      {{ state.lastError }}
    </div>

    <template v-else>
      <div v-if="state.lastError" class="error-banner">{{ state.lastError }}</div>

      <div class="panels">
        <section class="panel panel-list">
          <ProgramEditor />
        </section>
        <section class="panel panel-manager">
          <ProgramManager />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from "vue";
import { useProgramEditAgent } from "./ProgramEditAgent";
import { programEditorContextKey } from "./editorContext";
import { settings } from "./settings";
import ProgramEditor from "./ProgramEditor.vue";
import ProgramManager from "./ProgramManager.vue";

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

onMounted(() => {
  void loadInitialData().catch(() => undefined);
});
</script>

<style scoped>
.base-grid {
  box-sizing: border-box;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background-color: #f4f6f8;
  border-radius: 8px;
  min-height: 250px;
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

.global-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 12px;
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

.panels {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.panel {
  box-sizing: border-box;
  width: 95%;
  background: #ffffff;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #dcdcdc;
}

@media (min-width: 900px) {
  .panels {
    flex-direction: row;
    align-items: flex-start;
  }

  .panel-list {
    width: 240px;
    flex: 0 0 240px;
  }

  .panel-manager {
    width: auto;
    flex: 1 1 auto;
    min-width: 0;
    padding: 12px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow-x: auto;
  }
}
</style>
