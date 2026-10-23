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
  fName: string;
  description: string;
  date: Date | string;
  maxStepsQuantity: number;
}

export type ProgramStep = Record<string, unknown>;

export type ProgramContent = [ProgramHeader, ...ProgramStep[]];

export interface ProcessState {
  acceptedProgram: string | null;
  programRunning: boolean;
}

/** Опис типу кроку з POST /getTasksDescription. */
export interface TaskTypeHeader {
  id: string;
  header: LocalizedMessage;
  comment: LocalizedMessage;
  type?: string;
  value?: unknown;
  editable?: boolean;
  regs?: Record<string, RegConfig>;
}

export interface ProgramEditorState {
  activeProgramName: string;
  programEdited: boolean;
  /** fName програм із POST /getFilesList */
  programList: string[] | null;
  programContent: ProgramContent | null;
  headers: Record<string, TaskTypeHeader> | null;
  acceptedProgram: string | null;
  programRunning: boolean;
  originalJson: string;
  isLoading: boolean;
  isSaving: boolean;
  lastError: string | null;
}
