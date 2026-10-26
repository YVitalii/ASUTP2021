// settings.ts — опис кнопок навігаційного меню.
// Повна адреса кнопки: url = baseUrl + url цього id.

export interface LocalizedText {
  ua: string;
  ru: string;
  en: string;
}

export interface NaviButton {
  id: string;
  /** CSS-класи кнопки, наприклад btn-outline-primary */
  style: string;
  title: string;
  /** Спливаюча підказка. */
  hint: LocalizedText;
  /** Відносний шлях. Порожній рядок — сама базова адреса. */
  url: string;
  disabled: boolean;
}

export const settings = {
  /** Усі адреси: baseUrl + url кнопки. */
  baseUrl: "/entity/${entityId}/",
  /** Вужче за це (px) кнопки стають стовпчиком. */
  layoutBreakpoint: 480,
};

export const naviButtons: NaviButton[] = [
  {
    id: "buttonEntity",
    style: "btn-outline-primary",
    title: "Піч",
    hint: {
      ua: "Керування піччю",
      ru: "Управление печью",
      en: "Furnace control",
    },
    url: "",
    disabled: false,
  },
  {
    id: "buttonTasks",
    style: "btn-outline-primary",
    title: "Програма",
    hint: {
      ua: "Редагування програми",
      ru: "Редактирование программы",
      en: "Program editing",
    },
    url: "tasksManager",
    disabled: false,
  },
  {
    id: "buttonLogger",
    style: "btn-outline-primary",
    title: "Архів",
    hint: {
      ua: "Перегляд та формування звітів",
      ru: "Просмотр и формирование отчетов",
      en: "View and create reports",
    },
    url: "loggerManager",
    disabled: false,
  },
];

/** entityId із шляху /entity/${entityId}/… або з явного аргумента. */
export function resolveEntityId(entityId?: string): string {
  if (entityId) return entityId.replace(/^\/+|\/+$/g, "");
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/\/entity\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/** baseUrl = /entity/${entityId}/ */
export function resolveBaseUrl(entityId?: string): string {
  return settings.baseUrl.replaceAll("${entityId}", resolveEntityId(entityId));
}

/** Мова сторінки з глобального lang (main.pug), інакше українська. */
export function pageLang(): keyof LocalizedText {
  const value = (globalThis as { lang?: string }).lang;
  if (value === "ru" || value === "en") return value;
  return "ua";
}

export function buttonHint(button: NaviButton, lang = pageLang()): string {
  return button.hint[lang] || button.hint.ua;
}

/** url = baseUrl + settings[id].url */
export function buttonUrl(id: string, entityId?: string): string {
  const button = naviButtons.find((item) => item.id === id);
  return resolveBaseUrl(entityId) + (button?.url ?? "");
}
