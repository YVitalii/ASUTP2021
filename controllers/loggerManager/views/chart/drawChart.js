// ---------------- class Chart (elementId,config) ---------------------------

// -----  addData(d)  - добавляет точку данных на график
// -----            d={
// -----              time: timestamp, // где timestamp - число милисекунд от 1970г = timestamp,  объект Data c отметкой времени для данных
// -----              1-T: 253, // текущие значения данных
// -----              2-T: 300
// -----              ....
// -----            }
// -----            Например: {time: 1612623935131, 1-T: 231, 2-T: 189}
// -----  getData() -
// -----  redraw ()  -  полностью перерисовывает график, без запроса таблицы данных, например изменение размеров поля
// -----  drawData() - отрисовывает таблицу данных
// -----  drawTask() - отрисовывает задание
// ----- 2021-09-08 ----- начал делать события мыши на графике с отображением текущих значений ---------------------

/** Класс выполняющий построение и отображение графика  */
class Chart {
  /** Конструктор инициализирует объект графика
   * @param {object} elementId - "#id" - обовязково решітка перед id контейнера (DOM - елемент div) в котором будет отображаться график
   * @param {object} config - объект с настройками (конфигурацией) графика
   * @param {string} config.logsUrl - корневая папка с файлами таблиц архивных данных,
   *                              этот URL должен быть в доступном для скачивания месте,как правило это каталог "/public"
   *                              Например:"/logs" **Внимание!!! Слеш в конце не ставить он добавляется автоматически !!!**
   * @param {string} config.logFileName: повне ім'я файлу таблиці даних, URL для запиту буде: config.logsUrl+config.logFileName
   * @param {string} config.regsUrl - посилання для отримання поточних значень регістрів, за цією адресою виконується post-запит
   * @param {string} config.tasksUrl - посилання для отримання поточного завдання
   * @param {string} config.pointsUrl - посилання для отримання поточних визначних точок процесу
   * @param {object} config.y         диапазон отображаемых значений по оси y (). Например: `y:{min:0,max:1000}`
   * @param {Number} config.y.min - минимальное значение по оси y ; например `0`
   * @param {Number} config.y.max - максимальное значение по оси y; например: максимально возможная температура в печи(Тномин+50С)
   * @param {object} config.registers - описание регистров
   * @param {string} config.registers.id - id регистра, точно такое же название какое используется в таблице архива .log *Например:* `"1-T"`
   * @param {string} config.registers.title - имя регистра, понятное для человека, используется как title  *Например:* `"T1"`
   * @param {string} config.registers.type - тип значения.*Например:* `"integer"` (пока не используется)
   * @param {string} config.registers.units - единицы измерения *Например:* `"*С"`
   * @param {string} config.registers.description - подробное описание регистра *Например:* `"Температура в верхней зоне"`
   * @param {string} config.registers.legend - используется для подписывания легенды в графике. Среднее по длине описание. *Например:* `"Зона№1.Верх.Задание"`
   */

  constructor(elementId, config) {
    this.ln = "chart()::";
    let trace = 1,
      ln = this.ln + "constructor()::";
    // создает объект графика и настраивает его основные свойства
    /** Задает диапазон цветов для линий графиков */
    this.colors = [
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#999999",
      "#427220",
      "#bba901",
      "#e5a77e",
      "#b76b4d",
      "#ad2815",
    ]; //список цветов для линий графиков
    /** Задает шкалу цветов для линий графиков */
    this.colorScale; // шкала цвета линий графиков
    /** Задает функцию масштабирования для оси **x** */
    this.xScale; // масштабирование по оси Х
    this.yScale; // масштабирование по оси Y
    this.data; // таблица с данными, потрібно розібратися як влаштовано
    // data = [{time, 1-tT:0, 1-T:100,…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, columns: ['time','1-tT','1-T', ...] ]
    // data.columns=["1-T","2-T"..]
    // data[0]=["{time: Tue Oct 15 2019 13:09:19 GMT+0300 (Восточная Европа, летнее время), T1: 74, T2: 79, T3: 82, T4: 78}"]
    this.points; // таблица реперных точек
    this.task; // таблица задач
    this.config = config; // конфигурационные настройки
    if (trace) {
      console.log(ln + `this.config`);
      console.dir(this.config);
    }
    this.tooltip; // всплывающая подсказка
    this.legend = {
      // легенда
      xScale: {}, //шкала по оси Х например: Т1,Т2,Т3...
      yScale: {}, //шкала по оси Y например: caption,value
    };
    this.registers = config.registers;
    this.period = config.period ? config.period : 10 * 1000;
    this.y = { min: -10, max: 50 }; // кордони по осі Y, для початку мінімальні - потім коригуються згідно отриманим даним в refreshTimeDomen
    // y.max,y.min - границы по оси 'y'
    // task - задача в виде {time:  ,y:  , dYmin:  , dYmax:   }
    // data:"/URL  " - ссылка на архив оперативных данных
    this.container = d3.select(elementId); // DOM контейнер для графика

    this.elementDOM = this.container.node(); // елемент DOM,ссылка на контейнер в DOM
    //console.log(this.elementDOM);
    this.margin = { top: 35, right: 40, bottom: 30, left: 55 }; // границы самого поля построения графика
    this.timeDomain = {
      // временная шкала графика:начало-конец, уточняется при получении данных из архива или задачи
      start: new Date(0), // now
      end: new Date(3 * 60 * 60 * 1000), // + now + 3 hour
    };

    this.client = {
      // запоминаем текущие размеры контейнера
      width: this.elementDOM.clientWidth,
      height: this.elementDOM.clientHeight,
    };

    // запускаем периодический опрос 1 раз/сек изменения размеров контейнера
    // для обнаружения изменившегося размера родительского элемента
    // и перерисовки графика с новыми размерами
    this.resizeTimer = setInterval(() => {
      // считываем предыдущие размеры контейнера
      let nowW = this.client.width;
      let nowH = this.client.height;
      // узнаем текущие размеры контейнера
      let newW = this.elementDOM.clientWidth;
      let newH = this.elementDOM.clientHeight;
      // проверяем на соответствие
      if (nowW != newW || nowH != newH) {
        // размеры контейнера изменились
        console.log(
          "nowW=" + nowW + ";nowH=" + nowH + ";newW=" + newW + ";newH=" + newH
        );
        // запоминаем новые размеры контейнера
        this.client.width = newW;
        this.client.height = newH;
        //перерисовываем график
        this.redraw();
      }
    }, 1000); //setInterval

    // запрашиваем данные
    this.getData();
  } // constructor

