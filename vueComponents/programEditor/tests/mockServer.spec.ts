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
    mockServer.restore();
  });

  it("POST getFilesList body={} повертає список програм користувача", async () => {
    const response = await usePostJson(settings.URLs.getFilesList, {});

    expect(response.err).toBeNull();
    expect(response.data).toEqual(["prg1", "prg2", "prg3"]);
  });

  it("POST readFile {fileName} повертає типову структуру програми", async () => {
    const response = await usePostJson(settings.URLs.readFile, {
      fileName: "prg1",
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
      fileName: "prg1",
      content: updated,
    });
    expect(writeResponse.err).toBeNull();

    const readResponse = await usePostJson(settings.URLs.readFile, {
      fileName: "prg1",
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
      fileName: "prg4",
      content: created,
    });

    const list = await usePostJson(settings.URLs.getFilesList, {});
    expect(list.data).toContain("prg4");

    const readResponse = await usePostJson(settings.URLs.readFile, {
      fileName: "prg4",
    });
    expect(readResponse.data[0].title).toBe("Program 4");
  });

  it("POST deleteFile видаляє існуючу програму", async () => {
    const deleteResponse = await usePostJson(settings.URLs.deleteFile, {
      fileName: "prg2",
    });
    expect(deleteResponse.err).toBeNull();

    const list = await usePostJson(settings.URLs.getFilesList, {});
    expect(list.data).toEqual(["prg1", "prg3"]);
  });

  it("POST deleteFile для неіснуючого fileName повертає помилку", async () => {
    const response = await usePostJson(settings.URLs.deleteFile, {
      fileName: "missing",
    });

    expect(response.err).toEqual(programNotFoundErr);
    expect(response.err.ua).toBe("Програму не знайдено!");
    expect(response.data).toBeNull();
  });

  it("POST runningProgramName повертає стан процесу", async () => {
    const response = await usePostJson(settings.URLs.runningProgramName, {});

    expect(response.runningProgramName).toBeNull();
    expect(response.activeSteps).toBeNull();
  });
});
