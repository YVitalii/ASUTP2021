import { inject, type InjectionKey } from "vue";
import type { useProgramEditAgent } from "./ProgramEditAgent";

export type ProgramEditorContext = ReturnType<typeof useProgramEditAgent> & {
  settings: typeof import("./settings").settings;
};

export const programEditorContextKey: InjectionKey<ProgramEditorContext> =
  Symbol("programEditorContext");

export function useProgramEditorContext(): ProgramEditorContext {
  const context = inject(programEditorContextKey);
  if (!context) {
    throw new Error("useProgramEditorContext() лише всередині BaseGrid");
  }
  return context;
}
