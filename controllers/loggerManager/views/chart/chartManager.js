//- оскільки найменування регістрів в drawChart.js  не співпадають з loggerManager.regs
//- перейменовуємо їх + локалізуємо
//- змінна chartProps визначений в loggerCompact.pug
{
  let newRegs = {};
  for (const key in chartMan.props.regs) {
    if (Object.hasOwnProperty.call(chartMan.props.regs, key)) {
      const reg = chartMan.props.regs[key];
      newRegs[key] = {};
      const nReg = newRegs[key];
      nReg.id = reg.id;
      nReg.title = reg.header[lang];
      nReg.units = reg.units[lang];
      nReg.description = reg.comment[lang];
    }
  } // for (const key in chartProps)
  chartMan.props.registers = newRegs;
  chartMan.chart = new Chart(chartMan.containerId, chartMan.props);
  if (chartMan.realtime) {
    chartMan.chart.getCurrentData();
  }
}