  /**
 * вызов функции приводит к загрузке браузером графика в виде изображения-svg
   имя файла рисунка: config.logFileName + ".svg"
   Пример вызова: document.getElementById("button_downloadSVG").onclick=() => {chart.loadSvg()};
*/

  loadSvg() {
    // вызов функции приводит к загрузке браузером графика в виде изображения-svg с именем fName
    let svgEl = this.svg._groups[0][0]; // svg - элемент DOM
    let name = this.config.logFileName + ".svg"; // имя файла
    let trace = 1,
      title = "saveSVG():";
    trace ? console.log(title, "---- Started ----") : null;
    trace ? console.log(title, "svgEl=", svgEl) : null;
    trace ? console.log(title, "fName=", name) : null;
    // устанавливаем атрибут пространства имен картинки svg
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // получаем код картинки
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  /**
   * Додає масив  точок на графік, та запамятовує їх в chart.data
   * @param {Object} d  - ={time:"08.04.2024, 13:26:59","T1:"15", "tT1":"101", ...}
   * @returns
   */
  addData(d) {
    // ------ добавляет данные к графику ---------
    // если данных нет (например еще не подгрузились), выход
    if (!d) {
      return;
    }
    // таблица данных еще не готова, выход, например еще не скачана с сервера
    if (!this.data.columns) {
      return;
    }
    //  --- настройки трасировщика ------------
    let trace = 0,
      lmsg = "addData:";
    trace ? console.log(lmsg + ":addData(", d, ")") : null;

    let data = this.data; // ссылка на данные для сокращения кода, что бы не писать везде this.
    let obj = {};
    for (var i = 1; i < data.columns.length; i++) {
      //берем с 1, т.к. 0 - время
      // перебираем все заголовки в таблице данных
      if (d[data.columns[i]]) {
        // если ключ=заголовку во входных данных имеется
        // определяем временную метку
        if (i == 1) {
          // в первой итерации берем timestamp у первого элемента, как общий для всех
          obj[data.columns[0]] = new Date(d[data.columns[0]]); //d[data.columns[0]]=d['time'];
        }
        // запамятовуємо значення для ключа
        let val = d[data.columns[i]];
        obj[data.columns[i]] = val;
        this.adjustYscale(val, true);
      } // if ( d[data.columns[i]] )
    } //for
    //если после обработки входящих данных нет отметки времени: т.е. объект -пустой - выход
    if (!obj.time) {
      return;
    }
    // лог
    trace ? console.log(lmsg + "time:" + obj.time.toLocaleString()) : null;
    trace ? console.log(lmsg + "Объект:" + JSON.stringify(obj)) : null;
    // добавляем данные в таблицу
    this.data.push(obj);
    // this.testYdomain(obj);
    // проверяем шкалу времени
    if (obj[data.columns[0]].getTime() >= this.timeDomain.end.getTime()) {
      //выходим за пределы шкалы, увеличиваем шкалу на 30 мин
      trace
        ? console.log(
            "Выход за пределы диапазона оси Х. Ось Х увеличена на 30 мин. oldLimit=" +
              this.timeDomain.end.toLocaleString()
          )
        : null;
      this.timeDomain.end = new Date(
        obj[data.columns[0]].getTime() + 30 * 60 * 1000
      );
      trace
        ? console.log(" newLimit=" + this.timeDomain.end.toLocaleString())
        : null;
      // запускаем перерисовку всего графика, дорисовывать нет смысла
      this.redraw();
      return; //выходим
    } //if
    // дорисовываем линии
    this.appendLine();
  } //addData(d)

  insertLegend() {
    // если данных еще нет - выходим
    if (!this.data.columns) {
      return;
    }
    // настройки трасировщика
    let trace = 0,
      logCaption = "insertLegend::";
    let fontSizeK = 0.8; // насколько меньше шрифт от высоты поля легенды
    // задаем отступы для области легенды
    let margin = {
      top: 2,
      right: 5,
      left: 5,
      bottom: 1,
    }; // margin
    // если трассировка включена - рисуем прямоугольник вокруг легенды
    trace
      ? this.rectang(
          this.xScale.range()[0],
          0,
          this.xScale.range()[1],
          this.margin.top,
          "grey"
        )
      : null;
    let headers = this.data.columns; // имена колонок данных
    // -------------  координата y  -------------------------------
    // вычисляем высоту (по Y) поля под легенду
    let yRange = [0, this.margin.top]; // границы поля по оси Y: от 0 до верхней кромки графика-поля
    yRange[0] = yRange[0] + margin.top;
    yRange[1] = yRange[1] - margin.bottom;
    let yHeight = yRange[1] - yRange[0]; // высота поля по оси Y
    trace
      ? console.log(
          logCaption +
            "yRange=" +
            JSON.stringify(yRange) +
            "; yHeight=" +
            yHeight
        )
      : null;
    let titleFontSizeK = 1; // относительная высота шрифта наименования регистра
    let descriptionFontSizeK = 0.7; // относительная высота шрифта описания регистра
    //вычисляем высоту шрифта
    this.legend.fontSize = parseInt(
      (yHeight - margin.top) / (titleFontSizeK + descriptionFontSizeK)
    );
    trace ? console.log(logCaption + "fontSize=" + this.legend.fontSize) : null;
    let ySteps = [
      yRange[0] + this.legend.fontSize / 2 + margin.top, //title
      yRange[0] +
        this.legend.fontSize +
        margin.top +
        (this.legend.fontSize * descriptionFontSizeK) / 2, //description
    ];
    this.legend.yScale = d3
      .scaleOrdinal()
      .domain(["title", "description"]) // диапазон заглавий
      .range(ySteps); // диапазон координат
    trace ? console.log(logCaption + "ySteps=" + JSON.stringify(ySteps)) : null;
    // -------------  координата х  -------------------------------
    let xRange = this.xScale.range(); // границы поля по оси Х
    // вычисляем ширину (по Х) поля под легенду вычитаем отступы
    xRange[0] = xRange[0] + margin.left;
    xRange[1] = xRange[1] - margin.right; //
    let xLength = xRange[1] - xRange[0]; // длина поля по оси Х
    trace
      ? console.log(
          logCaption +
            "xRange=" +
            JSON.stringify(xRange) +
            "; xLength=" +
            xLength
        )
      : null;
    //определяем центры ячеек по осиХ
    let xStep = parseInt(xLength / headers.length); // шаг надписей
    let xSteps = [];
    for (var i = 0; i < headers.length; i++) {
      xSteps.push(xRange[0] + xStep * (i + 0.5));
    }
    trace ? console.log(logCaption + "xSteps=" + JSON.stringify(xSteps)) : null;
    // определяем шкалы
    let xDomain = headers.slice(1, headers.length);
    xDomain.push(headers[0]);
    trace ? console.log(logCaption + "xDomain=" + xDomain) : null;
    this.legend.xScale = d3
      .scaleOrdinal()
      .domain(xDomain) // диапазон заглавий ["T1", "T2", "T3", "T4","time"]
      .range(xSteps); // диапазон координат

    // Пишем заглавия
    let g = this.svg.append("g").attr("id", "legend");
    this.legend.DOM = g.node(); // запоминаем в легенде
    // отводим поле под время
    g.append("text")
      .attr("id", "legend_" + headers[0])
      .attr("x", this.legend.xScale(headers[0]))
      .attr("y", yHeight / 2) //this.legend.yScale("title"))
      .attr("text-anchor", "middle")
      .attr("font-style", "italic")
      //.attr('fill', this.colorScale(headers[0]))
      .attr("font-weight", "bold")
      .attr("dominant-baseline", "central")
      .style("font-size", ` ${this.legend.fontSize * 0.8}px`)
      .text("");
    for (var i = 1; i < headers.length; i++) {
      g.append("text")
        .attr("id", "legend_" + i)
        .attr("x", this.legend.xScale(headers[i]))
        .attr("y", this.legend.yScale("title"))
        .attr("text-anchor", "middle")
        .attr("font-style", "italic")
        .attr("fill", this.colorScale(headers[i]))
        .attr("font-weight", "bold")
        .attr("dominant-baseline", "central")
        .style("font-size", ` ${this.legend.fontSize}px`)
        .text(
          this.registers[headers[i]].title
            ? this.registers[headers[i]].title
            : headers[i]
        );
      //.text(headers[i]);
      g.append("text")
        .attr("x", this.legend.xScale(headers[i]))
        .attr("y", this.legend.yScale("description"))
        .attr("text-anchor", "middle")
        .attr("font-style", "italic")
        .attr("fill", this.colorScale(headers[i]))
        .attr("dominant-baseline", "central")
        .style(
          "font-size",
          ` ${parseInt(this.legend.fontSize * descriptionFontSizeK)}px`
        )
        .text(
          this.registers[headers[i]].legend
            ? this.registers[headers[i]].legend
            : ""
        );
    } //for
  } // insertLegend

  legendAddValues(obj) {
    var trace = 0,
      title = "legendAddValues(obj):";
    trace ? console.log(title, "---- Started ---- obj=") : null;
    trace ? console.dir(obj) : null;
    // нет объекта
    var headers = this.data.columns; // имена колонок данных
    for (var i = 0; i < headers.length; i++) {
      let key = headers[i];
      let value = obj[key];
      trace
        ? console.log(title, "i=", i, "; key=", key, "; value=", value)
        : null;
      if (i == 0) {
        let text = "";
        try {
          text = value.toLocaleString();
          text = text.slice(-8).trim();
        } catch (e) {
        } finally {
          d3.select("#legend_" + key).text(text);
          trace ? console.log(title, "time=", text) : null;
          continue;
        }
      } //if ( i== 0 )
      let text = this.registers[headers[i]].title
        ? this.registers[headers[i]].title
        : headers[i];
      if (value || value == 0) {
        text += "=" + value + " °C";
      }
      let item = d3.select("#legend_" + i).text(text);
      trace ? console.log(title, "item=", item) : null;
    } //for
  }

  /**
   * Возвращает цвет линии для указанного регистра
   * @param {string} reg - физическое имя регистра в формате "1-T"
   * @return {string}  - undefined или код цвета в формате "#377eb8"
   */
  getColorRegister(reg) {
    var trace = 1,
      title = "getColorRegister(" + reg + "):";
    trace ? console.log(title, "---- Started ----") : null;
    let color = undefined;
    if (typeof reg != "string") {
      trace ? console.log(title, "return:color=", color) : null;
      return color;
    }
    for (var i = 0; i < this.data.columns.length; i++) {
      if (reg.trim() == this.data.columns[i]) {
        color = this.colorScale(this.data.columns[i]);
        trace ? console.log(title, "return:color=", color) : null;
        return color;
      }
    } // for
    trace ? console.log(title, "return:color=", color) : null;
    return color;
  } //getColorRegister

  /**
   * Возвращает цвета линий для указанного списка регистров
   * @param {string} reg - физическое имя регистров в формате "1-T; 2-Т; 3-Т"
   * @return {object}  - {"1-T": "#377eb8", "2-T": "#4daf4a",3-T: undefined}
   *
   */
  getColorsRegisters(reg) {
    var trace = 1,
      title = "getColorsRegisters(" + reg.toString() + "):";
    trace ? console.log(title, "---- Started ----") : null;
    let obj = {};
    if (typeof reg != "string") {
      return obj;
    }
    reg = reg.split(";"); //return this.getColorRegister(reg)
    for (var i = 0; i < reg.length; i++) {
      obj[reg[i]] = this.getColorRegister(reg[i]);
    } // for
    return obj;
  } // getColorsRegisters

  // -----------------------  appendLine() ----------------------
  appendLine() {
    // дорисовывает линии графиков до новой точки
    let trace = 0;
    let logCaption = "appendLine:";
    // рисуем линии по полученным данным
    let lastData = this.data[this.data.length - 2];
    let newData = this.data[this.data.length - 1];
    // якщо даних ще немає - вихід
    if (lastData == undefined) {
      return;
    }
    trace
      ? console.log(logCaption + "lastData=" + JSON.stringify(lastData))
      : null;
    trace
      ? console.log(logCaption + "newData=" + JSON.stringify(newData))
      : null;
    for (var i = 1; i < this.data.columns.length; i++) {
      let key = this.data.columns[i];
      let path = d3.path();
      path.moveTo(this.xScale(lastData.time), this.yScale(+lastData[key]));
      path.lineTo(this.xScale(newData.time), this.yScale(+newData[key]));
      trace ? console.log(logCaption + "path=" + path.toString()) : null;
      this.svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", this.colorScale(key))
        .attr("stroke-width", 1.5)
        .attr("d", path);
    }
  } // appendLine()

  rectang(x1, y1, x2, y2, color) {
    // рисует прямоугольник
    let path = d3.path();
    path.moveTo(x1, y1);
    path.lineTo(x2, y1);
    path.lineTo(x2, y2);
    path.lineTo(x1, y2);
    path.lineTo(x1, y1);
    this.svg
      .append("path")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 0.5)
      .attr("d", path);
  }

