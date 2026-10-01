import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import ProgramEditWindow from "../ProgramEditWindow.vue";
import { settings } from "../settings";
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
      </div>
    `,
  }),
}));

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    get: () => width,
  });
}

function asHtmlElement(element: unknown): HTMLElement {
  if (!(element instanceof HTMLElement)) {
    throw new Error("Очікувався HTMLElement");
  }
  return element;
}

function mountAt(width: number) {
  setViewport(width);
  return mount(ProgramEditWindow);
}

describe("ProgramEditWindow", () => {
  const originalWidth = window.innerWidth;
  let mockServer: ReturnType<typeof setupMockServer>;

  beforeEach(() => {
    mockServer = setupMockServer();
  });

  afterEach(() => {
    mockServer.restore();
    setViewport(originalWidth);
  });

  it("займає всю площу батька і містить ControlArea та ContentArea", () => {
    const wrapper = mountAt(settings.minScreenWidth);

    const root = wrapper.get(".program-edit-window");
    const rootEl = asHtmlElement(root.element);

    const host = asHtmlElement(wrapper.get(".program-edit-window-host").element);

    expect(host.style.width).toBe("100%");
    expect(host.style.height).toBe("100%");
    expect(rootEl.style.flexGrow).toBe("1");
    expect(rootEl.style.display).toBe("flex");

    expect(wrapper.get(".control-area").attributes("aria-label")).toBe("ControlArea");
    expect(wrapper.get(".content-area").attributes("aria-label")).toBe("ContentArea");
  });

  it("підключає ProgramEditAgent і показує список та вміст програми", async () => {
    const wrapper = mountAt(settings.minScreenWidth);
    await flushPromises();

    expect(wrapper.text()).toContain(settings.header);
    expect(wrapper.find(".program-list-item.active .prog-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-title").text()).toBe("Program 1");
    expect(wrapper.find(".stub-description").text()).toBe("Колеса чавунні. Відпуск.");
  });

  it("розташовує зони вертикально, якщо ширина менша за minScreenWidth", () => {
    const wrapper = mountAt(settings.minScreenWidth - 1);
    const root = wrapper.get(".program-edit-window");
    const rootEl = asHtmlElement(root.element);

    expect(root.classes()).not.toContain("wide");
    expect(rootEl.style.flexDirection).toBe("column");
  });

  it("розташовує зони горизонтально і фіксує ширину ControlArea", () => {
    const wrapper = mountAt(settings.minScreenWidth);
    const root = wrapper.get(".program-edit-window");
    const rootEl = asHtmlElement(root.element);
    const controlEl = asHtmlElement(wrapper.get(".control-area").element);

    expect(root.classes()).toContain("wide");
    expect(rootEl.style.flexDirection).toBe("row");
    expect(root.attributes("style")).toContain(
      `--control-area-width: ${settings.minControlAreaWidth}px`,
    );
    expect(controlEl.style.width).toBe(`${settings.minControlAreaWidth}px`);
    expect(controlEl.style.flexBasis).toBe(`${settings.minControlAreaWidth}px`);
  });
});
