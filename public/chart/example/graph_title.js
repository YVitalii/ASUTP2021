chart = {

  const svg = d3.select(DOM.svg(width, height))
      .style("-webkit-tap-highlight-color", "transparent")
      .style("overflow", "visible") //По умолчанию. Содержимое не обрезается, может отображаться снаружи блока, в котором оно расположено.


  svg.append("g")
      .call(xAxis); // рисует ось Х

  svg.append("g")
      .call(yAxis); // рисует ось Y

  svg.append("path") // отрисовывает график
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

  const tooltip = svg.append("g"); // добавляєм группу в которой будут отображаться текущие значения

  svg.on("touchmove mousemove", function(event) {
    //d3.pointer(event, this)[0] - передает координату х в функцию bisect
    // по положению курсора находим текущее значение в таблице данных
    const {date, value} = bisect(d3.pointer(event, this)[0]);
    tooltip
        .attr("transform", `translate(${x(date)},${y(value)})`)
        .call(callout, `${formatValue(value)}${formatDate(date)}`);
  });

  svg.on("touchend mouseleave", () => tooltip.call(callout, null));

  return svg.node();
}
 /* функция возвращает  данные для текущего положения курсора
    mx -  координата х
 */
function bisect(mx)  {
  // делаем функцию-бисектрису для определения данных по положению курсора
  const bisect = d3.bisector(d => d.date).left;
  return mx => {
    // определяем текущую дату по положению курсора
    const date = x.invert(mx);
    // находим ближайший к текущей дате индекс в массиве
    const index = bisect(data, date, 1);
    // получаем данные слева и справа от текущей даты
    const a = data[index - 1]; // слева
    const b = data[index]; // справа
    const nearby = (date - a.date > b.date - date) ? b : a; // ищем наиболее близкое к текущему значение
    // возвращаем его
    return nearby // b && (date - a.date > b.date - date) ? b : a; - было так, так и не понял зачем; && - возвращает или последнее значение или первое ложное
  };
}


const callout =  (value) => {
  // если данных нет - отключаем отображение
  if (!value) return g.style("display", "none");
  //console.log("value=",value);
  g
      .style("display", null) // display = inline (по default)
      .style("pointer-events", "none") //отключаем события мыши на tooltip
      .style("font", "10px sans-serif"); // описываем шрифт

  const path = g.selectAll("path") // выбираем все пути (пока нет)
    .data([null]) // данных нет
    .join("path") // добавляем новый путь
      .attr("fill", "white") // заполнить белым
      .attr("stroke", "black"); // рамка черная

  const text = g.selectAll("text") // выбираем текст
    .data([null]) // данных нет
    .join("text") // добавляем текст
    .call(text => text // вызываем стрелочную функцию, которая возвращает настроенный текст
      .selectAll("tspan") // выбираем подтекст
      .data((value + "").split(/\n/)) // преобразуем value в текст и разбиваем в массив по \n
      .join("tspan") // определяем подтекст
        .attr("x", 0) // координата х
        .attr("y", (d, i) => `${i * 1.1}em`) // координата у
        .style("font-weight", (_, i) => i ? null : "bold") // если номер текущего элемента i==0, то текст жирный, иначе нет
        .text(d => d)); //вставляем текст данных
  // получаем вычисленные размеры первого элемента text
  const {x, y, width: w, height: h} = text.node().getBBox();
  // перемещаем нулевую точку в -ширина/2 и на 15 мм ниже
  text.attr("transform", `translate(${-w / 2},${15 - y})`);
  // рисуем рамку-выноску вокруг текста
  /* M-39.1328125,5H-5l5,-5l5,5H39.1328125v42h-78.265625z:
  M -39.1328125, 5 //перо в координаты х,y (точка данных)
  H -5 / горизонтальная линия на 5 влево, отступаем для язычка
  l 5 , -5  //язычек лево
  l 5 , 5   //язычек право
  H 39.1328125 // горизонтально +39
  v 42 // вертикально + 42
  h -78.265625 // горизонтально -78
  z // замкнуть
  */
  path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
}
