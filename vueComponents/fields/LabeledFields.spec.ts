import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import TextField_Labeled from "./TextField_Labeled.vue";
import TextAreaField_Labeled from "./TextAreaField_Labeled.vue";

const label = {
  ua: "Назва",
  en: "Name",
  ru: "Название",
};

function setBrowserLanguage(language: string) {
  Object.defineProperty(navigator, "language", {
    value: language,
    configurable: true,
  });
}

afterEach(() => {
  setBrowserLanguage("en");
});

describe("TextField_Labeled", () => {
  it("бере підпис мовою браузера", () => {
    setBrowserLanguage("uk-UA");
    const wrapper = mount(TextField_Labeled, {
      props: { modelValue: "prg02", label, disabled: true },
    });

    expect(wrapper.text()).toContain("Назва");
    const input = wrapper.get("input");
    expect(input.element.value).toBe("prg02");
    expect(input.element.disabled).toBe(true);
  });

  it("якщо мови браузера немає в підписі, показує en", () => {
    setBrowserLanguage("de-DE");
    const wrapper = mount(TextField_Labeled, {
      props: { modelValue: "", label },
    });

    expect(wrapper.text()).toContain("Name");
  });
});

describe("TextAreaField_Labeled", () => {
  it("бере підпис мовою браузера і передає текст у поле", () => {
    setBrowserLanguage("ru");
    const wrapper = mount(TextAreaField_Labeled, {
      props: { modelValue: "Опис", label },
    });

    expect(wrapper.text()).toContain("Название");
    expect(wrapper.get("textarea").element.value).toBe("Опис");
  });

  it("без мови браузера показує en", () => {
    setBrowserLanguage("");
    const wrapper = mount(TextAreaField_Labeled, {
      props: { modelValue: "", label },
    });

    expect(wrapper.text()).toContain("Name");
  });
});
