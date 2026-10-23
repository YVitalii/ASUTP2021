import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ProgramManager from "./component.vue";

const headers = {
  taskThermal: {
    id: "taskThermal",
    type: "regsList",
    regs: {
      tT: {
        type: "number",
        header: { ua: "T,°C" },
        unit: { ua: "°C" },
        min: 0,
        max: 1200,
        comment: { ua: "Цільова температура" },
      },
      H: {
        type: "timer",
        header: { ua: "Час нагрівання" },
        unit: { ua: "хв" },
        min: 0,
        max: 1439,
      },
    },
  },
  thermalTaskSimple: {
    id: "thermalTaskSimple",
    type: "thermalTaskSimple",
    regs: {
      tT: {
        type: "number",
        header: { ua: "tT" },
        unit: { ua: "°C" },
        min: 0,
        max: 1200,
      },
      Y: {
        type: "timer",
        header: { ua: "Y" },
        unit: { ua: "хв" },
        min: 0,
        max: 5940,
      },
    },
  },
};

function program() {
  return [
    {
      id: 1,
      fName: "prg01",
      description: "опис",
      date: "2023-05-03T11:04:49.715Z",
      maxStepsQuantity: 15,
    },
    { id: "taskThermal", tT: 400, H: 10 },
    { type: "thermalTaskSimple", tT: 80, Y: 15 },
  ];
}

describe("ProgramManager рядок за типом кроку", () => {
  it("бере поля з headers.get(type) і розрізняє number та timer", () => {
    const wrapper = mount(ProgramManager, {
      props: { programData: program(), headers, readOnly: true },
    });

    const headersText = wrapper.findAll("th").map((cell) => cell.text());
    expect(headersText[1]).toContain("T,°C");
    expect(headersText[2]).toContain("Час нагрівання");
    expect(headersText[3]).toContain("Y");

    const rows = wrapper.findAll("tbody tr");
    const thermal = rows[0].findAll("td");
    expect(thermal[1].find("input[type='number']").exists()).toBe(true);
    expect(thermal[2].find(".time-field-container").exists()).toBe(true);
    expect(thermal[3].find("input").exists()).toBe(false);

    const simple = rows[1].findAll("td");
    expect(simple[1].find("input[type='number']").exists()).toBe(true);
    expect(simple[2].find("input").exists()).toBe(false);
    expect(simple[3].find(".time-field-container").exists()).toBe(true);
  });

  it("додає копію попереднього кроку", async () => {
    const data = program();
    const wrapper = mount(ProgramManager, {
      props: { programData: data, headers, readOnly: false },
    });

    await wrapper.find("tbody tr").trigger("click");
    await wrapper.find(".rightBottom").trigger("click");

    expect(data[2]).toEqual({ id: "taskThermal", tT: 400, H: 10 });
    expect(data[2]).not.toBe(data[1]);
    expect(data[3]).toEqual({ type: "thermalTaskSimple", tT: 80, Y: 15 });
  });
});
