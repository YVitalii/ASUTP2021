const PREFIX = "ProgramEditAgent.ts::";
const ENABLED = true;

export function trace(fn: string, ...args: unknown[]) {
  if (!ENABLED) return;
  console.log(PREFIX + fn + "::", ...args);
}

export function traceWarn(fn: string, ...args: unknown[]) {
  if (!ENABLED) return;
  console.warn(PREFIX + fn + "::", ...args);
}

export function traceError(fn: string, ...args: unknown[]) {
  if (!ENABLED) return;
  console.error(PREFIX + fn + "::", ...args);
}
