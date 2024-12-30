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
  // TODO Опис регістрів береться з налаштувань поточного логера, але якщо в лог файлі існує стовпчик опису
  //  регістру що відсутній в поточному логері - помилка
  // наприклад в лог-файлі записані регістри tT,T1,T2, потім я прибрав регістр Т1 з поточного логера,
  // наразі опис для регістра Т1 - не існує - і виникає помилка при відображенні легенди регістрів Т1 та Т2
  // як варіант вирішення проблеми, наприклад  - зберігати опис регістрів в файлі з програмою та брати їх звідти
  chartMan.props.registers = newRegs;
  chartMan.chart = new Chart(chartMan.containerId, chartMan.props);
  if (chartMan.realtime) {
    chartMan.chart.getCurrentData();
  }
}
