/**
 * Будує графік з logger.txt і відкриває його в браузері.
 * Запуск: node ./controllers/PID/tests/PID_plot_logger.js [шлях/до/logger.txt]
 */
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const logPath = path.resolve(
  process.argv[2] || path.join(__dirname, "logger.txt")
);
const htmlPath = path.join(
  path.dirname(logPath),
  path.basename(logPath, path.extname(logPath)) + "_plot.html"
);

if (!fs.existsSync(logPath)) {
  console.error("Немає файлу:", logPath);
  console.error("Спочатку: node ./controllers/PID/tests/PID_createGraph_test.js");
  process.exit(1);
}

const raw = fs.readFileSync(logPath, "utf8").trim().split(/\r?\n/);
const header = raw[0].split("\t");
const rows = raw.slice(1).map((line) => line.split("\t"));

const col = (name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`Немає колонки "${name}" у ${logPath}`);
  return i;
};

const iTime = col("Time");
const iTf = col("Tf");
const iOut = col("PID.output%");
const iQp = col("PID.qp%");
const iQi = col("PID.qi%");
const iQd = col("PID.qd%");

const labels = rows.map((r) => Number(r[iTime]));
const series = {
  Tf: rows.map((r) => Number(r[iTf])),
  output: rows.map((r) => Number(r[iOut])),
  qp: rows.map((r) => Number(r[iQp])),
  qi: rows.map((r) => Number(r[iQi])),
  qd: rows.map((r) => Number(r[iQd])),
};

const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>PID logger plot</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 16px; background: #111; color: #eee; }
    h1 { font-size: 1.1rem; font-weight: 600; }
    .wrap { max-width: 1200px; margin: 0 auto; }
    canvas { background: #1a1a1a; border-radius: 8px; padding: 8px; }
    .meta { color: #aaa; font-size: 0.85rem; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>PID + Furnace — ${path.basename(logPath)}</h1>
    <p class="meta">${rows.length} точок · ${logPath.replace(/\\/g, "/")}</p>
    <canvas id="c" height="120"></canvas>
  </div>
  <script>
    const labels = ${JSON.stringify(labels)};
    const series = ${JSON.stringify(series)};
    new Chart(document.getElementById("c"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Tf °C",
            data: series.Tf,
            borderColor: "#f59e0b",
            backgroundColor: "transparent",
            yAxisID: "yT",
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: "output %",
            data: series.output,
            borderColor: "#22c55e",
            backgroundColor: "transparent",
            yAxisID: "yP",
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 1.5,
          },
          {
            label: "qp %",
            data: series.qp,
            borderColor: "#38bdf8",
            backgroundColor: "transparent",
            yAxisID: "yP",
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 1,
          },
          {
            label: "qi %",
            data: series.qi,
            borderColor: "#a78bfa",
            backgroundColor: "transparent",
            yAxisID: "yP",
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 1,
          },
          {
            label: "qd %",
            data: series.qd,
            borderColor: "#f472b6",
            backgroundColor: "transparent",
            yAxisID: "yP",
            tension: 0.15,
            pointRadius: 0,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            title: { display: true, text: "Time, s", color: "#aaa" },
            ticks: { color: "#888", maxTicksLimit: 12 },
            grid: { color: "#2a2a2a" },
          },
          yT: {
            type: "linear",
            position: "left",
            title: { display: true, text: "Tf, °C", color: "#f59e0b" },
            ticks: { color: "#f59e0b" },
            grid: { color: "#2a2a2a" },
          },
          yP: {
            type: "linear",
            position: "right",
            title: { display: true, text: "PID, %", color: "#22c55e" },
            ticks: { color: "#888" },
            grid: { drawOnChartArea: false },
          },
        },
        plugins: {
          legend: { labels: { color: "#ddd" } },
        },
      },
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(htmlPath, html, "utf8");
console.log("Графік:", htmlPath);

const openCmd =
  process.platform === "win32"
    ? `start "" "${htmlPath}"`
    : process.platform === "darwin"
      ? `open "${htmlPath}"`
      : `xdg-open "${htmlPath}"`;

exec(openCmd, (err) => {
  if (err) {
    console.error("Не вдалося відкрити браузер. Відкрий файл вручну.");
    process.exitCode = 1;
  }
});
