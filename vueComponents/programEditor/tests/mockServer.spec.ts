import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePostJson } from "../../composables/usePostJson";
import { settings } from "../settings";
import {
  createTypicalProgram,
  programNotFoundErr,
  setupMockServer,
} from "./mockServer";

describe("MockServer (settings.URLs)", () => {
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    mockServer = setupMockServer();
  });

  afterEach(() => {
    settings.develop = true;
    mockServer.restore();
  });

  it("POST getFilesList body={} повертає список програм користувача", async () => {
    const response = await usePostJson(settings.URLs.getFilesList, {});

    expect(response.err).toBeNull();
    expect(response.data).toEqual(["Program 1", "Program 2", "Program 3"]);
  });

  it("POST readFile {fileName} повертає типову структуру програми", async () => {
    const response = await usePostJson(settings.URLs.readFile, {
      fileName: "Program 1",
    });

    expect(response.err).toBeNull();
    expect(response.data).toEqual(createTypicalProgram());
    expect(response.data[0].maxStepsQuantity).toBe(15);
    expect(response.data[0].regs.tT.units).toBe("°C");
    expect(response.data[1]).toEqual({ tT: 100, H: "00:10", Y: "00:20" });
    expect(response.data[3]).toEqual({ tT: 300, H: 50, Y: 70 });
  });

  it("POST readFile для неіснуючого fileName повертає помилку", async () => {
    const response = await usePostJson(settings.URLs.readFile, {
      fileName: "missing",
    });

    expect(response.err).toEqual(programNotFoundErr);
    expect(response.data).toBeNull();
  });

  it("POST writeFile оновлює існуючу програму", async () => {
    const updated = createTypicalProgram({
      description: "Оновлений опис",
    });

    const writeResponse = await usePostJson(settings.URLs.writeFile, {
      fileName: "Program 1",
      content: updated,
    });
    expect(writeResponse.err).toBeNull();

    const readResponse = await usePostJson(settings.URLs.readFile, {
      fileName: "Program 1",
    });
    expect(readResponse.data[0].description).toBe("Оновлений опис");
  });

  it("POST writeFile створює нову програму, якщо fileName не існує", async () => {
    const created = createTypicalProgram({
      id: 4,
      title: "Program 4",
      description: "Нова програма",
    });

    await usePostJson(settings.URLs.writeFile, {
      content: created,
    });

    const list = await usePostJson(settings.URLs.getFilesList, {});
    expect(list.data).toContain("Program 4");

    const readResponse = await usePostJson(settings.URLs.readFile, {
      fileName: "Program 4",
    });
    expect(readResponse.data[0].title).toBe("Program 4");
  });

  it("POST writeFile створює програму з title, якщо його немає в списку", async () => {
    const created = createTypicalProgram({
      title: "Нова програма",
      description: "Опис нової",
    });

    const writeResponse = await usePostJson(settings.URLs.writeFile, {
      fileName: "Program 1",
      content: created,
    });
    expect(writeResponse.err).toBeNull();

    const list = await usePostJson(settings.URLs.getFilesList, {});
    expect(list.data).toContain("Нова програма");
    expect(list.data).toContain("Program 1");

    const previous = await usePostJson(settings.URLs.readFile, {
      fileName: "Program 1",
    });
    expect(previous.data[0].title).toBe("Program 1");
    expect(previous.data[0].description).toBe("Колеса чавунні. Відпуск.");

    const readResponse = await usePostJson(settings.URLs.readFile, {
      fileName: "Нова програма",
    });
    expect(readResponse.data[0].title).toBe("Нова програма");
    expect(readResponse.data[0].description).toBe("Опис нової");
  });

  it("POST deleteFile видаляє існуючу програму", async () => {
    const deleteResponse = await usePostJson(settings.URLs.deleteFile, {
      fileName: "Program 2",
    });
    expect(deleteResponse.err).toBeNull();

    const list = await usePostJson(settings.URLs.getFilesList, {});
    expect(list.data).toEqual(["Program 1", "Program 3"]);
  });

  it("POST deleteFile для неіснуючого fileName повертає помилку", async () => {
    const response = await usePostJson(settings.URLs.deleteFile, {
      fileName: "missing",
    });

    expect(response.err).toEqual(programNotFoundErr);
    expect(response.err.ua).toBe("Програму не знайдено!");
    expect(response.data).toBeNull();
  });

  it("develop=true бере дані з mockServer і не викликає fetch", async () => {
    settings.develop = true;
    const fetchMock = globalThis.fetch as ReturnType<typeof import("vitest").vi.fn>;

    const response = await usePostJson(settings.URLs.getFilesList, {});

    expect(response.data).toEqual(["Program 1", "Program 2", "Program 3"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("develop=false читає відповідь через fetch", async () => {
    settings.develop = false;
    const fetchMock = globalThis.fetch as ReturnType<typeof import("vitest").vi.fn>;

    const response = await usePostJson(settings.URLs.readFile, {
      fileName: "Program 1",
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(response.data[0].title).toBe("Program 1");
  });

  it("POST activate встановлює програму за title", async () => {
    const response = await usePostJson(settings.URLs.activate, {
      fileName: "Program 2",
    });

    expect(response.error).toBeNull();
    expect(response.data).toEqual({ fileName: "Program 2" });
    expect(mockServer.activation.fileName).toBe("Program 2");
  });

  it("POST getProcessState повертає acceptedProgram і programRunning", async () => {
    const response = await usePostJson(settings.URLs.getProcessState, {});

    expect(response.err).toBeNull();
    expect(response.data).toEqual({ acceptedProgram: "Program 2", programRunning: false });
  });

  it("POST activate змінює acceptedProgram у стані процесу", async () => {
    await usePostJson(settings.URLs.activate, { fileName: "Program 2" });
    const response = await usePostJson(settings.URLs.getProcessState, {});

    expect(response.data).toEqual({
      acceptedProgram: "Program 2",
      programRunning: false,
    });
  });
});
