
 (() => {
 const {w2} =require("../../../conf_iface");
 const TRM251 =require("../ManagerClassTRM251");
 let manager = new TRM251({ iface: w2, addr: 16, id: "furnace", addT: 0 });
 console.dir(manager);
 manager.getT().then((t) => {
   console.log("T:", t);
 }).catch((error) => {
   console.error("Get T failed:", error);
 });
//  manager.getCurrentState().then((state) => {
//    console.log("Current state:", state);
//  }).catch((error) => {
//    console.error("Get current state failed:", error);
//  });
//  manager.stop().then(() => {
//    console.log("Stop completed");
//  }).catch((error) => {
//    console.error("Stop failed:", error);
//  });
})();
