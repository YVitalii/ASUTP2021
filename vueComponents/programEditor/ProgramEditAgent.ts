// src/ProgramEditor/ProgramEditAgent.ts
import { reactive } from "vue";
import { settings } from "./settings";
import { usePostJson } from "../composables/usePostJson";

// Глобальні змінні модуля для трасування
const gLn = "ProgramEditAgent.ts::";
const gTrace = true;

export function useProgramEditAgent() {
  // Головний реактивний стан
  const state = reactive({
    activeProgramName: "",
    programEdited: false,
    programList: null as string[] | null,
    programContent: null as any,
    runningProgramName: null as string | null,
    originalJson: "", // Еталонний сліпок для порівняння змін
  });

  // Оновлення еталонного сліпка даних
  const updateOriginalSnapshot = () => {
    const ln = gLn + "updateOriginalSnapshot::";
    const trace = gTrace || true;

    if (state.programContent) {
      state.originalJson = JSON.stringify(state.programContent);
      if (trace) console.log(ln + "Оновлено еталонний сліпок програми.");
    }
  };

  // Перевірка змін
  const checkChanges = (updatedData: any) => {
    const ln = gLn + "checkChanges::";
    const trace = gTrace || true;

    state.programContent = updatedData;
    const currentJson = JSON.stringify(state.programContent);

    if (currentJson === state.originalJson) {
      state.programEdited = false;
      if (trace) console.log(ln + "Змін немає. programEdited = false");
    } else {
      state.programEdited = true;
      if (trace) console.log(ln + "Виявлено зміни! programEdited = true");
    }
  };

  // 1. Завантаження списку програм через наш захищений usePostJson
  const loadProgramList = async () => {
    const ln = gLn + "loadProgramList::";
    const trace = gTrace || true;

    if (trace) console.log(ln + "Запит списку програм...");

    try {
      // Викликаємо usePostJson із параметрами за замовчуванням (або передаємо дію для сервера)
      const response = await usePostJson(settings.URLs.readFile, {
        action: "getProgramList",
      });

      if (response && response.programList) {
        state.programList = response.programList;
      } else {
        // Демо-дані для розробки, якщо сервер ще не налаштований
        state.programList = ["prg1", "prg2", "prg3"];
      }

      if (
        state.programList &&
        state.programList.length > 0 &&
        !state.activeProgramName
      ) {
        state.activeProgramName = state.programList[0];
      }

      if (trace)
        console.log(
          ln + "Список програм успішно завантажено:",
          state.programList,
        );
    } catch (error) {
      if (trace)
        console.warn(
          ln +
            "Не вдалося завантажити список з мережі, використовуємо демо-дані.",
          error,
        );
      state.programList = ["prg1", "prg2", "prg3"];
      if (!state.activeProgramName)
        state.activeProgramName = state.programList[0];
    }
  };

  // 2. Завантаження вмісту конкретної програми
  const loadProgramContent = async (programName: string) => {
    const ln = gLn + "loadProgramContent::";
    const trace = gTrace || true;

    if (trace)
      console.log(ln + `Завантаження вмісту для програми: ${programName}`);

    try {
      const response = await usePostJson(settings.URLs.readFile, {
        programName,
      });

      if (response && response.programContent) {
        state.programContent = response.programContent;
      } else {
        throw new Error("Пуста відповідь або відсутній programContent");
      }
    } catch (error) {
      if (trace)
        console.warn(
          ln + `Помилка мережі для ${programName}, завантажуємо демо-контент.`,
          error,
        );

      // Демо-дані для розробки
      state.programContent = [
        {
          id: 1,
          title: programName,
          description: `Програма ${programName}. Відпуск чавуну.`,
          date: new Date(),
          maxStepsQuantity: 15,
          regs: {
            tT: {
              title: "tT",
              units: "°C",
              type: "Number",
              min: 0,
              max: 1200,
              comment: "Цільова температура",
            },
            H: {
              title: "H",
              units: "ГГ:ХХ",
              type: "Time",
              min: "00:00",
              max: "99:59",
              comment: "Тривалість нагрівання",
            },
            Y: {
              title: "Y",
              units: "ГГ:ХХ",
              type: "Time",
              min: "00:00",
              max: "99:59",
              comment: "Тривалість витримки",
            },
          },
        },
        { tT: 100, H: "00:10", Y: "00:20" },
        { tT: 200, H: "00:30", Y: "00:40" },
      ];
    }

    updateOriginalSnapshot();
    state.programEdited = false;
    if (trace) console.log(ln + `Вміст програми ${programName} оновлено.`);
  };

  // Загальна ініціалізація
  const loadInitialData = async () => {
    const ln = gLn + "loadInitialData::";
    const trace = gTrace || true;

    if (trace) console.log(ln + "Початок ініціалізації редактора...");

    await loadProgramList();
    if (state.activeProgramName) {
      await loadProgramContent(state.activeProgramName);
    }

    if (trace) console.log(ln + "Ініціалізація завершена.");
  };

  // 3. Збереження програми на сервер
  const handleSave = async () => {
    const ln = gLn + "handleSave::";
    const trace = gTrace || true;

    if (trace)
      console.log(
        ln +
          `Збереження програми "${state.activeProgramName}" на ${settings.URLs.writeFile}`,
      );

    const payload = {
      programName: state.activeProgramName,
      content: state.programContent,
    };

    try {
      // Використовуємо кастомний довший таймаут для збереження (наприклад, 10 секунд)
      await usePostJson(
        settings.URLs.writeFile,
        payload,
        {},
        { timeout: 10000, maxErrors: 3 },
      );

      updateOriginalSnapshot();
      state.programEdited = false;

      if (trace) console.log(ln + "Програму успішно збережено на сервері!");
    } catch (error) {
      if (trace)
        console.error(
          ln + "Помилка під час збереження програми на сервер:",
          error,
        );
      alert("Не вдалося зберегти програму. Перевірте з'єднання з мережею.");
    }
  };

  // 4. Перезавантаження поточного файлу
  const handleLoad = async () => {
    const ln = gLn + "handleLoad::";
    const trace = gTrace || true;

    if (trace) console.log(ln + "Перезавантаження поточних даних...");
    if (state.activeProgramName) {
      await loadProgramContent(state.activeProgramName);
    }
  };

  // 5. Видалення програми через сервер
  const handleDelete = async () => {
    const ln = gLn + "handleDelete::";
    const trace = gTrace || true;

    if (!state.activeProgramName || !state.programList) return;

    if (trace)
      console.log(
        ln +
          `Видалення програми: ${state.activeProgramName} через ${settings.URLs.deleteFile}`,
      );

    try {
      await usePostJson(settings.URLs.deleteFile, {
        programName: state.activeProgramName,
      });

      state.programList = state.programList.filter(
        (name) => name !== state.activeProgramName,
      );

      if (state.programList.length > 0) {
        state.activeProgramName = state.programList[0];
        await loadProgramContent(state.activeProgramName);
      } else {
        state.programContent = null;
        state.activeProgramName = "";
      }
      state.programEdited = false;

      if (trace) console.log(ln + "Програму успішно видалено.");
    } catch (error) {
      if (trace)
        console.error(ln + "Помилка під час видалення програми:", error);
      alert("Не вдалося видалити програму через помилку мережі.");
    }
  };

  const handleReset = () => {
    const ln = gLn + "handleReset::";
    const trace = gTrace || true;

    if (trace) console.log(ln + "Скидання змін до початкового стану.");

    if (state.originalJson) {
      state.programContent = JSON.parse(state.originalJson);
    }
    state.programEdited = false;
  };

  const selectProgram = async (name: string) => {
    const ln = gLn + "selectProgram::";
    const trace = gTrace || true;

    if (trace) console.log(ln + `Вибрано програму в списку: ${name}`);
    state.activeProgramName = name;
    await loadProgramContent(name);
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
