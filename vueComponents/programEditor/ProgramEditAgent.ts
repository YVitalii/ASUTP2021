import { getCurrentScope, onScopeDispose, reactive } from "vue";
import {
  activated,
  deleteProgram,
  getProgramList,
  getProcessState,
  readProgram,
  writeProgram,
} from "./programsApi";
import { fromSnapshot, isDirty, toSnapshot } from "./programSnapshot";
import { trace, traceError, traceWarn } from "./trace";
import type { ProgramContent, ProgramEditorState } from "./types";

const UNSAVED_CHANGES_MSG =
  "Є незбережені зміни. Збережіть або скиньте їх перед зміною програми.";
const PROCESS_STATE_POLL_MS = 30_000;

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
    acceptedProgram: null,
    programRunning: false,
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

  let processStatePoll: ReturnType<typeof setInterval> | null = null;

  const loadRunningProgram = async () => {
    try {
      const processState = await getProcessState();
      state.acceptedProgram = processState.acceptedProgram;
      state.programRunning = processState.programRunning;
    } catch (error) {
      traceWarn("loadRunningProgram", "Не вдалося завантажити стан процесу.", error);
    }
  };

  const stopProcessPolling = () => {
    if (processStatePoll == null) return;
    clearInterval(processStatePoll);
    processStatePoll = null;
  };

  const refreshProgramList = async () => {
    try {
      state.programList = await getProgramList();
    } catch (error) {
      traceWarn("refreshProgramList", "Не вдалося оновити список програм.", error);
    }
  };

  const startProcessPolling = () => {
    if (processStatePoll != null) return;
    processStatePoll = setInterval(() => {
      void loadRunningProgram();
      void refreshProgramList();
    }, PROCESS_STATE_POLL_MS);
  };

  if (getCurrentScope()) {
    onScopeDispose(stopProcessPolling);
  }

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
      startProcessPolling();
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
      const previousName = state.activeProgramName;
      const savedTitle = state.programContent[0]?.title;
      await writeProgram(previousName, state.programContent);
      if (savedTitle && savedTitle !== previousName) {
        if (state.programList && !state.programList.includes(savedTitle)) {
          state.programList = [...state.programList, savedTitle];
        }
        state.activeProgramName = savedTitle;
      }
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

  const handleAccept = async () => {
    if (
      state.acceptedProgram === state.activeProgramName ||
      state.programEdited ||
      state.programRunning
    ) {
      return;
    }

    const fileName = state.programContent?.[0]?.title;
    trace("handleAccept", `Завантаження програми "${fileName ?? ""}" у прилад`);

    if (!fileName) {
      alert("Немає програми для активації.");
      return;
    }

    try {
      const acceptedName = await activated(fileName);
      state.acceptedProgram = acceptedName;
      trace("handleAccept", `Програму "${acceptedName}" завантажено в прилад.`);
    } catch (error) {
      const message = errorText(error, "Не вдалося активувати програму.");
      traceError("handleAccept", "Помилка завантаження програми в прилад:", error);
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!state.activeProgramName || state.activeProgramName === state.acceptedProgram) return;

    const deletedName = state.activeProgramName;
    const confirmed = confirm(`Ви точно хочете видалити програму ${deletedName}?`);
    if (!confirmed) return;

    trace("handleDelete", `Видалення програми: ${deletedName}`);

    try {
      await deleteProgram(deletedName);
      state.programList = await getProgramList();

      if (!state.programList.includes(deletedName)) {
        if (state.programList.length > 0) {
          state.activeProgramName = state.programList[0] ?? "";
          await loadProgramContent(state.activeProgramName);
        } else {
          state.programContent = null;
          state.activeProgramName = "";
          markClean(null);
        }
      }

      trace("handleDelete", "Програму успішно видалено.");
    } catch (error) {
      const message = errorText(
        error,
        "Не вдалося видалити програму через помилку мережі.",
      );
      traceError("handleDelete", "Помилка під час видалення програми:", error);
      alert(message);
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
    stopProcessPolling,
    checkChanges,
    handleSave,
    handleAccept,
    handleDelete,
    handleReset,
    selectProgram,
  };
}
