import { settings } from "./settings";
import type { ProcessState, ProgramContent } from "./types";

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
  header: Record<string, unknown> = {},
): ProgramContent {
  return [
    {
      id: 1,
      title: "Program 1",
      description: "Колеса чавунні. Відпуск.",
      date: "2023-05-03T11:04:49.715Z",
      maxStepsQuantity: 15,
      regs: typicalRegs,
      ...header,
    },
    { tT: 100, H: "00:10", Y: "00:20" },
    { tT: 200, H: "00:30", Y: "00:40" },
    { tT: 300, H: 50, Y: 70 },
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
    runningProgramName: null,
    activeSteps: null,
  };
  const flags = { failGetFilesList: false };
  const activation = { fileName: null as string | null };

  const storeProgram = (header: Record<string, unknown> = {}) => {
    const program = createTypicalProgram(header);
    files.set(program[0].title, program);
  };
  storeProgram();
  storeProgram({
    id: 2,
    title: "Program 2",
    description: "Програма 2",
  });
  storeProgram({
    id: 3,
    title: "Program 3",
    description: "Програма 3",
  });

  const handle = (url: string, body: Record<string, unknown>): MockResponse => {
    const fileName = body.fileName as string | undefined;
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
      const title = typeof stored?.[0]?.title === "string" ? stored[0].title.trim() : "";
      if (!stored || !title) {
        return { status: 200, json: { err: programNotFoundErr, data: null } };
      }

      files.set(title, clone(stored));

      return {
        status: 200,
        json: {
          err: null,
          data: {
            ua: `Файл ${title} збережено!`,
            en: `File ${title} was saved!`,
            ru: `Файл ${title} сохранен!`,
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
      return {
        status: 200,
        json: { error: null, data: { fileName } },
      };
    }

    if (url.includes(settings.URLs.runningProgramName)) {
      return { status: 200, json: processState };
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
