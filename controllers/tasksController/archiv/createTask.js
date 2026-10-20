let tasks = () => {};
let trace = 1;
tasks.types = {
  empty: { id: "empty", title: { ua: "", en: "", ru: "" }, regs: {} },
  heating: { id: "empty", title: { ua: "", en: "", ru: "" }, regs: {} },
};
tasks.createTask = (prefix = "", type = "empty", regs = {}, props = {}) => {
  let html = '<div class="row">';
  for (let key in regs) {
    if (regs.hasOwnProperty(key)) {
      console.log(`regs[${key}]=${regs[key].id}`);
    }
  }
};
