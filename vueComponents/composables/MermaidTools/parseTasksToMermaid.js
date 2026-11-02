/**
 * Перетворює дерево tasks на текст діаграми Mermaid (flowchart TD).
 *
 * Група — масив. Якщо перший елемент stepDescription:
 *   parallel: false — кроки йдуть ланцюжком;
 *   parallel: true  — від Fork до кожного кроку і з кінця гілки в Join.
 * Масив без stepDescription — послідовна гілка, включно з першим кроком.
 * У Stop входить лише кінець кореневого ланцюжка.
 */

const START_ID = "idStart";
const STOP_ID = "idStop";

/**
 * Ідентифікатор вузла Mermaid: дефіс у id кроку ламає стрілку ` --> `.
 * @param {string} id
 * @returns {string}
 */
function safeId(id) {
  let text = String(id).replace(/[^A-Za-z0-9_]/g, "_");
  if (!/^[A-Za-z]/.test(text)) text = `n_${text}`;
  return text;
}

/**
 * Підпис вузла. header кроку — {ua, en, ru}.
 * @param {string|Object} header
 * @param {string} fallback
 * @returns {string}
 */
function labelOf(header, fallback) {
  let text = fallback;
  if (typeof header === "string") text = header;
  else if (header && typeof header === "object") {
    text = header.ua || header.en || header.ru || fallback;
  }
  return String(text).replace(/[\[\]]/g, "");
}

/**
 * Підпис вузла у markdown.
 * Один рядок: id["`текст`"]
 * Кілька рядків:
 *   id["`Line1
 *   Line 2
 *   Line 3`"]
 * @param {string} content
 * @param {string} indentation відступ вузла, ним же зсуваються наступні рядки
 * @returns {string}
 */
function selectForm(content, indentation = "") {
  const lines = String(content ?? "")
    .replace(/`/g, "'")
    .split(/\r?\n/);
  if (lines.length <= 1) return `("\`${lines[0] ?? ""}\`")`;
  const body = lines
    .map((line, index) => (index === 0 ? line : `${indentation}${line}`))
    .join("\n");
  return `("\`${body}\`")`;
}

/**
 * Рядок вузла: id + форма.
 * @param {Object} arg крок програми
 * @param {string} [indentation]
 * @returns {string}
 */
function getNode(arg = {}, indentation = "") {
  const content = labelOf(arg.header, arg.id);
  return `${safeId(arg.id)}${selectForm(content, indentation)}`;
}

/**
 * @param {Array} tasks
 * @param {string} indentation
 * @param {string|null} parent
 * @param {string} res
 * @returns {{res: string, endId: string}}
 */
function walk(tasks, indentation, parent, res) {
  const isRoot = res === "";
  let parallel = false;
  let joinId = "";
  let source = parent;

  if (isRoot) {
    source = START_ID;
    res += "flowchart TD\n";
    res += `${indentation}${START_ID}@{ shape: sm-circ, label: "Start" }\n`;
    res += `${indentation}${STOP_ID}@{ shape: framed-circle, label: "Stop" }\n`;
  }

  if (!Array.isArray(tasks)) {
    return { res, endId: source };
  }

  let index = 0;
  const head = tasks[0];
  if (head && !Array.isArray(head) && head.type === "stepDescription") {
    parallel = Boolean(head.parallel);
    index = 1;
    if (parallel) {
      const forkId = safeId(`forkId_${head.id}`);
      joinId = safeId(`joinId_${head.id}`);
      res += `${indentation}${forkId}@{ shape: fork, label: "Fork" }\n`;
      res += `${indentation}${source} --> ${forkId}\n`;
      source = forkId;
      res += `${indentation}${joinId}@{ shape: fork, label: "Join" }\n`;
    }
  }

  let endId = source;
  for (let i = index; i < tasks.length; i++) {
    const item = tasks[i];
    if (item && !Array.isArray(item) && item.type === "stepDescription") {
      continue;
    }
    if (Array.isArray(item)) {
      const nested = walk(item, indentation + indentation, source, res);
      res = nested.res;
      if (parallel) {
        res += `${indentation}${nested.endId} --> ${joinId}\n`;
        endId = joinId;
      } else {
        source = nested.endId;
        endId = source;
      }
      continue;
    }

    const id = safeId(item.id);
    res += `${indentation}${getNode(item, indentation)}\n`;
    res += `${indentation}${source} --> ${id}\n`;
    if (parallel) {
      res += `${indentation}${id} --> ${joinId}\n`;
      endId = joinId;
    } else {
      source = id;
      endId = id;
    }
  }

  if (parallel && joinId) endId = joinId;
  if (isRoot) res += `${indentation}${endId} --> ${STOP_ID}\n`;
  return { res, endId };
}

/**
 * Будує текст діаграми.
 * @param {Array} tasks
 * @param {string} [indentation="  "]
 * @param {string|null} [parent=null]
 * @param {string} [res=""]
 * @returns {string}
 */
function parseTasksToMermaid(
  tasks,
  indentation = "  ",
  parent = null,
  res = "",
) {
  return walk(tasks, indentation, parent, res).res;
}

export { selectForm, getNode, safeId };
export default parseTasksToMermaid;
