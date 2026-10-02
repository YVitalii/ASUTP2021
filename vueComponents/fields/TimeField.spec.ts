import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TimeField from "./TimeField.vue";

describe("TimeField", () => {
  it("показує години і хвилини з початковими нулями", () => {
    const wrapper = mount(TimeField, {
      props: { modelValue: "1:3", max: "99:59" },
    });

    const inputs = wrapper.findAll("input");
    expect(inputs[0].element.value).toBe("01");
    expect(inputs[1].element.value).toBe("03");
    expect(wrapper.text()).toContain(":");
  });

  it("після редагування знову доповнює значення нулями", async () => {
    const wrapper = mount(TimeField, {
      props: { modelValue: "00:00", max: "99:59" },
    });

    const inputs = wrapper.findAll("input");
    await inputs[0].setValue("4");
    await inputs[1].setValue("7");
    await inputs[0].trigger("blur");

    expect(inputs[0].element.value).toBe("04");
    expect(inputs[1].element.value).toBe("07");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["04:07"]);
  });

  it("стрілка вгору збільшує значення поля, стрілка вниз зменшує", async () => {
    const wrapper = mount(TimeField, {
      props: { modelValue: "01:03", max: "99:59" },
    });
    const inputs = wrapper.findAll("input");

    await inputs[0].trigger("keydown", { key: "ArrowUp" });
    expect(inputs[0].element.value).toBe("02");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["02:03"]);

    await inputs[1].trigger("keydown", { key: "ArrowDown" });
    expect(inputs[1].element.value).toBe("02");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["02:02"]);

    await inputs[1].setValue("00");
    await inputs[1].trigger("keydown", { key: "ArrowDown" });
    expect(inputs[1].element.value).toBe("59");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["02:59"]);
  });

  it("на краях стрілки переходять по колу", async () => {
    const wrapper = mount(TimeField, {
      props: { modelValue: "23:59", max: "23:59" },
    });
    const inputs = wrapper.findAll("input");

    await inputs[1].trigger("keydown", { key: "ArrowUp" });
    expect(inputs[1].element.value).toBe("00");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["23:00"]);

    await inputs[0].trigger("keydown", { key: "ArrowUp" });
    expect(inputs[0].element.value).toBe("00");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["00:00"]);

    await inputs[0].trigger("keydown", { key: "ArrowDown" });
    expect(inputs[0].element.value).toBe("23");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["23:00"]);
  });

  it("Enter забирає фокус з поля", async () => {
    const wrapper = mount(TimeField, {
      props: { modelValue: "01:03", max: "99:59" },
      attachTo: document.body,
    });
    const hours = wrapper.findAll("input")[0];
    (hours.element as HTMLInputElement).focus();

    await hours.trigger("keydown", { key: "Enter" });

    expect(document.activeElement).not.toBe(hours.element);
    wrapper.unmount();
  });
});
