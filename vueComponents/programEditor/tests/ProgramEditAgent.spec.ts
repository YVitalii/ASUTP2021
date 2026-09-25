// src/ProgramEditor/ProgramEditorAgent.spec.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useProgramEditAgent } from "../ProgramEditAgent";
import { setupMockServer } from "./mockServer";

describe("ProgramEditAgent (з інтегрованим mockServer)", () => {
  let agent: ReturnType<typeof useProgramEditAgent>;
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    // Запускаємо фейковий сервер перед кожним тестом
    mockServer = setupMockServer();
    // Створюємо новий екземпляр агента
    agent = useProgramEditAgent();
  });

  afterEach(() => {
    // Очищаємо (деактивуємо) фейковий сервер після кожного тесту
    mockServer.restore();
  });

  it("повинен ініціалізувати початковий стан порожнім або null", () => {
    expect(agent.state.activeProgramName).toBe("");
    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.programList).toBeNull();
    expect(agent.state.programContent).toBeNull();
  });

  it("повинен успішно завантажувати список та вміст через loadInitialData та mockServer", async () => {
    // Викликаємо асинхронну ініціалізацію, яка звернеться до мок-сервера
    await agent.loadInitialData();

    expect(agent.state.programList).toEqual(["prg1", "prg2", "prg3"]);
    expect(agent.state.activeProgramName).toBe("prg1");
    expect(agent.state.programContent).not.toBeNull();
    expect(agent.state.programContent[0].title).toBe("prg1");
    expect(agent.state.programEdited).toBe(false);
  });

  it("повинен визначати зміни, коли дані відрізняються від еталона", async () => {
    await agent.loadInitialData();

    // Змінюємо опис програми в контенті
    const modifiedContent = JSON.parse(
      JSON.stringify(agent.state.programContent),
    );
    modifiedContent[0].description = "Змінений опис для тесту";

    agent.checkChanges(modifiedContent);

    expect(agent.state.programEdited).toBe(true);
  });

  it("повинен скидати прапорець змін, якщо дані повернулися до початкового стану", async () => {
    await agent.loadInitialData();

    const originalContent = JSON.parse(
      JSON.stringify(agent.state.programContent),
    );
    const modifiedContent = JSON.parse(
      JSON.stringify(agent.state.programContent),
    );
    modifiedContent[0].description = "Тимчасова зміна";

    // Робимо зміну
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    // Повертаємо оригінальні дані назад
    agent.checkChanges(originalContent);
    expect(agent.state.programEdited).toBe(false);
  });

  it("повинен скидати зміни до оригінального сліпка при виклику handleReset", async () => {
    await agent.loadInitialData();

    const modifiedContent = JSON.parse(
      JSON.stringify(agent.state.programContent),
    );
    modifiedContent[0].description = "Нова зміна перед скиданням";
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    // Викликаємо скидання
    agent.handleReset();

    expect(agent.state.programEdited).toBe(false);
    expect(agent.state.programContent[0].description).toContain(
      "Фейковий опис для prg1",
    );
  });

  it("повинен успішно виконувати асинхронне збереження handleSave через mockServer", async () => {
    await agent.loadInitialData();

    // Вносимо зміни
    const modifiedContent = JSON.parse(
      JSON.stringify(agent.state.programContent),
    );
    modifiedContent[0].description = "Зміна перед збереженням";
    agent.checkChanges(modifiedContent);
    expect(agent.state.programEdited).toBe(true);

    // Викликаємо збереження, яке піде на мок-сервер
    await agent.handleSave();

    // Прапорець редагування має скинутися
    expect(agent.state.programEdited).toBe(false);
  });
});
