<template>
  <section class="pm-content" aria-label="Тіло програми">
    <pre id="pm_content_Mermaid" class="mermaid"></pre>
    <div ref="stepTip" class="pm-step-tip" hidden>
      <h6></h6>
      <div class="pm-step-tip__row" data-field="startTime"></div>
      <div class="pm-step-tip__row" data-field="duration"></div>
      <div class="pm-step-tip__row" data-field="note"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";
import parseTasksToMermaid, {
  safeId,
} from "../../../vueComponents/composables/MermaidTools/parseTasksToMermaid.js";
import { fieldLabelText } from "../../../vueComponents/fields/fieldLabel";
import { settings } from "./settings.js";

type MermaidApi = {
  initialize: (config: {
    startOnLoad?: boolean;
    securityLevel?: string;
    htmlLabels?: boolean;
  }) => void;
  run: (options?: { nodes?: ArrayLike<HTMLElement> }) => Promise<void>;
};

const props = defineProps<{
  /** Стан програми з POST /state, data.content. */
  state: {
    tasks?: unknown;
  };
}>();

const emit = defineEmits<{
  "select-step": [step: { id: string; header?: StepStatus["header"] }];
}>();

type LocalizedText = { ua?: string; en?: string; ru?: string };

type StepStatus = {
  id: string;
  _id: string;
  header?: string | LocalizedText;
  startTime?: string | null;
  duration?: string | null;
  note?: string | LocalizedText | null;
};

const noteLabel = { ua: "Примітка:", en: "Note:", ru: "Примечание:" };

const stateNames = Object.keys(settings.states);

let mermaidApi: MermaidApi | null = null;
/** Текст діаграми, який уже намальований. */
let drawnDiagram = "";
/** id кроку → _id, для якого вже стоїть стиль вузла. */
let drawnStatuses = new Map<string, string>();
const stepTip = useTemplateRef<HTMLDivElement>("stepTip");
const tipHandlers = new Map<
  Element,
  { show: () => void; hide: () => void; pick: () => void }
>();

async function loadMermaid() {
  if (mermaidApi) return mermaidApi;
  // Файл лежить у public. Прямий import() Vite перехоплює і не віддає його.
  const load = new Function(
    "return import('/mermaid/mermaid.esm.min.mjs')",
  ) as () => Promise<{ default: MermaidApi }>;
  const mod = await load();
  mermaidApi = mod.default;
  mermaidApi.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    htmlLabels: true,
  });
  return mermaidApi;
}

