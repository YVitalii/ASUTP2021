<template>
  <div ref="root" class="caption-simple" :hidden="!open">{{ content }}</div>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, ref } from "vue";

defineProps<{
  content: string;
}>();

const root = useTemplateRef<HTMLDivElement>("root");
const open = ref(false);

/** Ставить підказку біля елемента так, щоб вона цілком лишалась у вікні. */
function place(anchor: Element) {
  const tip = root.value;
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

async function show(anchor: Element) {
  open.value = true;
  await nextTick();
  place(anchor);
}

function hide() {
  open.value = false;
}

defineExpose({ show, hide });
</script>

<style scoped>
.caption-simple {
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
  white-space: pre-line;
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  overflow-wrap: break-word;
  word-break: break-word;
}
</style>
