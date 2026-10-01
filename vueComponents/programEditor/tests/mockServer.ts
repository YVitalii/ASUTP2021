import { vi } from "vitest";
import {
  activateMockServer,
  createMockServer,
  createTypicalProgram,
  deactivateMockServer,
  ensureMockServer,
  programNotFoundErr,
  type MockServer,
} from "../mockServer";

export { createTypicalProgram, programNotFoundErr };

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

/** Підміна usePostJson у тестах компонента: той самий контракт, дані з активного mockServer. */
export async function useMockPostJson<T = unknown>(
  url: string = "",
  body: Record<string, unknown> = {},
  _headers: Record<string, string> = {},
  _options: unknown = {},
): Promise<T> {
  const result = ensureMockServer().handle(url, body);
  if (result.status !== 200) {
    throw new Error(`Server returned status ${result.status}`);
  }
  return result.json as T;
}

export function setupMockServer(): MockServer & { restore: () => void } {
  const server = createMockServer();
  activateMockServer(server);

  const originalFetch = globalThis.fetch;
  const mockedFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const result = server.handle(requestUrl(input), parseBody(init));
    return new Response(JSON.stringify(result.json), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", mockedFetch);

  return {
    ...server,
    restore: () => {
      deactivateMockServer();
      vi.stubGlobal("fetch", originalFetch);
    },
  };
}
