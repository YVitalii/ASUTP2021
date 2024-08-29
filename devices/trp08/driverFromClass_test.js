const driver = require("./driverFromClass");
const assert = require("assert");
const iface = require("../../conf_iface").w2;

describe("driverFromClass testing", () => {
  describe('test register "state"', () => {
    it("Read 'state' ", (done) => {
      driver.getReg(iface, 1, "state", (err, data) => {
        if (err) {
          done(err);
          return;
        }
        done();
      });
      return;
    });
  });
});
