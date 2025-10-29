// cd controllers/CheckListTask/tests
// supervisor --no-restart-on exit -w ../ ./Create_TaskCheckList_test.js

const ClassTaskCheckList = require("../ClassTaskCheckList");
let item = new ClassTaskCheckList({
  homeDir: "e:/node/ASUTP2021/data/tasks",
  homeUrl: "/tasks",
});
console.dir(item, { depth: 3 });
