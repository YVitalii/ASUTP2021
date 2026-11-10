/** Адреси ProcessManager. */
export const settings = {
  url: {
    state: "./process/state",
    start: "./process/start",
    stop: "./process/stop",
  },
  /** Кольори рамки та фону за _id програми. */
  states: {
    waiting: {
      board: "#808080",
      background: "color-mix(in srgb, #808080 18%, white)",
    },
    going: {
      board: "#2e9e4f",
      background: "color-mix(in srgb, #2e9e4f 18%, white)",
      boardWidth: "4px",
      textBold: true,
    },
    error: {
      board: "#d32f2f",
      background: "color-mix(in srgb, #d32f2f 18%, white)",
    },
    finished: {
      board: "#1976d2",
      background: "color-mix(in srgb, #1976d2 18%, white)",
    },
    stoped: {
      board: "#f57c00",
      background: "color-mix(in srgb, #f57c00 18%, white)",
    },
  },
  process: {
    command: {
      start: { ua: "Старт", en: "Start", ru: "Старт" },
      stop: { ua: "Стоп", en: "Stop", ru: "Стоп" },
      step: { ua: "Крок:", en: "Step:", ru: "Шаг:" },
    },
    description: {
      header: {
        label: { ua: "Назва:", en: "Name:" },
        type: "TextNote",
      },
      comment: {
        label: { ua: "Коментар:", en: "Comment:" },
        type: "TextNote",
      },
      startTime: {
        label: { ua: "Початок:", en: "Started:" },
        type: "DateTimeField_Labeled",
      },
      duration: {
        label: { ua: "Тривалість:", en: "Duration:" },
        type: "DayTimeField_Labeled",
      },
    }, // description
  }, //
};