  /** делает загрузку таблицы данных по URL:  ${config.logsUrl}+"/"+${config.startData}+".log"
   *  Парсит и сохраняет в свойстве data
   *  Файл с данными должен быть в виде текстового файла с разделителями TAB="\t" (tsv-формат)
   *  первая строка описывает имена регистров, последующие - данные, например:
   *  ''' time 1-T 2-T 3-T \n
   *      2019-10-14T22:12:21	25	30	37 \n
   *      2019-10-14T22:17:11	32	38	41 '''
   * @return {null}  не возвращает ничего,
   */
  getData() {
    let trace = 0,
      ln = this.ln + "getData()::";
    trace ? console.log(ln, "----- Started -----") : null;
    //trace ? console.log(ln,):null;
    //------------------------  getData()  ------------------------
    // загрузка таблицы данных из сервера (логированных)
    let logURL = this.config.logsUrl + "/" + this.config.logFileName;
    trace ? console.log(ln + "Enter: logURL=" + logURL) : 0;
    d3.tsv(logURL, (dataLine, i) => {
      // получаем данные построчно dataLine, номер строки i
      trace ? console.log(ln, "i=" + i + " ;dataLine=") : null;
      trace ? console.dir(dataLine) : null;
      //перебираем все ключи в строке данных
      for (let key in dataLine) {
        // если свойство не собственное, а унаследовано - берем следующее
        if (!dataLine.hasOwnProperty(key)) continue;
        // если поле time или Время - преобразуем в дату
        if ((key == "time") | (key == "Время")) {
          trace ? console.log(ln + `dataLine[key]=${dataLine[key]}`) : null;
          dataLine[key] = new Date(dataLine[key]);
          continue; //next iteration}
        } //  if (key == "time")
        // поле не time, преобразуем в число
        let val = parseFloat(dataLine[key]);
        dataLine[key] = val;
        // за потреби коригуємо границі осі Y
        this.adjustYscale(val);
        //trace ? console.log(ln,"dataLine[",key,"]=",dataLine[key]):null;
      } //for (let key in dataLine)

      return dataLine;
    }).then((d) => {
      trace ? console.log(ln, "then(1):d=") : null;
      trace ? console.dir(d) : null;
      let columns = d.columns; //список столбцов ["time", "T1", "T2", "T3", "T4"]
      //создаем шкалу цвета. например  this.colorScale("T1")= '#e41a1c'
      this.colorScale = d3
        .scaleOrdinal()
        .domain(columns.slice(1, columns.length)) //["T1", "T2", "T3", "T4"]
        .range(this.colors.slice(0, columns.length - 1)); // диапазон цветов
      this.data = d;
      this.refreshTimeDomain();
      this.redraw();
    });
  } //getData

