// src/components/CheckboxComponent.test.js
import { describe, it, expect } from "vitest";
import { shallowMount, mount } from "@vue/test-utils";
import CheckboxComponent from "./СheckboxSrike.vue";

// Описуємо групу тестів
describe("CheckboxComponent", () => {
  // Тест 1: Перевірка початкового стану
  it("рендерить мітку і чекбокс з правильними props", () => {
    // Монтуємо компонент з вхідними даними
    const wrapper = shallowMount(CheckboxComponent, {
      props: {
        id: "test-id",
        label: "Test Label",
        modelValue: false,
        required: true,
      },
    });
    console.log(wrapper.find("input").html());
    console.log(wrapper.find("label").html());

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
    let ln = "test2::",
      trace = 1;
    const wrapper = mount(CheckboxComponent, {
      props: {
        id: "test-id",
        label: "Test Label",
        modelValue: false,
      },
    });

    // Знаходимо чекбокс і імітуємо клік
    const input = wrapper.find('input[type="checkbox"]');
    trace ? console.log(ln + `input=${input.html()}`) : null;
    // 1. Встановлюємо властивість 'checked' на елементі DOM (Крок 1)
    // Ми імітуємо, що користувач поставив позначку
    await input.setChecked(true);
    // 2. Тригеримо подію 'change' (Крок 2)
    // Це викликає обробник події, який відправляє подію 'update:modelValue'
    // await input.trigger("change");

    // await wrapper.setProps({ modelValue: true });
    // Перевіряємо, що значення події є правильним
    const emittedEvent = wrapper.emitted("update:modelValue");
    if (trace) {
      console.log(ln + `emittedEvent=`);
      console.dir(emittedEvent);
    }

    // Перевіряємо, що компонент надіслав подію
    expect(emittedEvent).toBeTruthy();

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