function collectSteps(tasks: unknown, out: StepStatus[] = []) {
  if (!Array.isArray(tasks)) return out;
  for (const item of tasks) {
    if (Array.isArray(item)) {
      collectSteps(item, out);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const step = item as {
      id?: string;
      _id?: string;
      type?: string;
      header?: string | LocalizedText;
      startTime?: string | null;
      duration?: string | null;
      note?: string | LocalizedText | null;
    };
    if (step.type === "stepDescription" || step.id == null) continue;
    out.push({
      id: String(step.id),
      _id: String(step._id || "waiting"),
      header: step.header,
      startTime: step.startTime ?? null,
      duration: step.duration ?? "",
      note: step.note ?? null,
    });
  }
  return out;
}

function colorsFor(status: string) {
  if (stateNames.includes(status)) {
    return settings.states[status as keyof typeof settings.states];
  }
  return settings.states.waiting;
}

/** Вузол кроку: id на кшталт mermaid-…-flowchart-st_1-4. */
function paintNode(stepId: string, status: string) {
  const nodeId = safeId(stepId);
  const section = document.querySelector(`[id*="flowchart-${nodeId}-"]`);
  if (!(section instanceof SVGElement || section instanceof HTMLElement)) return false;
  const rect = section.querySelector("rect.basic");
  if (!(rect instanceof SVGElement || rect instanceof HTMLElement)) return false;
  const colors = colorsFor(status);
  rect.style.setProperty("fill", colors.background, "important");
  rect.style.setProperty("stroke", colors.board, "important");
  if (colors.boardWidth) {
    rect.style.setProperty("stroke-width", colors.boardWidth, "important");
  } else {
    rect.style.removeProperty("stroke-width");
  }
  const label = section.querySelector(".nodeLabel");
  if (label instanceof HTMLElement) {
    if (colors.textBold) {
      label.style.setProperty("font-weight", "bold", "important");
    } else {
      label.style.removeProperty("font-weight");
    }
  }
  for (const name of stateNames) section.classList.remove(name);
  section.classList.add(status);
  return true;
}

function headerText(header: StepStatus["header"]) {
  if (header == null) return "";
  if (typeof header === "string") return header;
  const lang = (globalThis as { lang?: string }).lang;
  if (lang === "en" || lang === "ru") return header[lang] || header.ua || "";
  return header.ua || header.en || header.ru || "";
}

function shownValue(value: string | null | undefined) {
  if (value == null || value === "") return "???";
  return value;
}

function hideStepTip() {
  if (stepTip.value) stepTip.value.hidden = true;
}

/** Ставить підказку біля кроку так, щоб вона цілком лишалась у вікні. */
function placeStepTip(anchor: Element) {
  const tip = stepTip.value;
  if (!tip) return;
  const margin = 8;
  const box = anchor.getBoundingClientRect();
  const tipBox = tip.getBoundingClientRect();
  const maxLeft = window.innerWidth - margin - tipBox.width;
  const maxTop = window.innerHeight - margin - tipBox.height;
  let left = box.left + box.width / 2 - tipBox.width / 2;
  let top = box.top - tipBox.height - margin;
  if (top < margin) top = box.bottom + margin;
  left = Math.min(Math.max(left, margin), Math.max(margin, maxLeft));
  top = Math.min(Math.max(top, margin), Math.max(margin, maxTop));
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

/** Спливаюча підказка: заголовок кроку і час початку. */
function bindTooltip(step: StepStatus) {
  const section = document.querySelector(`[id*="flowchart-${safeId(step.id)}-"]`);
  const tip = stepTip.value;
  if (!section || !tip) return;
  const previous = tipHandlers.get(section);
  if (previous) {
    section.removeEventListener("mouseenter", previous.show);
    section.removeEventListener("mouseleave", previous.hide);
    section.removeEventListener("click", previous.pick);
  }
  const show = () => {
    const title = tip.querySelector("h6");
    if (title) title.textContent = headerText(step.header);
    const rows: Record<string, string> = {
      startTime: `${fieldLabelText(settings.process.description.startTime.label)} ${shownValue(step.startTime)}`,
      duration: `${fieldLabelText(settings.process.description.duration.label)} ${shownValue(step.duration)}`,
      note: `${fieldLabelText(noteLabel)} ${headerText(step.note ?? undefined) || "???"}`,
    };
    for (const [field, text] of Object.entries(rows)) {
      const row = tip.querySelector(`[data-field="${field}"]`);
      if (row) row.textContent = text;
    }
    tip.hidden = false;
    placeStepTip(section);
  };
  const hide = () => {
    tip.hidden = true;
  };
  const pick = () => {
    emit("select-step", { id: step.id, header: step.header });
  };
  section.addEventListener("mouseenter", show);
  section.addEventListener("mouseleave", hide);
  section.addEventListener("click", pick);
  tipHandlers.set(section, { show, hide, pick });
}

function bindTooltips(steps: StepStatus[]) {
  for (const step of steps) bindTooltip(step);
}

function paintSteps(steps: StepStatus[], onlyChanged: boolean) {
  for (const step of steps) {
    if (onlyChanged && drawnStatuses.get(step.id) === step._id) continue;
    if (paintNode(step.id, step._id)) drawnStatuses.set(step.id, step._id);
  }
}

async function renderDiagram() {
  const el = document.getElementById("pm_content_Mermaid");
  if (!el) return;
  const steps = collectSteps(props.state?.tasks);
  const diagram = parseTasksToMermaid(props.state?.tasks);
  const hasSvg = !!el.querySelector("svg");

  if (diagram === drawnDiagram && hasSvg) {
    paintSteps(steps, true);
    bindTooltips(steps);
    return;
  }

  drawnDiagram = diagram;
  drawnStatuses = new Map();
  console.log(diagram);
  el.removeAttribute("data-processed");
  // innerText перетворює переноси на <br>, і Mermaid читає їх як теги.
  el.textContent = diagram;
  try {
    const mermaid = await loadMermaid();
    if (!el.isConnected) return;
    await mermaid.run({ nodes: [el] });
    hideStepTip();
    paintSteps(steps, false);
    bindTooltips(steps);
  } catch (error) {
    el.dataset.mermaidError = error instanceof Error ? error.message : String(error);
    console.error("Mermaid:", error);
  }
}

onMounted(() => {
  void renderDiagram();
});

watch(
  () => props.state,
  () => {
    void renderDiagram();
  },
);
</script>

<style scoped>
.pm-content {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  border: 2px solid #d9d9d9;
  margin: 2px;
  padding: 5px;
  border-radius: 0 0 5px 5px;
  background-color: #fff;
}

.mermaid {
  margin: 0;
}

.pm-content :deep(.node) {
  cursor: pointer;
}

.pm-step-tip {
  position: fixed;
  z-index: 20;
  box-sizing: border-box;
  max-width: min(320px, calc(100vw - 16px));
  background-color: #333;
  color: #fff;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.35;
  text-align: left;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
}

.pm-step-tip h6 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  white-space: normal;
  overflow-wrap: break-word;
}

.pm-step-tip__row {
  white-space: normal;
  overflow-wrap: break-word;
}
</style>
