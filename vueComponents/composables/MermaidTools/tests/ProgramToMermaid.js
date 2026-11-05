/**
 * Будує mermaid-діаграму програми TRM-251.
 * Програма береться з devices/OWEN_TRM251/tests/testProgram.js.
 * Запуск: node ./vueComponents/composables/MermaidTools/tests/ProgramToMermaid.js
 */
const fs = require("fs");
const path = require("path");
const program = require("../../../../devices/OWEN_TRM251/tests/testProgram.js");

/** Хвилини → "ГГ:ХХ". 70 → "01:10". */
function minutesToHHMM(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return value;
  const total = Math.round(minutes);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function lang(text) {
  return { ua: text, en: text, ru: text };
}

/**
 * stepDescription лишається описом групи: парсер не малює його як крок.
 * Решта елементів стають вузлами ProsessStep_SimpleBadge.
 */
function toTask(step) {
  if (step.type === "stepDescription") return step;
  if (step.type === "TRM251_ProgLoadToDev") {
    return {
      id: "progLoad",
      type: "ProsessStep_SimpleBadge",
      _id: "waiting",
      header: lang("Запис програми в прилад"),
    };
  }
  if (step.type === "TRM251_Start") {
    return {
      id: "start",
      type: "ProsessStep_SimpleBadge",
      _id: "waiting",
      header: lang(`Пуск Пр${step.prN}; Кр${step.stN}`),
    };
  }
  if (step.type === "TRM251_Stop") {
    return {
      id: "stop",
      type: "ProsessStep_SimpleBadge",
      _id: "waiting",
      header: lang("Стоп"),
    };
  }
  if (step.type === "TRM251_goToPrSt") {
    return {
      id: `goToPrSt_${step.prN}_${step.stN}`,
      type: "ProsessStep_SimpleBadge",
      _id: "waiting",
      header: lang(`Перехід Пр:${step.prN} Кр:${step.stN}`),
    };
  }
  const title = `${step.Pr}:${step.St}. tT=${step.tT}; H=${minutesToHHMM(step.H)}; Y=${minutesToHHMM(step.Y)}`;
  return {
    id: `p${step.Pr}_s${step.St}`,
    type: "ProsessStep_SimpleBadge",
    _id: "waiting",
    header: lang(title),
  };
}

async function main() {
  const { default: parseTasksToMermaid } = await import(
    "../parseTasksToMermaid.js"
  );
  const tasks = program.map(toTask);
  const diagram = parseTasksToMermaid(tasks);
  const file = path.join(__dirname, "mermaidedProgram.md");

  fs.writeFileSync(file, "```mermaid\n" + diagram + "```\n", "utf8");
  console.log(file);
}

main();
