<template>
  <div class="process-manager">
    <PM_Command
      :program="program"
      :step-id="selectedStepId"
      :step-header="selectedStepHeader"
      @done="reloadTick++"
    />
    <PM_Process
      :state-id="colorId"
      :reload-token="reloadTick"
      @loaded="onLoaded"
      @update:state-id="onStateId"
      @select-step="onSelectStep"
    >
      <template #description>
        <PM_Process_Description
          :state-id="colorId"
          :header="header"
          :comment="comment"
          :duration="duration"
          :start-time="startTime"
        />
      </template>
      <template #content>
        <slot name="content">Тіло програми</slot>
      </template>
    </PM_Process>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PM_Command from "./PM_Command.vue";
import PM_Process from "./PM_Process.vue";
import PM_Process_Description from "./PM_Process_Description.vue";

const props = withDefaults(
  defineProps<{
    /** Стан програми: waiting, going, error, finished, stoped. */
    stateId?: string;
  }>(),
  { stateId: "waiting" },
);

const colorId = ref(props.stateId);

watch(
  () => props.stateId,
  (id) => {
    if (id) colorId.value = id;
  },
);

function onStateId(id: string) {
  colorId.value = id;
}

type LocalizedText = {
  ua?: string;
  en?: string;
  ru?: string;
};

type TaskState = {
  id?: string;
  type?: string;
  header?: string | LocalizedText;
  tasks?: unknown;
};

type ProgramState = {
  _id?: string;
  header?: string | LocalizedText;
  comment?: string | LocalizedText;
  startTime?: string | null;
  duration?: string;
  tasks?: unknown;
};

const header = ref<string | LocalizedText>("");
const comment = ref<string | LocalizedText>("");
const duration = ref("");
const startTime = ref<string | null>(null);
const program = ref<ProgramState | null>(null);
const pickedStepId = ref("");
const reloadTick = ref(0);

/** Кроки без опису програми. Перший з них — крок, з якого стартують за замовчуванням. */
function listSteps(tasks: unknown, out: TaskState[] = []) {
  if (!Array.isArray(tasks)) return out;
  for (const item of tasks) {
    if (Array.isArray(item)) {
      listSteps(item, out);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const step = item as TaskState;
    if (Array.isArray(step.tasks) && step.tasks.length) {
      listSteps(step.tasks, out);
      continue;
    }
    if (step.type === "stepDescription" || step.id == null) continue;
    out.push(step);
  }
  return out;
}

const selectedStep = computed(() => {
  const steps = listSteps(program.value?.tasks);
  return steps.find((step) => String(step.id) === pickedStepId.value) ?? steps[0] ?? null;
});

const selectedStepId = computed(() =>
  selectedStep.value?.id != null ? String(selectedStep.value.id) : "",
);

const selectedStepHeader = computed(() => selectedStep.value?.header ?? "");

function onLoaded(next: ProgramState) {
  program.value = next;
  header.value = next.header ?? "";
  comment.value = next.comment ?? "";
  duration.value = next.duration ?? "";
  startTime.value = next.startTime ?? null;
  const steps = listSteps(next.tasks);
  if (!steps.some((step) => String(step.id) === pickedStepId.value)) {
    pickedStepId.value = steps[0]?.id != null ? String(steps[0].id) : "";
  }
}

function onSelectStep(step: { id: string }) {
  if (program.value?._id === "going") return;
  pickedStepId.value = step.id;
}
</script>

<style scoped>
.process-manager {
  box-sizing: border-box;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  margin: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
</style>
