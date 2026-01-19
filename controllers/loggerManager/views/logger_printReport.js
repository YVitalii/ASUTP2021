window.addEventListener("beforeprint", async (event) => {
  // console.warn("Before print");
  //debugger;
  header.style.display = "none";
  fileManager.container.style.display = "none";
  bodyRow.classList.remove("h-100");
  bodyRow.style.height = "170mm";
  bodyRow.style.width = "280"; //"280mm";
  chartColumn.classList.remove("col-10");
  chartColumn.classList.add("col-12");
  reportHeader.classList.remove("d-none");
  reportSignature.classList.remove("d-none");
  // ------ коригування на вимогу замовника -----------
  description___description.getElementsByTagName("label")[0].innerHTML =
    `<i>Назва програми: <b>${tasksName.innerHTML}</b></i>`;
  programHeader
    .getElementsByClassName("col-3")[0]
    .firstChild.classList.add("d-none");

  // chartRow.style.width = "280mm";
  // chartRow.style.height = "120mm";

  chartContainerId.style.width = "100%";
  chartMan.chart.checkSize();
  await myTools.dummy(1000);
  // debugger;
});

window.addEventListener("afterprint", (event) => {
  // console.warn("After print");
  //debugger;
  chartColumn.classList.remove("col-12");
  chartColumn.classList.add("col-10");
  bodyRow.style.height = "";
  bodyRow.style.width = "";
  bodyRow.classList.add("h-100");
  fileManager.container.style.display = "";
  header.style.display = "";
  // ----------
  description___description.getElementsByTagName("label")[0].innerHTML =
    `<i>Примітки:</i>`;
  programHeader
    .getElementsByClassName("col-3")[0]
    .firstChild.classList.remove("d-none");

  reportHeader.classList.add("d-none");
  reportSignature.classList.add("d-none");
  chartContainerId.style.width = "100%";
  chartMan.chart.checkSize();
});
