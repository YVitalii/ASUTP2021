<template>
  <div class="program-manager-panel">
    <div v-if="!state.programContent" class="panel-loading">
      <div class="spinner"></div>
      <p>Завантаження даних програми...</p>
    </div>
    <ProgramManagerTable
      v-else
      :program-data="state.programContent"
      :read-only="false"
      @update:programData="checkChanges"
    />
  </div>
</template>

<script setup lang="ts">
import ProgramManagerTable from "../programManager/component.vue";
import { useProgramEditorContext } from "./editorContext";

const { state, checkChanges } = useProgramEditorContext();
</script>

<style scoped>
.program-manager-panel {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 12px;
  gap: 10px;
  color: #666;
  font-size: 14px;
  width: 100%;
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
</style>
