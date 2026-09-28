export interface LocalizedMessage {
  ua?: string;
  ru?: string;
  en?: string;
}

export interface ApiEnvelope<T> {
  err: LocalizedMessage | string | null;
  data: T | null;
}

export interface RegConfig {
  title: string;
  units: string;
  type: string;
  min: number | string;
  max: number | string;
  comment: string;
}

export interface ProgramHeader {
  id: number;
  title: string;
  description: string;
  date: Date | string;
  maxStepsQuantity: number;
  regs: Record<string, RegConfig>;
}

export type ProgramStep = Record<string, unknown>;

export type ProgramContent = [ProgramHeader, ...ProgramStep[]];

export interface ProcessState {
  runningProgramName: string | null;
  activeSteps: unknown;
}

export interface ProgramEditorState {
  activeProgramName: string;
  programEdited: boolean;
  programList: string[] | null;
  programContent: ProgramContent | null;
  runningProgramName: string | null;
  originalJson: string;
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
}
