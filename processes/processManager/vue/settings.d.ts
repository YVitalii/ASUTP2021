export interface FieldLabel {
  ua?: string;
  en?: string;
  ru?: string;
}

export interface DescriptionField {
  label: FieldLabel;
  type: string;
}

export interface StateColors {
  board: string;
  background: string;
}

export interface ProcessManagerSettings {
  url: {
    state: string;
  };
  states: {
    waiting: StateColors;
    going: StateColors;
    error: StateColors;
    finished: StateColors;
    stoped: StateColors;
  };
  process: {
    description: {
      header: DescriptionField;
      comment: DescriptionField;
      startTime: DescriptionField;
      duration: DescriptionField;
    };
  };
}

export const settings: ProcessManagerSettings;
