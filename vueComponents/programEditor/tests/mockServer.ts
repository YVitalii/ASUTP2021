// vueComponents/programEditor/tests/mockServer.ts
import { vi } from "vitest";
import { settings } from "../settings";
import type { ProcessState, ProgramContent } from "../types";

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

type MockDispatch = (
  url: string,
  body: Record<string, unknown>,
) => { status: number; json: unknown };

let activeDispatch: MockDispatch | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function parseBody(init?: RequestInit) {
  if (!init?.body) return {};
  try {
    return JSON.parse(init.body as string);
  } catch {
    return {};
  }
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.url;
  }
  return String(input);
}

function createDispatch(
  files: Map<string, ProgramContent>,
  processState: ProcessState,
  flags: { failGetFilesList: boolean },
): MockDispatch {
  return (url, body) => {
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
      if (!fileName) {
        return { status: 200, json: { err: programNotFoundErr, data: null } };
      }
      files.set(fileName, clone(program as ProgramContent));
      return {
        status: 200,
        json: {
          err: null,
          data: {
            ua: `Файл ${fileName} збережено!`,
            en: `File ${fileName} was saved!`,
            ru: `Файл ${fileName} сохранен!`,
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
}

/** Підміна usePostJson: той самий контракт, відповіді з фейкового сервера. */
export async function useMockPostJson<T = unknown>(
  url: string = "",
  body: Record<string, unknown> = {},
  _headers: Record<string, string> = {},
  _options: unknown = {},
): Promise<T> {
  if (!activeDispatch) {
    throw new Error("Фейковий сервер не запущено. Викличте setupMockServer().");
  }

  const result = activeDispatch(url, body);
  if (result.status !== 200) {
    throw new Error(`Server returned status ${result.status}`);
  }
  return result.json as T;
}

export function setupMockServer(): {
  files: Map<string, ProgramContent>;
  processState: ProcessState;
  flags: { failGetFilesList: boolean };
  restore: () => void;
} {
  const files = new Map<string, ProgramContent>();
  const processState: ProcessState = {
    runningProgramName: null,
    activeSteps: null,
  };
  const flags = { failGetFilesList: false };
  files.set("prg1", createTypicalProgram());
  files.set(
    "prg2",
    createTypicalProgram({
      id: 2,
      title: "Program 2",
      description: "Програма 2",
    }),
  );
  files.set(
    "prg3",
    createTypicalProgram({
      id: 3,
      title: "Program 3",
      description: "Програма 3",
    }),
  );

  const dispatch = createDispatch(files, processState, flags);
  activeDispatch = dispatch;

  const originalFetch = globalThis.fetch;
  const mockedFetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const result = dispatch(requestUrl(input), parseBody(init));
      return new Response(JSON.stringify(result.json), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    },
  );

  vi.stubGlobal("fetch", mockedFetch);

  return {
    files,
    processState,
    flags,
    restore: () => {
      activeDispatch = null;
      vi.stubGlobal("fetch", originalFetch);
    },
  };
}
