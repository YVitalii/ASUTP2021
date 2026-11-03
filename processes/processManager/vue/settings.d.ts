import type { FieldLabel } from "../../../vueComponents/fields/fieldLabel";

export type { FieldLabel };

export interface DescriptionField {
  label: FieldLabel;
  type: string;
}

export interface StateColors {
  board: string;
  background: string;
  /** Товщина рамки вузла, наприклад "4px". */
  boardWidth?: string;
  /** Жирний підпис вузла. */
  textBold?: boolean;
}

export interface ProcessManagerSettings {
  url: {
    state: string;
    start: string;
    stop: string;
  };
  states: {
    waiting: StateColors;
    going: StateColors;
    error: StateColors;
    finished: StateColors;
    stoped: StateColors;
  };
  process: {
    command: {
      start: FieldLabel;
      stop: FieldLabel;
      step: FieldLabel;
    };
    description: {
      header: DescriptionField;
      comment: DescriptionField;
      startTime: DescriptionField;
      duration: DescriptionField;
    };
  };
}

export const settings: ProcessManagerSettings;
