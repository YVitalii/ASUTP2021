import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useProgramEditAgent } from "../ProgramEditAgent";
import type { ProgramContent } from "../types";
import { setupMockServer } from "./mockServer";

function cloneContent(content: ProgramContent | null): ProgramContent {
  return JSON.parse(JSON.stringify(content)) as ProgramContent;
}

describe("ProgramEditAgent (через заглушку сервера)", () => {
  let agent: ReturnType<typeof useProgramEditAgent>;
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    mockServer = setupMockServer();
    agent = useProgramEditAgent();
  });

  afterEach(() => {
    agent.stopProcessPolling();
    vi.useRealTimers();
    mockServer.restore();
  });

  it("повинен ініціалізувати початковий стан порожнім або null", () => {
    expect(agent.state.activeProgramName).toBe("");
    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.programList).toBeNull();
    expect(agent.state.programContent).toBeNull();
    expect(agent.state.isLoading).toBe(false);
    expect(agent.state.isSaving).toBe(false);
    expect(agent.state.lastError).toBeNull();
    expect(agent.state.acceptedProgram).toBeNull();
    expect(agent.state.programRunning).toBe(false);
  });

  it("повинен завантажувати список та вміст через loadInitialData", async () => {
    mockServer.processState.acceptedProgram = "Program 2";

    await agent.loadInitialData();

    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);
    expect(agent.state.activeProgramName).toBe("Program 1");
    expect(agent.state.programContent?.[0].title).toBe("Program 1");
    expect(agent.state.programContent?.[0].description).toBe(
      "Колеса чавунні. Відпуск.",
    );
    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.acceptedProgram).toBe("Program 2");
    expect(agent.state.programRunning).toBe(false);
    expect(agent.state.isLoading).toBe(false);
  });

  it("loadInitialData запитує getProcessState і повторює запит кожні 30 секунд", async () => {
    vi.useFakeTimers();
    mockServer.processState.acceptedProgram = "Program 2";
    mockServer.processState.programRunning = false;

    await agent.loadInitialData();
    expect(agent.state.acceptedProgram).toBe("Program 2");
    expect(agent.state.programRunning).toBe(false);

    mockServer.processState.acceptedProgram = "Program 3";
    mockServer.processState.programRunning = true;

    await vi.advanceTimersByTimeAsync(29_000);
    expect(agent.state.acceptedProgram).toBe("Program 2");
    expect(agent.state.programRunning).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(agent.state.acceptedProgram).toBe("Program 3");
    expect(agent.state.programRunning).toBe(true);
  });

  it("оновлює список програм із getFilesList кожні 30 секунд", async () => {
    vi.useFakeTimers();
    await agent.loadInitialData();
    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);

    mockServer.files.delete("Program 3");
    await vi.advanceTimersByTimeAsync(29_000);
    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(agent.state.programList).toEqual(["Program 1", "Program 2"]);
  });

  it("не повинен обирати активну програму всередині loadProgramList", async () => {
    await agent.loadProgramList();

    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);
    expect(agent.state.activeProgramName).toBe("");
    expect(agent.state.programContent).toBeNull();
  });

  it("повинен визначати зміни, коли дані відрізняються від еталона", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Змінений опис для тесту";

    agent.checkChanges(modifiedContent);

    expect(agent.state.programEdited).toBe(true);
  });

  it("повинен скидати прапорець змін, якщо дані повернулися до початкового стану", async () => {
    await agent.loadInitialData();

    const originalContent = cloneContent(agent.state.programContent);
    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Тимчасова зміна";

    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    agent.checkChanges(originalContent);
    expect(agent.state.programEdited).toBe(false);
  });

  it("повинен скидати зміни до оригінального сліпка при handleReset", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Нова зміна перед скиданням";
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    agent.handleReset();

    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.programContent?.[0].description).toBe(
      "Колеса чавунні. Відпуск.",
    );
    expect(agent.state.lastError).toBeNull();
  });

  it("повинен зберігати програму через writeFile", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Зміна перед збереженням";
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    await agent.handleSave();

    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.lastError).toBeNull();
    expect(mockServer.files.get("Program 1")?.[0]?.description).toBe(
      "Зміна перед збереженням",
    );
  });

  it("повинен перемикати програму через selectProgram", async () => {
    await agent.loadInitialData();

    const ok = await agent.selectProgram("Program 2");

    expect(ok).toBe(true);
    expect(agent.state.activeProgramName).toBe("Program 2");
    expect(agent.state.programContent?.[0].title).toBe("Program 2");
    expect(agent.state.programEdited).toBe(false);
  });

  it("не повинен змінювати програму, якщо є незбережені зміни", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Не збережено";
    agent.checkChanges(modifiedContent);

    const ok = await agent.selectProgram("Program 2");

    expect(ok).toBe(false);
    expect(agent.state.activeProgramName).toBe("Program 1");
    expect(agent.state.programContent?.[0].description).toBe("Не збережено");
    expect(agent.state.lastError).toContain("незбережені зміни");
  });

  it("активує збережену програму через POST /acceptFile", async () => {
    await agent.loadInitialData();

    await agent.handleAccept();

    expect(mockServer.activation.fileName).toBe("Program 1");
    expect(agent.state.acceptedProgram).toBe("Program 1");
    expect(agent.state.programRunning).toBe(false);
    expect(agent.state.lastError).toBeNull();
    expect(agent.state.programContent?.[0].description).toBe(
      "Колеса чавунні. Відпуск.",
    );
  });

  it("не завантажує програму в прилад, поки вона виконується", async () => {
    mockServer.processState.acceptedProgram = "Program 2";
    mockServer.processState.programRunning = true;
    await agent.loadInitialData();

    await agent.handleAccept();

    expect(mockServer.activation.fileName).toBeNull();
    expect(agent.state.acceptedProgram).toBe("Program 2");
    expect(agent.state.programRunning).toBe(true);
  });

  it("не активує програму, поки є незбережені зміни", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Локальна зміна";
    agent.checkChanges(modifiedContent);

    await agent.handleAccept();

    expect(mockServer.activation.fileName).toBeNull();
    expect(agent.state.programEdited).toBe(true);
    expect(agent.state.programContent?.[0].description).toBe("Локальна зміна");
  });

  it("при помилці активації показує alert і не змінює стан", async () => {
    await agent.loadInitialData();
    agent.state.acceptedProgram = "Program 2";
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    if (agent.state.programContent) {
      agent.state.programContent[0].title = "Немає такої";
    }

    await agent.handleAccept();

    expect(alertSpy).toHaveBeenCalledWith("Програму не знайдено!");
    expect(agent.state.acceptedProgram).toBe("Program 2");
    expect(agent.state.programRunning).toBe(false);
    expect(agent.state.lastError).toBeNull();
    expect(agent.state.activeProgramName).toBe("Program 1");
    expect(mockServer.activation.fileName).toBeNull();
    alertSpy.mockRestore();
  });

  it("після підтвердження видаляє програму і перечитує список із сервера", async () => {
    await agent.loadInitialData();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await agent.handleDelete();

    expect(confirmSpy).toHaveBeenCalledWith("Ви точно хочете видалити програму Program 1?");
    expect(agent.state.programList).toEqual(["Program 2", "Program 3"]);
    expect(agent.state.activeProgramName).toBe("Program 2");
    expect(agent.state.programContent?.[0].title).toBe("Program 2");
    expect(mockServer.files.has("Program 1")).toBe(false);
    expect(agent.state.lastError).toBeNull();
    confirmSpy.mockRestore();
  });

  it("не видаляє програму, якщо користувач відмовився", async () => {
    await agent.loadInitialData();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    await agent.handleDelete();

    expect(mockServer.files.has("Program 1")).toBe(true);
    expect(agent.state.activeProgramName).toBe("Program 1");
    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);
    confirmSpy.mockRestore();
  });

  it("не видаляє програму, завантажену в прилад", async () => {
    await agent.loadInitialData();
    agent.state.acceptedProgram = "Program 1";
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await agent.handleDelete();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockServer.files.has("Program 1")).toBe(true);
    confirmSpy.mockRestore();
  });

  it("повинен записувати lastError, якщо збереження не вдалося", async () => {
    await agent.loadInitialData();
    agent.state.activeProgramName = "";

    await agent.handleSave();

    expect(agent.state.lastError).toBe("Немає програми для збереження.");
    expect(agent.state.programEdited).toBe(false);
  });

  it("при помилці видалення показує alert і не змінює список", async () => {
    await agent.loadInitialData();
    agent.state.activeProgramName = "missing";
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    await agent.handleDelete();

    expect(alertSpy).toHaveBeenCalledWith("Програму не знайдено!");
    expect(agent.state.lastError).toBeNull();
    expect(agent.state.programList).toEqual(["Program 1", "Program 2", "Program 3"]);
    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
