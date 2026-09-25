// vueComponents/ProgramEditor/mockServer.ts
import { vi } from "vitest";
import { settings } from "../settings";

export function setupMockServer() {
  // Перехоплюємо глобальний fetch за допомогою Vitest
  const originalFetch = global.fetch;

  const mockedFetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      let body: any = {};

      if (init && init.body) {
        try {
          body = JSON.parse(init.body as string);
        } catch (e) {
          body = {};
        }
      }

      // Імітуємо відповідь для отримання списку або читання файлу
      if (url.includes(settings.URLs.readFile)) {
        // Якщо запитують конкретну програму
        if (body.programName) {
          return new Response(
            JSON.stringify({
              programContent: [
                {
                  id: 1,
                  title: body.programName,
                  description: `Фейковий опис для ${body.programName}`,
                  date: new Date(),
                  maxStepsQuantity: 10,
                  regs: {
                    tT: {
                      title: "tT",
                      units: "°C",
                      type: "Number",
                      min: 0,
                      max: 1000,
                    },
                  },
                },
                { tT: 200, H: "00:10", Y: "00:20" },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // Якщо запитують загальний список програм
        return new Response(
          JSON.stringify({
            programList: ["prg1", "prg2", "prg3"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Імітуємо відповідь для збереження файлу (writeFile)
      if (url.includes(settings.URLs.writeFile)) {
        return new Response(
          JSON.stringify({ success: true, savedProgram: body.programName }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Імітуємо відповідь для видалення файлу (deleteFile)
      if (url.includes(settings.URLs.deleteFile)) {
        return new Response(
          JSON.stringify({ success: true, deleted: body.programName }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Якщо шлях не знайдено, викликаємо стандартний fetch або повертаємо 404
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
      });
    },
  );

  // Підставляємо мок у глобальне середовище Node.js
  vi.stubGlobal("fetch", mockedFetch);

  return {
    restore: () => {
      vi.stubGlobal("fetch", originalFetch);
    },
  };
}
