/** Підпис поля кількома мовами. Ключі: ua, en, ru та інші коди мови. */
export type FieldLabel = {
  ua?: string;
  en?: string;
  ru?: string;
  [lang: string]: string | undefined;
};

/** Основний код мови браузера: "uk-UA" → "uk". Порожній рядок, якщо мова не задана. */
export function browserLanguage(): string {
  const raw =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : "";
  return raw.toLowerCase().split("-")[0] ?? "";
}

/**
 * Текст підпису мовою браузера.
 * Українська в браузері — "uk", у підписах — "ua".
 * Якщо перекладу немає, береться en.
 */
export function fieldLabelText(label: FieldLabel | null | undefined): string {
  if (!label) return "";
  const lang = browserLanguage();
  const keys = lang === "uk" || lang === "ua" ? ["ua", "uk"] : [lang];
  for (const key of keys) {
    const text = key ? label[key] : undefined;
    if (text) return text;
  }
  return label.en ?? "";
}
