<template>
  <div class="program-editor-panel">
    <div class="action-buttons">
      <BtnSave :disabled="!state.programEdited || state.isSaving" @click="handleSave" />

      <button class="btn activate-btn" :disabled="acceptDisabled" @click="handleAccept">Активувати</button>
      <button class="btn delete-btn" @click="handleDelete">Видалити</button>
      <button class="btn reset-btn" @click="handleReset">Скинути</button>
    </div>

    <div class="program-selector-wrapper">
      <label class="selector-label">Вибір програми:</label>

      <select class="program-select-dropdown" :value="state.activeProgramName" @change="onProgramSelect">
        <option v-for="progName in state.programList" :key="progName" :value="progName">
          {{ progName }}
        </option>
      </select>

      <div class="program-list-box">
        <div v-for="progName in state.programList" :key="progName"
          :class="['program-list-item', {
            'active': progName === state.activeProgramName,
            'accepted': progName === state.acceptedProgram && !state.programRunning,
            'running': progName === state.acceptedProgram && state.programRunning,
          }]"
          @click="selectProgram(progName)">
          <span class="prog-title">{{ progName }}</span>
          <span v-if="progName === state.acceptedProgram && !state.programRunning" class="accepted-badge">
            Завантажено
          </span>
          <span v-if="progName === state.acceptedProgram && state.programRunning" class="running-badge">
            Виконується
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BtnSave from "./BtnSave.vue";
import { useProgramEditorContext } from "./editorContext";

const { state, handleSave, handleAccept, handleDelete, handleReset, selectProgram } =
  useProgramEditorContext();

const acceptDisabled = computed(
  () =>
    state.acceptedProgram === state.activeProgramName ||
    state.programEdited ||
    state.programRunning,
);

const onProgramSelect = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const requestedName = target.value;
  const ok = await selectProgram(requestedName);
  if (!ok) {
    target.value = state.activeProgramName;
  }
};
</script>

<style scoped>
.program-editor-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #fff;
  transition: background-color 0.2s;
  text-align: center;
}

.activate-btn {
  background-color: #2980b9;
}

.activate-btn:hover:not(:disabled) {
  background-color: #2471a3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #e74c3c;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.reset-btn {
  background-color: #7f8c8d;
}

.reset-btn:hover {
  background-color: #626567;
}

.program-selector-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selector-label {
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.program-select-dropdown {
  padding: 6px;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  width: 100%;
  box-sizing: border-box;
}

.program-list-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px;
  background: #fafafa;
}

.program-list-item {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.program-list-item:hover {
  background: #f0f4f8;
  border-color: #d0d7de;
}

.program-list-item.active {
  background: #e3fcef;
  border-color: #42b883;
}

.program-list-item.accepted {
  background: #e8f1fd;
  border-color: #2980b9;
}

.program-list-item.running {
  background: #e3fcef;
  border-color: #27ae60;
}

.prog-title {
  font-weight: bold;
  font-size: 13px;
  color: #2c3e50;
}

.accepted-badge {
  font-size: 10px;
  color: #2980b9;
  font-weight: bold;
}

.running-badge {
  font-size: 10px;
  color: #27ae60;
  font-weight: bold;
}

@media (max-width: 899px) {
  .program-select-dropdown {
    display: block;
  }

  .program-list-box {
    display: none;
  }
}

@media (min-width: 900px) {
  .program-select-dropdown {
    display: none;
  }

  .program-list-box {
    display: flex;
  }
}
</style>
