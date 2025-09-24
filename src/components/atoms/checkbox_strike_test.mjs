// src/components/CheckboxComponent.test.js
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CheckboxComponent from "./checkbox_strike.vue";

// Описуємо групу тестів
describe("CheckboxComponent", () => {
  // Тест 1: Перевірка початкового стану
  it("рендерить мітку і чекбокс з правильними props", () => {
    // Монтуємо компонент з вхідними даними
    const wrapper = mount(CheckboxComponent, {
      props: {
        id: "test-id",
        label: "Test Label",
        modelValue: false,
        required: true,
      },
    });

    // Знаходимо елементи і перевіряємо їх властивості
    const input = wrapper.find("input");
    const label = wrapper.find("label");

    expect(label.text()).toBe("Test Label");
    expect(label.classes()).not.toContain("strikethrough"); // Мітка не закреслена
    expect(input.attributes("id")).toBe("test-id");
    expect(input.attributes("required")).toBe(""); // `required` є атрибутом без значення
    expect(input.element.checked).toBe(false); // Чекбокс не позначений
  });

  // Тест 2: Перевірка зміни стану при кліку
  it("відправляє подію `update:modelValue` при кліку на чекбокс", async () => {
    const wrapper = mount(CheckboxComponent, {
      props: {
        id: "test-id",
        label: "Test Label",
        modelValue: false,
      },
    });

    // Знаходимо чекбокс і імітуємо клік
    const input = wrapper.find('input[type="checkbox"]');
    await input.trigger("change");

    // Перевіряємо, що компонент надіслав подію
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();

    // Перевіряємо, що значення події є правильним
    const emittedEvent = wrapper.emitted("update:modelValue");
    expect(emittedEvent[0][0]).toBe(true);
  });

  // Тест 3: Перевірка стилів
  it("закреслює мітку, коли `modelValue` є `true`", async () => {
    // Монтуємо компонент з `modelValue: true`
    const wrapper = mount(CheckboxComponent, {
      props: {
        id: "test-id",
        label: "Test Label",
        modelValue: true,
      },
    });

    // Перевіряємо, що клас `strikethrough` присутній
    const label = wrapper.find("label");
    expect(label.classes()).toContain("strikethrough");
  });
});
