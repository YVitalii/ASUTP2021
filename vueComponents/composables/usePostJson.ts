export interface PostOptions {
  timeout?: number;   // Час очікування в мілісекундах (за замовчуванням 5000)
  maxErrors?: number; // Максимальна кількість спроб при помилці зв'язку (за замовчуванням 3)
}

export async function usePostJson<T = any>(
  url: string = '',
  body: Record<string, any> = {},
  headers: Record<string, string> = {},
  options: PostOptions = {}
):> Promise<T> {
  // Встановлюємо значення за замовчуванням згідно з твоїми вимогами
  const timeout = options.timeout ?? 5000;
  const maxErrors = options.maxErrors ?? 3;

  let attempt = 0;

  while (attempt < maxErrors) {
    attempt++;
    
    // 1. Формуємо мінімально необхідні заголовки і додаємо/перезаписуємо їх переданими ззовні
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    // Створюємо контролер для керування таймаутом запиту
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Виконуємо POST-запит
      const response = await fetch(url, {
        method: 'POST',
        headers: finalHeaders,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // Очищуємо таймер, оскільки відповідь прийшла вчасно
      clearTimeout(timeoutId);

      // Перевіряємо, чи успішний статус відповіді від сервера (наприклад, 200-299)
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // 4. Намагаємося спарсити відповідь як JSON
      try {
        const jsonData = await response.json();
        return jsonData as T; // 5. Повертаємо розпарсений JSON
      } catch (parseError) {
        throw new Error('Помилка парсингу JSON відповіді від сервера');
      }

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Визначаємо, чи це помилка зв'язку або таймаут
      const isNetworkOrTimeoutError = 
        error.name === 'AbortError' || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError');

      // Якщо це остання спроба або помилка не пов'язана з мережею/таймаутом (наприклад, помилка парсингу)
      if (attempt >= maxErrors || !isNetworkOrTimeoutError) {
        if (isNetworkOrTimeoutError && attempt >= maxErrors) {
          throw new Error('Connection error');
        }
        // Прокидуємо оригінальну помилку (наприклад, помилку парсингу JSON) далі
        throw error;
      }

      // Якщо це не оставня спроба при помилці зв'язку — цикл продовжиться для наступної спроби
      console.warn(`Спроба ${attempt} не вдалася. Повтор...`, error);
    }
  }

  throw new Error('Connection error');
}
