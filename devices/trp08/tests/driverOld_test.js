const assert = require("node:assert");
const { describe, it } = require("node:test");
// для завантаження:
// - емулятора потрібно встановити config.js: emulateDevices=true
// - реального приладу RS485 emulateDevices=false
const iface = require("../../../conf_iface").w2;
// драйвер приладу
const driver = require("../driver");

describe("Test trp08 driver", () => {});