  //---- testYdomain -------------

  //-- line = {1-tT:200, 1-T:300, ... , time: Date }
  testYdomain(obj) {
    let trace = 0,
      ln = "testYdomain():";
    trace ? console.log(ln, "----- Started -----") : null;

    // таблиця данних ще не готова, вихід
    if (!this.data.columns) {
      trace ? console.log(ln, "----- Дані ще не готові. Вихід-----") : null;
      return;
    }

    // тут збираємо значення всіх регистрів
    let arr = [];

    // посилання для скорочення коду
    let columns = this.data.columns;

    // перебираємо всі регістри та збираємо їх значення в массив
    for (let i = 1; i < columns.length; i++) {
      //починаємо з 1 бо [0] = час
      const element = columns[i];
      if (obj[element]) {
        arr.push(obj[element]);
      }
    }
    trace ? console.log(ln, "arr=", arr) : null;
    // шукаємо мінімум/максимум
    let [yMin, yMax] = d3.extent(arr);
    // за потреби коригуємо границі осі Y
    this.adjustYscale(yMin);
    this.adjustYscale(yMax);
  }

  // змінює шкалу для осі Y
  adjustYscale(val, redraw = false) {
    let divider = 50;
    let trace = 0,
      ln = `"adjustYscale(${val}):"`;
    trace
      ? console.log(
          ln,
          `Started. Current limit are:  y.min=${this.y.min}; y.max=${this.y.max}.`
        )
      : null;
    let changed = false;
    if (val <= this.y.min) {
      // якщо нове значення менше за мінімум - коригуємо
      this.y.min = Math.round(val / divider) * divider - divider;
      changed = true;
    }

    if (val >= this.y.max - divider / 5) {
      // якщо нове значення більше за максимум - коригуємо
      this.y.max = Math.round(val / divider) * divider + divider;
      changed = true;
    }

    if (changed) {
      console.log(
        ln,
        `scaleY was adjusted to y.min=${this.y.min};y.max=${this.y.max};`
      );
      if (redraw) this.redraw();
    }
  }

