import type { ProgramContent } from "./types";

export function toSnapshot(content: ProgramContent | null): string {
  return content ? JSON.stringify(content) : "";
}

export function fromSnapshot(snapshot: string): ProgramContent | null {
  if (!snapshot) return null;
  return JSON.parse(snapshot) as ProgramContent;
}

export function isDirty(
  content: ProgramContent | null,
  snapshot: string,
): boolean {
  return toSnapshot(content) !== snapshot;
}
