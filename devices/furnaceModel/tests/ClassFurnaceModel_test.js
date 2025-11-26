// cd ./devices/furnaceModel
// supervisor --watch './,./tests'  --extensions 'js,pug' --timestamp --no-restart-on exit ./tests/ClassFurnaceModel_test.js

const ClassFurnaceModel = require("../ClassFurnaceModel.js");

const furnace = new ClassFurnaceModel({
  power: 7000,
});

console.log("furnace=", furnace);

(async () => {
  await furnace.setPower(30); // встановлюємо потужність нагрівача 10%
})();

setTimeout(async () => {
  let T = await furnace.setPower(0);
}, 5 * 60 * 1000);
