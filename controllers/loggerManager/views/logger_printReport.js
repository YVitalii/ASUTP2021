let printViewBackup = null;

function rememberPrintView() {
  if (printViewBackup) return;
  printViewBackup = {
    headerDisplay: header.style.display,
    fileManagerDisplay: fileManager.container.style.display,
    bodyRowClass: bodyRow.className,
    chartColumnClass: chartColumn.className,
    chartWidth: chartContainerId.style.width,
    chartHeight: chartContainerId.style.height,
    chartFlex: chartContainerId.style.flex,
    chartRowClass: chartRow.className,
    chartRowWidth: chartRow.style.width,
    chartRowHeight: chartRow.style.height,
    columnHeight: chartColumn.style.height,
    columnMaxHeight: chartColumn.style.maxHeight,
    notesLabel:
      description___description.getElementsByTagName("label")[0].innerHTML,
    chartMargin: Object.assign({}, chartMan.chart.margin),
  };
}

function pxPerMm() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;height:100mm;visibility:hidden;";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height / 100;
  probe.remove();
  return px || 96 / 25.4;
}

function showDescriptionAsText() {
  const textarea = description___description.querySelector("textarea");
  if (!textarea) return;
  let text = description___description.querySelector(".print-description");
  if (!text) {
    text = document.createElement("div");
    text.className = "print-description";
    textarea.insertAdjacentElement("afterend", text);
  }
  text.textContent = textarea.value;
  textarea.style.setProperty("display", "none", "important");
}

function restoreDescriptionField() {
  const textarea = description___description.querySelector("textarea");
  const text = description___description.querySelector(".print-description");
  if (textarea) textarea.style.removeProperty("display");
  if (text) text.remove();
}

function fitChartToPrintPage() {
  chartColumn.classList.remove("h-100");
  chartRow.classList.remove("h-75");
  chartColumn.style.setProperty("display", "flex", "important");
  chartColumn.style.setProperty("flex-direction", "column", "important");
  chartColumn.style.setProperty("height", "198mm", "important");
  chartColumn.style.setProperty("max-height", "198mm", "important");
  chartColumn.style.setProperty("overflow", "hidden", "important");
  chartColumn.style.setProperty("width", "100%", "important");
  chartColumn.style.setProperty("max-width", "281mm", "important");
  chartRow.style.setProperty("flex", "1 1 auto", "important");
  chartRow.style.setProperty("min-height", "0", "important");
  chartRow.style.setProperty("height", "auto", "important");
  chartRow.style.setProperty("width", "100%", "important");

  const legend = chartContainerId.nextElementSibling;
  chartContainerId.style.setProperty("flex", "none", "important");
  chartContainerId.style.setProperty("width", "100%", "important");
  chartContainerId.style.setProperty("height", "0px", "important");
  void chartColumn.offsetHeight;

  const mm = pxPerMm();
  const legendHeight = Math.max(legend ? legend.offsetHeight : 0, 6 * mm);
  let chartHeight = chartRow.clientHeight - legendHeight;
  const pageWidthPx = 281 * mm;
  let chartWidth = Math.min(
    chartContainerId.clientWidth || pageWidthPx,
    pageWidthPx
  );
  chartMan.chart.margin.bottom = 52;
  if (chartHeight < 80) {
    const signatureStyle = getComputedStyle(reportSignature);
    const signatureMargin =
      parseFloat(signatureStyle.marginTop) +
      parseFloat(signatureStyle.marginBottom);
    const headerBlock = Math.max(
      reportHeader.offsetHeight + programHeader.offsetHeight,
      28 * mm
    );
    const footerBlock = Math.max(
      reportSignature.offsetHeight + signatureMargin,
      12 * mm
    );
    chartHeight = 198 * mm - headerBlock - footerBlock - legendHeight;
  }
  if (chartWidth < 80) chartWidth = pageWidthPx;
  chartContainerId.style.setProperty("width", chartWidth + "px", "important");
  chartContainerId.style.setProperty("max-width", "100%", "important");
  chartContainerId.style.setProperty(
    "height",
    Math.max(chartHeight, 80) + "px",
    "important"
  );
  chartMan.chart.redraw();
}

function restorePrintView() {
  if (!printViewBackup) return;
  restoreDescriptionField();
  header.style.display = printViewBackup.headerDisplay;
  fileManager.container.style.display = printViewBackup.fileManagerDisplay;
  bodyRow.className = printViewBackup.bodyRowClass;
  chartColumn.className = printViewBackup.chartColumnClass;
  chartRow.className = printViewBackup.chartRowClass;
  ["height", "max-height", "display", "flex-direction", "overflow", "width", "max-width"].forEach(
    (name) => chartColumn.style.removeProperty(name)
  );
  ["height", "width", "flex", "min-height"].forEach((name) =>
    chartRow.style.removeProperty(name)
  );
  ["height", "width", "max-width", "flex"].forEach((name) =>
    chartContainerId.style.removeProperty(name)
  );
  chartContainerId.style.width = printViewBackup.chartWidth;
  chartContainerId.style.height = printViewBackup.chartHeight;
  chartContainerId.style.flex = printViewBackup.chartFlex;
  chartRow.style.width = printViewBackup.chartRowWidth;
  chartRow.style.height = printViewBackup.chartRowHeight;
  chartColumn.style.height = printViewBackup.columnHeight;
  chartColumn.style.maxHeight = printViewBackup.columnMaxHeight;
  description___description.getElementsByTagName("label")[0].innerHTML =
    printViewBackup.notesLabel;
  programHeader
    .getElementsByClassName("col-3")[0]
    .firstChild.classList.remove("d-none");
  reportHeader.classList.add("d-none");
  reportSignature.classList.add("d-none");
  Object.assign(chartMan.chart.margin, printViewBackup.chartMargin);
  printViewBackup = null;
  chartMan.chart.client.width = 0;
  chartMan.chart.checkSize();
}

window.addEventListener("beforeprint", (event) => {
  rememberPrintView();
  header.style.display = "none";
  fileManager.container.style.display = "none";
  bodyRow.classList.remove("h-100");
  chartColumn.classList.remove("col-10");
  chartColumn.classList.add("col-12");
  reportHeader.classList.remove("d-none");
  reportSignature.classList.remove("d-none");
  description___description.getElementsByTagName("label")[0].innerHTML =
    `<i>Назва програми: <b>${tasksName.innerHTML}</b></i>`;
  programHeader
    .getElementsByClassName("col-3")[0]
    .firstChild.classList.add("d-none");
  showDescriptionAsText();
  fitChartToPrintPage();
});

window.addEventListener("afterprint", (event) => {
  restorePrintView();
});
