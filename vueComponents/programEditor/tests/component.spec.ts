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
    expect(wrapper.findAll(".prog-title").map((item) => item.text())).toEqual([
      "Program 1",
      "Program 2",
      "Program 3",
    ]);
    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-description").text()).toBe("Колеса чавунні. Відпуск.");
    expect(wrapper.find(".edited-badge").exists()).toBe(false);
  });

  it("показує синю позначку Завантажено для програми з processState", async () => {
    mockServer.processState.acceptedProgram = "Program 2";
    const wrapper = await mountEditor();

    const accepted = wrapper.findAll(".program-list-item").find((item) =>
      item.find(".prog-title").text() === "Program 2",
    );
    expect(accepted?.find(".accepted-badge").text()).toBe("Завантажено");
    expect(accepted?.classes()).not.toContain("accepted");
    expect(wrapper.find(".activate-btn").attributes("disabled")).toBeUndefined();
    expect(wrapper.findComponent({ name: "ProgramManagerStub" }).props("readOnly")).toBe(false);

    await accepted!.trigger("click");
    await flushPromises();

    expect(wrapper.find(".activate-btn").attributes("disabled")).toBeDefined();
    expect(wrapper.findComponent({ name: "ProgramManagerStub" }).props("readOnly")).toBe(false);
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

  it("активує збережену програму і блокує кнопку, поки є зміни", async () => {
    const wrapper = await mountEditor();
    const activateButton = wrapper.find(".activate-btn");

    expect(activateButton.text()).toBe("Активувати");
    expect(activateButton.attributes("disabled")).toBeUndefined();

    await activateButton.trigger("click");
    await flushPromises();
    expect(mockServer.activation.fileName).toBe("Program 1");
    const acceptedItem = wrapper.findAll(".program-list-item").find((item) =>
      item.find(".prog-title").text() === "Program 1",
    );
    expect(acceptedItem?.find(".accepted-badge").text()).toBe("Завантажено");
    expect(acceptedItem?.classes()).not.toContain("accepted");
    expect(wrapper.find(".activate-btn").attributes("disabled")).toBeDefined();
    expect(wrapper.findComponent({ name: "ProgramManagerStub" }).props("readOnly")).toBe(false);

    const secondProgram = wrapper.findAll(".program-list-item").find((item) =>
      item.find(".prog-title").text() === "Program 2",
    );
    await secondProgram!.trigger("click");
    await flushPromises();
    expect(wrapper.find(".activate-btn").attributes("disabled")).toBeUndefined();

    await wrapper.find(".stub-edit").trigger("click");
    await flushPromises();

    expect(wrapper.find(".activate-btn").attributes("disabled")).toBeDefined();
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

  it("вимикає Видалити для програми, завантаженої в прилад", async () => {
    mockServer.processState.acceptedProgram = "Program 1";
    const wrapper = await mountEditor();

    expect(wrapper.find(".delete-btn").attributes("disabled")).toBeDefined();
  });

  it("видаляє активну програму і відкриває наступну", async () => {
    const wrapper = await mountEditor();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await wrapper.find(".delete-btn").trigger("click");
    await flushPromises();
    confirmSpy.mockRestore();

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
