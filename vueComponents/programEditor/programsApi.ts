import { usePostJson } from "../composables/usePostJson";
import { settings } from "./settings";
import type {
  ApiEnvelope,
  LocalizedMessage,
  ProcessState,
  ProgramContent,
} from "./types";

function errorMessage(
  err: LocalizedMessage | string | null | undefined,
  fallback: string,
) {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err.ua || err.en || err.ru || fallback;
}

function unwrapData<T>(
  response: ApiEnvelope<T> | undefined,
  fallback: string,
): T {
  if (response?.err) {
    throw new Error(errorMessage(response.err, fallback));
  }
  if (response?.data == null) {
    throw new Error(fallback);
  }
  return response.data;
}

function assertNoError(
  response: ApiEnvelope<unknown> | undefined,
  fallback: string,
) {
  if (response?.err) {
    throw new Error(errorMessage(response.err, fallback));
  }
}

export async function getProgramList(): Promise<string[]> {
  const response = await usePostJson<ApiEnvelope<string[]>>(
    settings.URLs.getFilesList,
    {},
  );
  const data = unwrapData(response, "getFilesList error");
  if (!Array.isArray(data)) {
    throw new Error("getFilesList: очікувався масив у data");
  }
  return data;
}

export async function readProgram(fileName: string): Promise<ProgramContent> {
  const response = await usePostJson<ApiEnvelope<ProgramContent>>(
    settings.URLs.readFile,
    { fileName },
  );
  return unwrapData(response, "readFile error");
}

export async function writeProgram(
  fileName: string,
  content: ProgramContent,
): Promise<void> {
  const response = await usePostJson<ApiEnvelope<LocalizedMessage>>(
    settings.URLs.writeFile,
    { fileName, content },
    {},
    { timeout: 10000, maxErrors: 3 },
  );
  assertNoError(response, "writeFile error");
}

export async function activated(fileName: string): Promise<string> {
  const response = await usePostJson<
    ApiEnvelope<{ fileName?: string }> & {
      error?: LocalizedMessage | string | null;
    }
  >(settings.URLs.activate, { fileName });

  const error = response?.error ?? response?.err;
  const activatedName = response?.data?.fileName;
  if (error || typeof activatedName !== "string") {
    throw new Error(errorMessage(error, "acceptFile error"));
  }
  return activatedName;
}

export async function deleteProgram(fileName: string): Promise<void> {
  const response = await usePostJson<ApiEnvelope<LocalizedMessage>>(
    settings.URLs.deleteFile,
    { fileName },
  );
  assertNoError(response, "deleteFile error");
}

export async function getProcessState(): Promise<ProcessState> {
  const response = await usePostJson<ApiEnvelope<ProcessState>>(
    settings.URLs.getProcessState,
    {},
  );
  const data = unwrapData(response, "getProcessState error");
  return {
    acceptedProgram: data.acceptedProgram ?? null,
    programRunning: Boolean(data.programRunning),
  };
}