  /**
  обновляет границы графика по массиву this.data. Определяет min и max и
  меняет физические границы this.timeDomain.start, this.timeDomain.end
*/
  refreshTimeDomain() {
    let trace = 1,
      logH = "refreshTimeDomain():";
    trace ? console.log(logH, "----- Started -----") : null;
    //trace ? console.log(logH,):null;
    // функция определяет и запоминает границы диапазона времени данных
    if (!this.data) {
      trace ? console.log(logH, "this.data=undefined") : null;
      return;
    }
    // определяем минимум и максимум в массиве
    let lim = d3.extent(this.data, (d) => {
      return d.time;
    });
    trace ? console.log(logH, "d3.exten=", lim.toString()) : null;
    let [xMin, xMax] = lim;
    trace ? console.log(logH, " xMin=[" + xMin + ", xMax=" + xMax + "]") : null;
    xMin = xMin ? xMin : this.timeDomain.start; // если минимум не определен, то берем из настроек
    this.timeDomain.start = xMin; // запоминаем новый минимум
    xMax = xMax ? xMax : this.timeDomain.end; // если максимум не определен, то берем из настроек
    this.timeDomain.end = xMax; // запоминаем новый максимум
    trace
      ? console.log(
          logH,
          "this.timeDomain={start:" + xMin + ", end:" + xMax + "]"
        )
      : null;
  }

  trimData(start, end) {
    // обрезает данные графика

    // определяем новые границы
    this.refreshTimeDomain();
    this.redraw();
  }

