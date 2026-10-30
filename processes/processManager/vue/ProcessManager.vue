<template>
  <div class="process-manager">
    <PM_Command>
      <slot name="command">Керування</slot>
    </PM_Command>
    <PM_Process :state-id="colorId" @loaded="onLoaded" @update:state-id="onStateId">
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
import { ref, watch } from "vue";
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

type ProgramState = {
  header?: string | LocalizedText;
  comment?: string | LocalizedText;
  startTime?: string | null;
  duration?: string;
};

const header = ref<string | LocalizedText>("");
const comment = ref<string | LocalizedText>("");
const duration = ref("");
const startTime = ref<string | null>(null);

function onLoaded(program: ProgramState) {
  header.value = program.header ?? "";
  comment.value = program.comment ?? "";
  duration.value = program.duration ?? "";
  startTime.value = program.startTime ?? null;
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
