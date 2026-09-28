import { reactive } from "vue";
import {
  deleteProgram,
  getProgramList,
  getRunningProgramName,
  readProgram,
  writeProgram,
} from "./programsApi";
import { fromSnapshot, isDirty, toSnapshot } from "./programSnapshot";
import { trace, traceError, traceWarn } from "./trace";
import type { ProgramContent, ProgramEditorState } from "./types";

const UNSAVED_CHANGES_MSG =
  "Є незбережені зміни. Збережіть або скиньте їх перед зміною програми.";

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useProgramEditAgent() {
  const state = reactive<ProgramEditorState>({
    activeProgramName: "",
    programEdited: false,
    programList: null,
    programContent: null,
    runningProgramName: null,
    originalJson: "",
    isLoading: false,
    isSaving: false,
    lastError: null,
  });

  const markClean = (content: ProgramContent | null = state.programContent) => {
    state.originalJson = toSnapshot(content);
    state.programEdited = false;
  };

  const checkChanges = (updatedData: ProgramContent) => {
    state.programContent = updatedData;
    state.programEdited = isDirty(state.programContent, state.originalJson);
    trace(
      "checkChanges",
      state.programEdited
        ? "Виявлено зміни! programEdited = true"
        : "Змін немає. programEdited = false",
    );
  };

  const loadProgramList = async () => {
    trace("loadProgramList", "Запит списку програм...");
    try {
      state.programList = await getProgramList();
      trace("loadProgramList", "Список програм успішно завантажено:", state.programList);
    } catch (error) {
      traceWarn("loadProgramList", "Не вдалося завантажити список програм.", error);
      throw error;
    }
  };

  const loadRunningProgram = async () => {
    try {
      state.runningProgramName = await getRunningProgramName();
    } catch (error) {
      traceWarn("loadRunningProgram", "Не вдалося завантажити runningProgramName.", error);
      state.runningProgramName = null;
    }
  };

  const loadProgramContent = async (programName: string) => {
    trace("loadProgramContent", `Завантаження вмісту для програми: ${programName}`);
    try {
      state.programContent = await readProgram(programName);
    } catch (error) {
      traceWarn("loadProgramContent", `Помилка читання програми ${programName}.`, error);
      throw error;
    }

    markClean();
    trace("loadProgramContent", `Вміст програми ${programName} оновлено.`);
  };

  const loadInitialData = async () => {
    trace("loadInitialData", "Початок ініціалізації редактора...");
    state.isLoading = true;
    state.lastError = null;

    try {
      await Promise.all([loadProgramList(), loadRunningProgram()]);

      if (!state.activeProgramName && state.programList && state.programList.length > 0) {
        state.activeProgramName = state.programList[0] ?? "";
      }

      if (state.activeProgramName) {
        await loadProgramContent(state.activeProgramName);
      }

      trace("loadInitialData", "Ініціалізація завершена.");
    } catch (error) {
      state.lastError = errorText(error, "Не вдалося завантажити дані редактора.");
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const handleSave = async () => {
    trace(
      "handleSave",
      `Збереження програми "${state.activeProgramName}"`,
    );

    if (!state.activeProgramName || !state.programContent) {
      state.lastError = "Немає програми для збереження.";
      return;
    }

    state.isSaving = true;
    state.lastError = null;

    try {
      await writeProgram(state.activeProgramName, state.programContent);
      markClean();
      trace("handleSave", "Програму успішно збережено на сервері!");
    } catch (error) {
      traceError("handleSave", "Помилка під час збереження програми на сервер:", error);
      state.lastError = errorText(
        error,
        "Не вдалося зберегти програму. Перевірте з'єднання з мережею.",
      );
    } finally {
      state.isSaving = false;
    }
  };

  const handleLoad = async () => {
    trace("handleLoad", "Перезавантаження поточних даних...");
    if (!state.activeProgramName) return;

    state.lastError = null;
    try {
      await loadProgramContent(state.activeProgramName);
    } catch (error) {
      state.lastError = errorText(error, "Не вдалося завантажити програму.");
    }
  };

  const handleDelete = async () => {
    if (!state.activeProgramName || !state.programList) return;

    const deletedName = state.activeProgramName;
    trace("handleDelete", `Видалення програми: ${deletedName}`);
    state.lastError = null;

    try {
      await deleteProgram(deletedName);
      state.programList = state.programList.filter((name) => name !== deletedName);

      if (state.programList.length > 0) {
        state.activeProgramName = state.programList[0] ?? "";
        await loadProgramContent(state.activeProgramName);
      } else {
        state.programContent = null;
        state.activeProgramName = "";
        markClean(null);
      }

      trace("handleDelete", "Програму успішно видалено.");
    } catch (error) {
      traceError("handleDelete", "Помилка під час видалення програми:", error);
      state.lastError = errorText(
        error,
        "Не вдалося видалити програму через помилку мережі.",
      );
    }
  };

  const handleReset = () => {
    trace("handleReset", "Скидання змін до початкового стану.");
    state.programContent = fromSnapshot(state.originalJson);
    state.programEdited = false;
    state.lastError = null;
  };

  const selectProgram = async (name: string): Promise<boolean> => {
    trace("selectProgram", `Вибрано програму в списку: ${name}`);

    if (name === state.activeProgramName) return true;

    if (state.programEdited) {
      state.lastError = UNSAVED_CHANGES_MSG;
      return false;
    }

    state.lastError = null;
    state.activeProgramName = name;

    try {
      await loadProgramContent(name);
      return true;
    } catch (error) {
      state.lastError = errorText(error, "Не вдалося відкрити програму.");
      return false;
    }
  };

  return {
    state,
    loadProgramList,
    loadProgramContent,
    loadInitialData,
    checkChanges,
    handleSave,
    handleLoad,
    handleDelete,
    handleReset,
    selectProgram,
  };
}
