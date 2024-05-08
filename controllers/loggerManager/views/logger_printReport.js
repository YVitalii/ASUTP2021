window.addEventListener("beforeprint", async (event) => {
  console.warn("Before print");
  debugger;
  header.style.display = "none";
  fileManager.container.style.display = "none";
  bodyRow.classList.remove("h-100");
  bodyRow.style.height = "175mm";
  bodyRow.style.width = "280mm";
  chartColumn.classList.remove("col-10");
  chartColumn.classList.add("col-12");

  // chartRow.style.width = "280mm";
  // chartRow.style.height = "120mm";

  chartContainerId.style.width = "100%";
  chartMan.chart.checkSize();
  await myTools.dummy(1000);
  debugger;
});

window.addEventListener("afterprint", (event) => {
  console.warn("After print");
  debugger;
  chartColumn.classList.remove("col-12");
  chartColumn.classList.add("col-10");
  bodyRow.style.height = "";
  bodyRow.style.width = "";
  bodyRow.classList.add("h-100");
  fileManager.container.style.display = "";
  header.style.display = "";
  chartContainerId.style.width = "100%";
  chartMan.chart.checkSize();
});