  drawData() {
    // отрисовывает таблицу данных

    if (!this.data) {
      return;
    } // если данных нет - выход
    // рисуем линии для каждого столбца
    let d = this.data;
    let columns = d.columns;
    for (var i = 1; i < columns.length; i++) {
      // нулевой столбец time
      let colName = columns[i];
      this.svg
        .append("path")
        .datum(d)
        .attr("fill", "none")
        .attr("stroke", this.colorScale(colName))
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          d3
            .line()
            .x((d) => {
              return this.xScale(d.time);
            })
            .y((d) => {
              return this.yScale(d[colName] < 0 ? 0 : d[colName]);
            })
        );
    } //for (var i = 1; i < columns.length; i++)
  } //drawData

  line(x1, y1, x2, y2, color) {
    // рисует диагональную линию (для поля графика)
    this.svg
      .append("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("stroke", "red")
      .attr("stroke-width", 1.5);
  }

  redraw() {
    let trace = 0,
      logH = "redraw():";
    // полностью перерисовывает график
    // console.log("this.elementDOM.innerHTML:");
    // console.log(this.elementDOM.innerHTML);
    this.elementDOM.innerHTML = ""; //удаляем svg
    // console.log("this.elementDOM.innerHTML");
    // console.log(this.elementDOM.innerHTML);
    // console.log("this.container");
    this.svg = this.container.append("svg"); // создаем поле для графика
    //console.log(this.container);
    // console.log(this.svg);

    // вычисляет размеры поля графика, строит оси и сетку
    this.width = this.elementDOM.clientWidth; // ширина клиента
    this.height = this.elementDOM.clientHeight; //высота клиента
    // указываем размеры для svg
    this.svg.attr("width", this.width).attr("height", this.height);
    // Масштабирование
    // масштаб по оси x

    this.xScale = d3
      .scaleTime()
      .domain([this.timeDomain.start, this.timeDomain.end]) // диапазон времени
      .range([this.margin.left, this.width - this.margin.right]); //поле графика

    let everyXpixels = 20; // мітка кожні everyXpixels пікселів
    let xTicksNumber =
      (this.xScale.range()[1] - this.xScale.range()[0]) / everyXpixels;
    this.xScale.nice(xTicksNumber);
    // ---------------   рисуем задание, т.к. оно затем затирает сетку
    this.drawTask();

    //------------- рисуем ось Х ---------------
    let xBoldLine = 6; // кожну xBoldLine буде виводитися мітка та жирна лінія
    // let minutes =
    //   (((this.xScale.domain()[1] - this.xScale.domain()[0]) /
    //     (this.xScale.range()[1] - this.xScale.range()[0])) *
    //     everyXpixels) /
    //   1000 /
    //   60; // вираховуємо приблизну кількість хвилин / мітку
    // let roundMinutes = 10;
    // minutes = Math.round(minutes / roundMinutes + 0.5) * roundMinutes; // округлюємо з точністю 10 хв

    /* let t =
      (chart.xScale.domain()[1] - chart.xScale.domain()[0]) /
      (chart.xScale.range()[1] - chart.xScale.range()[0]); */
    let xTicks = (this.xAxis = d3
      .axisBottom()
      .scale(this.xScale)
      .ticks(xTicksNumber) //d3.timeMinute.every(minutes)
      .tickSize([-(this.height - this.margin.top - this.margin.bottom)])
      .tickSizeOuter(10)
      .tickFormat((d, i) => {
        //console.log("tickFormat.d["+i+"]="+d.toLocaleString());
        let label = isPair(i, xBoldLine)
          ? ("0" + d.getHours()).slice(-2) +
            ":" +
            ("0" + d.getMinutes()).slice(-2)
          : null;
        return label;
      })); //tickFormat

    this.svg
      .append("g")
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`) //переносим 0,0 оси в нижнюю часть графика
      .call(this.xAxis)
      .call((g) =>
        g
          .selectAll(".tick line") //ищем все линии на оси
          .attr("stroke-opacity", (d, i) => {
            //для кожної 5 мітки малюємо жирну лінію , всі інші - напівпрозорі;
            return isPair(i, xBoldLine) ? 0.7 : 0.3;
          }) //непрозрачность
          .attr("stroke-dasharray", (d, i) => {
            // если отметка "час" линия "7,2" иначе  "2,3"
            let rest = isPair(i, xBoldLine) ? "7,2" : "2,3";
            return rest;
          })
      )
      .call(
        (g) =>
          g
            .selectAll(".tick text") // для всех текстовых меток
            .attr("font-size", "14") //увеличиваем размер шрифта
            .attr("y", "14") //смещаем шрифт вниз
      ); //call

    ///------------- рисуем ось У ---------------

    let yTickEveryPixes = 10; //кожні пікселей  повинна бути  мітка

    // масштаб по оси y
    this.yScale = d3
      .scaleLinear()
      .domain([this.y.min, this.y.max]) //диапазон температур
      .range([this.height - this.margin.bottom, this.margin.top]);

    this.yAxis = d3
      .axisLeft()
      .scale(this.yScale)
      //.ticks(Math.round(this.config.y.max / 50)) // метки каждые 50*С
      .ticks(
        Math.round(
          (this.yScale.range()[0] - this.yScale.range()[1]) / yTickEveryPixes
        )
      )
      .tickSize([-(this.width - this.margin.left - this.margin.right)]) //длина метки, = вся длина графика
      .tickSizeOuter(0) // длина метки крайних точек шкалы (минимум и максимум)
      .tickFormat((d, i) => {
        //для кожної 5 мітки пишемо підпис , всі інші -пропускаємо;
        return isPair(i, 5) ? `${d}` : null;
      }); //yAxis
    this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(this.yAxis)
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke-opacity", (d, i) => {
            //для кожної 5 мітки малюємо жирну лінію , всі інші - напівпрозорі;
            return isPair(i, 5) ? 0.7 : 0.3;
          }) //0.5)
          .attr("stroke-dasharray", (d, i) => {
            //console.log("d="+d.toLocaleString()+" ;i="+i);
            //для кожної 5 мітки малюємо пунктирну лінію , всі інші - крапками;
            return isPair(i, 5) ? "7,2" : "2,3";
          })
      )
      .call(
        (g) =>
          g
            .selectAll(".tick text") // для всех текстовых меток
            .attr("font-size", "14") //увеличиваем размер шрифта
      ); //call

    //this.line();
    // -------- настройка событий ---------------
    this.eventsInit(this.svg);
    // -------- отрисовка графика -----------------
    this.drawData();
    // -------- отрисовка легенды -----------------
    this.insertLegend();
  } // redraw

  eventsInit(svg) {
    // --- настройки логирования ----
    let trace = 0;
    let title = "eventsInit():";
    trace ? console.log(title, "Started") : null;
    // --- работа --------
    // добавляем группу легенда
    this.tooltip = svg.append("g");
    //trace ? console.log(title): null;
    svg.on("touchmove mousemove", () => {
      //trace ? console.log(title,"event.clientX=",d3.event.clientX) : null;
      trace
        ? console.log(title, "d3.pointer(event,svg)=", d3.pointer(event))
        : null;
      let dataPoint;
      try {
        dataPoint = this.bisect(d3.pointer(event)[0]);
      } catch (error) {
        // точок ще немає, виходимо
        //console.error(error);
        return;
      }

      trace ? console.log(title, "dataPoint=", dataPoint) : null;
      //console.log("Mouse position: x=",mouse);//[0],"y=",mouse[1]
      let time = dataPoint.time;
      let x = this.xScale(dataPoint.time); // позиция линии по координате х
      let y_top = this.yScale(this.y.max * 1); //this.yScale(this.config.y.max * 1); // верх линии по y
      let y_bottom = this.yScale(this.y.min * 0.98); // низ линии по y
      this.tooltip
        .attr("transform", `translate(${x},${y_top})`)
        .style("display", null)
        .style("pointer-events", "none");
      // --- настраиваем путь  ------------
      const path = this.tooltip
        .selectAll("path")
        .data([null])
        .join("path")
        .attr("fill", "white")
        .attr("stroke", "red")
        .attr("stroke-width", "3")
        .attr("stroke-opacity", "0.4");
      // --- рисуем линию

      path.attr("d", `M 0 0 v ${y_bottom - y_top}`);
      //trace ? console.log(title,"g=",g) : null;//console.log("g=",g);
      // --- выводим заначения в легенду
      this.legendAddValues(dataPoint);
    });
    svg.on("touchend mouseleave", () => {
      this.tooltip.style("display", "none");
      this.legendAddValues({});
    });
  } //eventsInit(svg)

  //   callout (g, dataPoint) {
  //     // --- настройки логирования ----
  //     let trace=0; let title="callout("+"):";
  //     trace ? console.log(title,"--- Started ---") : null;
  //
  //   //if (!dataPoint) return g.style("display", "none");
  //   //trace ? console.log(title,"dataPoint= ", dataPoint) : null;
  //
  //   //console.log("value=",value);
  //   //trace ? console.log(title,"g=",g) : null;//console.log("g=",g);
  //   g
  //       .style("display", null)
  //       .style("pointer-events", "none")
  //       .style("font", "10px sans-serif");
  //   //trace ? console.log(title,"g=",g) : null;//console.log("g=",g);
  //   const path = g.selectAll("path")
  //     .data([null])
  //     .join("path")
  //       .attr("fill", "white")
  //       .attr("stroke", "black");
  //   //trace ? console.log(title,"g=",g) : null;//console.log("g=",g);
  //   //let value = "";
  //   // const text = g.selectAll("text")
  //   //   .data([null])
  //   //   .join("text")
  //   //   .call(text => text
  //   //     .selectAll("tspan")
  //   //     .data(( value + "").split(/\n/))
  //   //     .join("tspan")
  //   //       .attr("x", 0)
  //   //       .attr("y", (d, i) => `${i * 1.1}em`)
  //   //       .style("font-weight", (_, i) => i ? null : "bold")
  //   //       .text(d => d));
  //   //
  //   // const {x, y, width: w, height: h} = text.node().getBBox();
  //   //
  //   // text.attr("transform", `translate(${-w / 2},${15 - y})`);
  //   //console.log("d=",`M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
  //   //path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
  //   // let x= this.xScale(dataPoint.time);//this.config.y.min,
  //   // let y_top= this.yScale (this.config.y.max * 0.95)
  //   // let y_bottom= this.yScale (this.config.y.min * 1.05)
  //   // path.attr("d", `M${x},${y_top}v${y_bottom-y_top}`);
  //   // trace ? console.log(title,"g=",g) : null;//console.log("g=",g);
  // }
  //
  //   /* функция возвращает  данные для текущего положения курсора
  //      mx -  координата х курсора
  //   */
  bisect(mx) {
    // --- настройки логирования ----
    let trace = 0;
    let title = "bisect(" + mx + "):";
    trace ? console.log(title, "------------ \\n", "Started") : null;
    // делаем функцию-бисектрису для определения данных по положению курсора
    const bisect = d3.bisector((d) => d.time).left;
    // определяем текущую дату по положению [x] курсора
    const date = this.xScale.invert(mx);
    trace ? console.log(title, "date=", date) : null;
    // находим ближайший к текущей дате индекс в массиве
    const index = bisect(this.data, date, 1);
    trace ? console.log(title, "index=", index) : null;
    // получаем данные слева и справа от текущей даты
    const a = this.data[index - 1]; // слева
    const b = this.data[index] ? this.data[index] : a; // справа
    const nearby = date - a.time > b.time - date ? b : a; // ищем наиболее близкое к текущему значение
    trace ? console.log(title, "nearby=", nearby) : null;
    // возвращаем его
    return nearby; // b && (date - a.date > b.date - date) ? b : a; - было так, так и не понял зачем; && - возвращает или последнее значение или первое ложное
  }

  drawTask() {
    // --- отрисовка заданной программы ----------
    let trace = 1,
      logH = "drawChart()::" + " drawTask()" + "::";
    trace ? console.log(logH + "Task:") : 0;
    trace ? console.log(this.task) : 0;
    // -----  отрисовывает задание
    // --------------------------
    // проверяем наличие задания:
    if (!this.task) {
      return; // если нет - выход
    }
    //console.log(this.xScale("2019-11-02T18:20:00"));
    // рисуем доверительный интервал
    this.svg
      .append("path")
      .datum(this.task) // данные
      .attr("fill", "#f0f8ff") //"#bbe5df
      .attr("stroke", "none")
      .attr(
        "d",
        d3
          .area()
          .x((d) => {
            return this.xScale(d.time);
          })
          .y0((d) => {
            return this.yScale(d.y + d.dYmax);
          })
          .y1((d) => {
            if (d.dYmin) {
              return this.yScale(d.y + d.dYmin);
            }
            return this.yScale(0);
          })
      );
    this.svg
      .append("path")
      .datum(this.task)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr(
        "d",
        d3
          .line()
          .x((d) => {
            return this.xScale(d.time);
          })
          .y((d) => {
            return this.yScale(d.y);
          })
      );
  } //drawTask()*/

  getTasks() {
    this.task = null;
    let fName = this.config.logFileName + ".tsk";
    let trace = 1,
      logH = "drawChart()::" + "loadTask()" + "::";
    trace
      ? console.log(
          logH + "Request task from server:" + this.config.taskURL + "/" + fName
        )
      : 0;
    trace ? console.log(logH + "this.config=") : 0;
    trace ? console.log(this.config) : 0;
    if (!this.config.logFileName) {
      trace
        ? console.log(logH + "Reject: fName=" + this.config.logFileName)
        : 0;
      return; // если нет - выход
    }

    // $.ajax({
    //   method: "POST",
    //   url: this.config.taskURL,
    //   data: { fName: fName },
    //   success: (msg) => {
    //     trace ? console.log(logH + "Tasks:  ") : null;
    //     trace ? console.log(msg.d) : null;
    //     let task = msg.d;
    //     if (!task) {
    //       return;
    //     }
    //     for (var i = 0; i < task.length; i++) {
    //       console.log(task[i].time);
    //       task[i].time = new Date(task[i].time);
    //     }
    //     let t = new Date(task[0].time.getTime());
    //     this.timeDomain.start = timeRoundDown(t);
    //     this.timeDomain.end = task[task.length - 1].time;

    //     this.task = task;
    //   },
    // }); //$.ajax
  } //loadData()*/
  resize() {
    // let value = this.data[0].time;
    // console.log("resize");
    // console.log({value});
    this.timeDomain.start = timeRoundDown(this.data[0].time);
    this.timeDomain.end = timeRoundDown(this.data[this.data.length - 2].time);
  }
  /**
   * перезавантажує інформацію з нового файлу fileName
   * @param {String} fileName
   */
  reload(fileName) {
    let trace = 0,
      logH = "drawChart()::" + "reload()" + "::";
    trace ? console.log(logH + "Enter") : 0;
    this.config.logFileName = fileName;
    this.getTasks();
    this.getData();

    //setTimeout(this.redraw.bind(this),15000);
  }
  /**
   * Запуск автоматичного опитування та побудови поточних значень
   */
  async start() {
    let trace = 0,
      ln = this.ln + "start()::";
    let url = this.config.regsUrl;
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(this.data.columns),
    });

    if (response.ok) {
      let result = await response.text();
      //trace ? console.log(ln + `result=${result}`) : null;
      let array = result.split("\t");
      let d = {};
      for (let i = 0; i < array.length; i++) {
        const element = array[i].trim();
        d[this.data.columns[i]] = i == 0 ? element : parseFloat(element);
      } // for
      if (trace) {
        console.log(ln + `result= ${result}; d=`);
        console.dir(d);
      }
      this.addData(d);
    }
    setTimeout(() => {
      this.start();
    }, this.period);
  } //async start() {
} //class

// ---------  вспомогательные функции ------------
function isPair(i, m = 2) {
  // true якщо i - ділиться на m без залишку
  let j = i - Math.round(i / m) * m;
  return j == 0;
}

function timeRoundDown(time) {
  // округляет время по нижнему пределу с точностью 30 мин
  // например если 12:10 то будет 12:00; если 12:50 то будет 12:30
  time.setMinutes(time.getMinutes() < 30 ? 0 : 30);
  time.setSeconds(0);
  return time;
}
