import { usePostJson } from "../composables/usePostJson";
import { apiUrl, settings } from "./settings";
import type {
  ApiEnvelope,
  LocalizedMessage,
  ProcessState,
  ProgramContent,
  ProgramHeader,
  ProgramStep,
  TaskTypeHeader,
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

function contentForPost(content: ProgramContent): ProgramContent {
  const header = content[0] as ProgramContent[0] & { title?: string };
  if (!("title" in header)) return content;
  const { title, ...rest } = header;
  const headerForPost: ProgramHeader = {
    ...rest,
    fName: rest.fName || title || "",
  };
  const steps = content.slice(1) as ProgramStep[];
  return [headerForPost, ...steps];
}

function assertNoError(
  response: ApiEnvelope<unknown> | undefined,
  fallback: string,
) {
  if (response?.err) {
    throw new Error(errorMessage(response.err, fallback));
  }
}

export function sortProgramNames(names: string[]): string[] {
  return [...names].sort((a, b) =>
    a.localeCompare(b, "uk", { numeric: true }),
  );
}

export async function getProgramList(): Promise<string[]> {
  const response = await usePostJson<ApiEnvelope<string[]>>(
    apiUrl(settings.URLs.getFilesList),
    {},
  );
  const data = unwrapData(response, "getFilesList error");
  if (!Array.isArray(data)) {
    throw new Error("getFilesList: очікувався масив у data");
  }
  return sortProgramNames(data);
}

export async function readProgram(fName: string): Promise<ProgramContent> {
  const response = await usePostJson<ApiEnvelope<ProgramContent>>(
    apiUrl(settings.URLs.readFile),
    { fName },
  );
  return unwrapData(response, "readFile error");
}

export async function writeProgram(
  fName: string,
  content: ProgramContent,
): Promise<void> {
  const response = await usePostJson<ApiEnvelope<LocalizedMessage>>(
    apiUrl(settings.URLs.writeFile),
    { fName, content: contentForPost(content) },
    {},
    { timeout: 10000, maxErrors: 3 },
  );
  assertNoError(response, "writeFile error");
}

export async function activated(fName: string): Promise<string> {
  const response = await usePostJson<
    ApiEnvelope<{ fName?: string }> & {
      error?: LocalizedMessage | string | null;
    }
  >(apiUrl(settings.URLs.activate), { fName });

  const error = response?.error ?? response?.err;
  const activatedName = response?.data?.fName;
  if (error || typeof activatedName !== "string") {
    throw new Error(errorMessage(error, "acceptFile error"));
  }
  return activatedName;
}

export async function deleteProgram(fName: string): Promise<void> {
  const response = await usePostJson<ApiEnvelope<LocalizedMessage>>(
    apiUrl(settings.URLs.deleteFile),
    { fName },
  );
  assertNoError(response, "deleteFile error");
}

export async function getTasksDescription(): Promise<
  Record<string, TaskTypeHeader>
> {
  const response = await usePostJson<
    ApiEnvelope<Record<string, TaskTypeHeader>>
  >(apiUrl(settings.URLs.getTasksDescription), {});
  const data = unwrapData(response, "getTasksDescription error");
  if (data == null || Array.isArray(data) || typeof data !== "object") {
    throw new Error("getTasksDescription: очікувався об'єкт у data");
  }
  return data;
}

export async function getProcessState(): Promise<ProcessState> {
  const response = await usePostJson<ApiEnvelope<ProcessState>>(
    apiUrl(settings.URLs.getProcessState),
    {},
  );
  const data = unwrapData(response, "getProcessState error");
  return {
    acceptedProgram: data.acceptedProgram ?? null,
    programRunning: Boolean(data.programRunning),
  };
}
