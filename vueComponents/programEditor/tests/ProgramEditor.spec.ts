import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useProgramEditAgent } from "../ProgramEditAgent";
import type { ProgramContent } from "../types";
import { setupMockServer } from "./mockServer";

function cloneContent(content: ProgramContent | null): ProgramContent {
  return JSON.parse(JSON.stringify(content)) as ProgramContent;
}

describe("ProgramEditor (через заглушку сервера)", () => {
  let agent: ReturnType<typeof useProgramEditAgent>;
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    mockServer = setupMockServer();
    agent = useProgramEditAgent();
  });

  afterEach(() => {
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
    expect(agent.state.runningProgramName).toBeNull();
  });

  it("повинен завантажувати список та вміст через loadInitialData", async () => {
    mockServer.processState.runningProgramName = "prg2";

    await agent.loadInitialData();

    expect(agent.state.programList).toEqual(["prg1", "prg2", "prg3"]);
    expect(agent.state.activeProgramName).toBe("prg1");
    expect(agent.state.programContent?.[0].title).toBe("Program 1");
    expect(agent.state.programContent?.[0].description).toBe(
      "Колеса чавунні. Відпуск.",
    );
    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.runningProgramName).toBe("prg2");
    expect(agent.state.isLoading).toBe(false);
  });

  it("не повинен обирати активну програму всередині loadProgramList", async () => {
    await agent.loadProgramList();

    expect(agent.state.programList).toEqual(["prg1", "prg2", "prg3"]);
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
    expect(mockServer.files.get("prg1")?.[0]?.description).toBe(
      "Зміна перед збереженням",
    );
  });

  it("повинен перемикати програму через selectProgram", async () => {
    await agent.loadInitialData();

    const ok = await agent.selectProgram("prg2");

    expect(ok).toBe(true);
    expect(agent.state.activeProgramName).toBe("prg2");
    expect(agent.state.programContent?.[0].title).toBe("Program 2");
    expect(agent.state.programEdited).toBe(false);
  });

  it("не повинен змінювати програму, якщо є незбережені зміни", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Не збережено";
    agent.checkChanges(modifiedContent);

    const ok = await agent.selectProgram("prg2");

    expect(ok).toBe(false);
    expect(agent.state.activeProgramName).toBe("prg1");
    expect(agent.state.programContent?.[0].description).toBe("Не збережено");
    expect(agent.state.lastError).toContain("незбережені зміни");
  });

  it("повинен перезавантажувати поточну програму через handleLoad", async () => {
    await agent.loadInitialData();

    const modifiedContent = cloneContent(agent.state.programContent);
    modifiedContent[0].description = "Локальна зміна";
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    await agent.handleLoad();

    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.programContent?.[0].description).toBe(
      "Колеса чавунні. Відпуск.",
    );
  });

  it("повинен видаляти програму через handleDelete і відкривати наступну", async () => {
    await agent.loadInitialData();

    await agent.handleDelete();

    expect(agent.state.programList).toEqual(["prg2", "prg3"]);
    expect(agent.state.activeProgramName).toBe("prg2");
    expect(agent.state.programContent?.[0].title).toBe("Program 2");
    expect(mockServer.files.has("prg1")).toBe(false);
    expect(agent.state.lastError).toBeNull();
  });

  it("повинен записувати lastError, якщо збереження не вдалося", async () => {
    await agent.loadInitialData();
    agent.state.activeProgramName = "";

    await agent.handleSave();

    expect(agent.state.lastError).toBe("Немає програми для збереження.");
    expect(agent.state.programEdited).toBe(false);
  });

  it("повинен записувати lastError, якщо видалення не вдалося", async () => {
    await agent.loadInitialData();
    agent.state.activeProgramName = "missing";

    await agent.handleDelete();

    expect(agent.state.lastError).toBe("Програму не знайдено!");
    expect(agent.state.programList).toEqual(["prg1", "prg2", "prg3"]);
  });
});
