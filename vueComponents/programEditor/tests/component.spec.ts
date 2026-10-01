import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import ProgramEditor from "../component.vue";
import { setupMockServer, useMockPostJson } from "./mockServer";

vi.mock("../../composables/usePostJson", () => ({
  usePostJson: (
    url?: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
    options?: unknown,
  ) => useMockPostJson(url, body, headers, options),
}));

vi.mock("../../programManager/component.vue", () => ({
  default: defineComponent({
    name: "ProgramManagerStub",
    props: {
      programData: { type: Array, default: null },
      readOnly: { type: Boolean, default: false },
    },
    emits: ["update:programData"],
    template: `
      <div class="program-manager-stub">
        <p class="stub-title">{{ programData?.[0]?.title }}</p>
        <p class="stub-description">{{ programData?.[0]?.description }}</p>
        <button class="stub-edit" type="button" @click="emitDirty">Змінити опис</button>
      </div>
    `,
    methods: {
      emitDirty() {
        const next = JSON.parse(JSON.stringify(this.programData));
        next[0].description = "Зміна з UI";
        this.$emit("update:programData", next);
      },
    },
  }),
}));

describe("ProgramEditor component (usePostJson → фейковий сервер)", () => {
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    mockServer = setupMockServer();
  });

  afterEach(() => {
    mockServer.restore();
  });

  async function mountEditor() {
    const wrapper = mount(ProgramEditor);
    await flushPromises();
    return wrapper;
  }

  it("після монтування завантажує список програм і показує першу", async () => {
    const wrapper = await mountEditor();

    expect(wrapper.text()).toContain("Редактор програми");
    expect(wrapper.findAll(".program-list-item").map((item) => item.text())).toEqual(
      expect.arrayContaining(["Program 1", "Program 2", "Program 3"]),
    );
    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-description").text()).toBe("Колеса чавунні. Відпуск.");
    expect(wrapper.find(".edited-badge").exists()).toBe(false);
  });

  it("показує бейдж виконуваної програми з processState", async () => {
    mockServer.processState.runningProgramName = "Program 2";
    const wrapper = await mountEditor();

    const running = wrapper.findAll(".program-list-item").find((item) =>
      item.text().includes("Program 2"),
    );
    expect(running?.find(".running-badge").exists()).toBe(true);
  });

  it("перемикає програму кліком у списку", async () => {
    const wrapper = await mountEditor();

    const secondProgram = wrapper.findAll(".program-list-item").find((item) =>
      item.find(".prog-title").text() === "Program 2",
    );
    await secondProgram!.trigger("click");
    await flushPromises();

    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 2");
    expect(wrapper.find(".stub-title").text()).toBe("Program 2");
    expect(wrapper.find(".stub-description").text()).toBe("Програма 2");
  });

  it("після зміни з UI показує бейдж і зберігає через writeFile", async () => {
    const wrapper = await mountEditor();

    await wrapper.find(".stub-edit").trigger("click");
    await flushPromises();

    expect(wrapper.find(".edited-badge").exists()).toBe(true);

    const saveButton = wrapper.findAll("button").find((btn) => btn.text() === "Зберегти");
    expect(saveButton?.attributes("disabled")).toBeUndefined();
    await saveButton!.trigger("click");
    await flushPromises();

    expect(wrapper.find(".edited-badge").exists()).toBe(false);
    expect(mockServer.files.get("Program 1")?.[0]?.description).toBe("Зміна з UI");
  });

  it("скидає локальні зміни кнопкою Скинути", async () => {
    const wrapper = await mountEditor();

    await wrapper.find(".stub-edit").trigger("click");
    await flushPromises();
    expect(wrapper.find(".stub-description").text()).toBe("Зміна з UI");

    await wrapper.find(".reset-btn").trigger("click");
    await flushPromises();

    expect(wrapper.find(".edited-badge").exists()).toBe(false);
    expect(wrapper.find(".stub-description").text()).toBe("Колеса чавунні. Відпуск.");
  });

  it("не дає змінити програму при незбережених змінах", async () => {
    const wrapper = await mountEditor();

    await wrapper.find(".stub-edit").trigger("click");
    await flushPromises();

    const secondProgram = wrapper.findAll(".program-list-item").find((item) =>
      item.find(".prog-title").text() === "Program 2",
    );
    await secondProgram!.trigger("click");
    await flushPromises();

    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 1");
    expect(wrapper.find(".error-banner").text()).toContain("незбережені зміни");
    expect(wrapper.find(".stub-description").text()).toBe("Зміна з UI");
  });

  it("видаляє активну програму і відкриває наступну", async () => {
    const wrapper = await mountEditor();

    await wrapper.find(".delete-btn").trigger("click");
    await flushPromises();

    expect(wrapper.findAll(".prog-title").map((el) => el.text())).toEqual([
      "Program 2",
      "Program 3",
    ]);
    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 2");
    expect(wrapper.find(".stub-title").text()).toBe("Program 2");
    expect(mockServer.files.has("Program 1")).toBe(false);
  });

  it("показує спінер, поки дані ще не завантажені", async () => {
    const wrapper = mount(ProgramEditor);

    expect(wrapper.find(".spinner").exists()).toBe(true);
    expect(wrapper.text()).toContain("Завантаження списку програм");

    await flushPromises();
    wrapper.unmount();
  });

  it("показує помилку, якщо список програм не завантажився", async () => {
    mockServer.flags.failGetFilesList = true;
    const wrapper = await mountEditor();

    expect(wrapper.find(".load-error").exists()).toBe(true);
    expect(wrapper.find(".load-error").text()).toContain(
      "Не вдалося завантажити список програм.",
    );
    expect(wrapper.find(".program-list-item").exists()).toBe(false);
    expect(wrapper.find(".program-manager-stub").exists()).toBe(false);
  });
});
