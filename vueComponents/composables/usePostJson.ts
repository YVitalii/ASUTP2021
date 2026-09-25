// src/ProgramEditor/usePostJson.ts

export interface PostOptions {
  timeout?: number; // Час очікування в мілісекундах (за замовчуванням 5000)
  maxErrors?: number; // Максимальна кількість спроб при помилці зв'язку (за замовчуванням 3)
}

// Глобальні змінні для трасування
const gLn = "usePostJson.ts::";
const gTrace = true;

export async function usePostJson<T = any>(
  url: string = "",
  body: Record<string, any> = {},
  headers: Record<string, string> = {},
  options: PostOptions = {},
): Promise<T> {
  // Виправлено зайвий символ '>' у сигнатурі
  const ln = gLn + "usePostJson::";
  const trace = gTrace || true;

  // Встановлюємо значення за замовчуванням
  const timeout = options.timeout ?? 5000;
  const maxErrors = options.maxErrors ?? 3;

  let attempt = 0;

  if (trace)
    console.log(
      ln +
        `Підготовка POST-запиту на ${url}. Максимум спроб: ${maxErrors}, Таймаут: ${timeout}мс`,
    );

  while (attempt < maxErrors) {
    attempt++;

    // Формуємо заголовки
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    // Створюємо контролер для таймауту
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: finalHeaders,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      try {
        const jsonData = await response.json();
        if (trace)
          console.log(ln + "Запит успішно виконано та спарсено.", jsonData);
        return jsonData as T;
      } catch (parseError) {
        throw new Error("Помилка парсингу JSON відповіді від сервера");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Визначаємо, чи це помилка мережі або таймаут
      const isNetworkOrTimeoutError =
        error.name === "AbortError" ||
        error.message.includes("Failed to fetch");

      if (attempt >= maxErrors || !isNetworkOrTimeoutError) {
        if (isNetworkOrTimeoutError && attempt >= maxErrors) {
          if (trace)
            console.error(ln + "Вичерпано всі спроби. Помилка з'єднання.");
          throw new Error("Connection error");
        }
        throw error;
      }

      if (trace)
        console.warn(
          ln + `Спроба ${attempt} не вдалася. Повтор...`,
          error.message,
        );
    }
  }

  throw new Error("Connection error");
}
