import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DateTimeField_Labeled from "./DateTimeField_Labeled.vue";
import DayTimeField_Labeled from "./DayTimeField_Labeled.vue";

const label = { ua: "Час", en: "Time" };

describe("DateTimeField_Labeled", () => {
  it("показує дату й час без секунд", () => {
    const wrapper = mount(DateTimeField_Labeled, {
      props: { modelValue: "2026-10-30T12:58:45", label },
    });
    const value = wrapper.get("input").element.value;
    expect(value).not.toMatch(/:45/);
    expect(value).toMatch(/58/);
  });

  it("обрізає ГГ:ХХ:СС до ГГ:ХХ", () => {
    const wrapper = mount(DateTimeField_Labeled, {
      props: { modelValue: "1:03:45", label },
    });
    expect(wrapper.get("input").element.value).toBe("1:03");
  });
});

describe("DayTimeField_Labeled", () => {
  it("прибирає секунди і 00d, коли днів немає", () => {
    const wrapper = mount(DayTimeField_Labeled, {
      props: { modelValue: "00d01:02:03", label },
    });
    expect(wrapper.get("input").element.value).toBe("01:02");
  });

  it("лишає дні, якщо їх більше нуля", () => {
    const wrapper = mount(DayTimeField_Labeled, {
      props: { modelValue: "02d04:05:06", label },
    });
    expect(wrapper.get("input").element.value).toBe("02d04:05");
  });
});
