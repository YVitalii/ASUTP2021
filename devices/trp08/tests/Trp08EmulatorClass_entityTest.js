// cd ./devices/trp08
// supervisor --no-restart-on exit ./tests/Trp08EmulatorClass_entityTest.js

const Trp08EmulatorClass = require("../Trp08EmulatorClass");

let dev = new Trp08EmulatorClass({});

function start(props = {}) {
  console.log("------------ START -------------");
  console.log("Start. dev=");

  let params = {
    tT: props.tT || props.tT == 0 ? props.tT : 200,
    o: props.o || props.o == 0 ? props.o : 150,
    ti: props.ti || props.ti == 0 ? props.ti : 20,
    td: props.td || props.td == 0 ? props.td : 10,
    H: props.H != undefined ? props.H : 0,
    Y: props.Y != undefined ? props.Y : 0,
  };

  for (const key in params) {
    if (!Object.hasOwn(params, key)) continue;
    dev.getRegById(key)._value = params[key];
  }

  console.dir(dev, { depth: 2 });

  dev.getRegById("state").value = 17;
}

function stop() {
  console.log("------------ STOP -------------");
  dev.getRegById("state").value = 1;
}

start(200);

setTimeout(
  () => {
    stop();
  },
  5 * 60 * 1000,
);
