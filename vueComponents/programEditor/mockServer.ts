import { settings } from "./settings";
import type { ProcessState, ProgramContent, TaskTypeHeader } from "./types";

export const programNotFoundErr = {
  ua: "Програму не знайдено!",
  ru: "Программа не найдена!",
  en: "Program not found!",
};

const typicalRegs = {
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
};

export function createTypicalProgram(
  patch: Partial<ProgramContent[0]> = {},
): ProgramContent {
  return [
    {
      id: 1,
      fName: "Program 1",
      description: "Колеса чавунні. Відпуск.",
      date: "2023-05-03T11:04:49.715Z",
      maxStepsQuantity: 15,
      ...patch,
    },
    { type: "taskThermal", tT: 100, H: "00:10", Y: "00:20" },
    { type: "taskThermal", tT: 200, H: "00:30", Y: "00:40" },
    { type: "taskThermal", tT: 300, H: 50, Y: 70 },
  ];
}

export type MockResponse = { status: number; json: unknown };

export type MockServer = {
  files: Map<string, ProgramContent>;
  processState: ProcessState;
  flags: { failGetFilesList: boolean };
  activation: { fileName: string | null };
  handle: (url: string, body: Record<string, unknown>) => MockResponse;
};

let activeMockServer: MockServer | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function createMockServer(): MockServer {
  const files = new Map<string, ProgramContent>();
  const processState: ProcessState = {
    acceptedProgram: "Program 2",
    programRunning: false,
  };
  const flags = { failGetFilesList: false };
  const activation = { fileName: null as string | null };

  const storeProgram = (patch: Partial<ProgramContent[0]> = {}) => {
    const program = createTypicalProgram(patch);
    files.set(program[0].fName, program);
  };
  storeProgram();
  storeProgram({
    id: 2,
    fName: "Program 2",
    description: "Програма 2",
  });
  storeProgram({
    id: 3,
    fName: "Program 3",
    description: "Програма 3",
  });

  const handle = (url: string, body: Record<string, unknown>): MockResponse => {
    const fileName = body.fName as string | undefined;
    const program = (body.content ?? body.program) as ProgramContent | undefined;

    if (url.includes(settings.URLs.getFilesList)) {
      if (flags.failGetFilesList) {
        return {
          status: 200,
          json: {
            err: { ua: "Не вдалося завантажити список програм." },
            data: null,
          },
        };
      }
      return { status: 200, json: { err: null, data: [...files.keys()] } };
    }

    if (url.includes(settings.URLs.writeFile)) {
      const stored = program ? clone(program) : undefined;
      const fName = typeof stored?.[0]?.fName === "string" ? stored[0].fName.trim() : "";
      if (!stored || !fName) {
        return { status: 200, json: { err: programNotFoundErr, data: null } };
      }
      const raw = stored[0] as ProgramContent[0] & {
        regs?: unknown;
        header?: unknown;
      };
      delete raw.regs;
      delete raw.header;
      raw.fName = fName;

      files.set(fName, clone(stored));

      return {
        status: 200,
        json: {
          err: null,
          data: {
            ua: `Файл ${fName} збережено!`,
            en: `File ${fName} was saved!`,
            ru: `Файл ${fName} сохранен!`,
          },
        },
      };
    }

    if (url.includes(settings.URLs.readFile)) {
      if (!fileName || !files.has(fileName)) {
        return { status: 200, json: { err: programNotFoundErr, data: null } };
      }
      return { status: 200, json: { err: null, data: clone(files.get(fileName)) } };
    }

    if (url.includes(settings.URLs.deleteFile)) {
      if (!fileName || !files.has(fileName)) {
        return { status: 200, json: { err: programNotFoundErr, data: null } };
      }
      files.delete(fileName);
      return {
        status: 200,
        json: {
          err: null,
          data: {
            ua: `Файл ${fileName} видалено!`,
            en: `File ${fileName} was deleted!`,
            ru: `Файл ${fileName} удален !`,
          },
        },
      };
    }

    if (url.includes(settings.URLs.activate)) {
      if (!fileName || !files.has(fileName)) {
        return { status: 200, json: { error: programNotFoundErr, data: null } };
      }
      activation.fileName = fileName;
      processState.acceptedProgram = fileName;
      return {
        status: 200,
        json: { error: null, data: { fName: fileName } },
      };
    }

    if (url.includes(settings.URLs.getTasksDescription)) {
      const data: Record<string, TaskTypeHeader> = {
        description: {
          id: "description",
          header: {
            ua: "Загальний опис програми",
            en: "General descriptiom of program",
            ru: "Общее описание программы",
          },
          comment: { ua: "", en: "", ru: "" },
        },
        taskThermal: {
          id: "taskThermal",
          header: {
            ua: "Термообробка",
            en: "Heat Treatment",
            ru: "Термообработка",
          },
          comment: {
            ua: "Термообробка",
            en: "HeatTreatment",
            ru: "Термообработка",
          },
          regs: typicalRegs,
        },
      };
      return { status: 200, json: { err: null, data } };
    }

    if (url.includes(settings.URLs.getProcessState)) {
      return {
        status: 200,
        json: { err: null, data: { ...processState } },
      };
    }

    return {
      status: 404,
      json: {
        err: {
          ua: "Маршрут не знайдено",
          en: "Not Found",
          ru: "Маршрут не найден",
        },
        data: null,
      },
    };
  };

  return { files, processState, flags, activation, handle };
}

export function activateMockServer(server: MockServer) {
  activeMockServer = server;
}

export function deactivateMockServer() {
  activeMockServer = null;
}

/** Сервер для браузера і тестів. Якщо тестовий ще не увімкнено — створюється типовий. */
export function ensureMockServer(): MockServer {
  if (!activeMockServer) {
    activeMockServer = createMockServer();
  }
  return activeMockServer;
}
