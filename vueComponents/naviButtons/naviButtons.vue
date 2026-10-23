<template>
  <nav
    ref="host"
    class="navi-buttons"
    :class="{ vertical }"
    aria-label="Навігація"
  >
    <a
      v-for="button in items"
      :key="button.id"
      class="btn navi-btn"
      :class="[button.style, { disabled: button.disabled }]"
      :href="button.href"
      :aria-disabled="button.disabled ? 'true' : undefined"
      :tabindex="button.disabled ? -1 : undefined"
      @click="onClick($event, button)"
    >
      {{ button.title }}
    </a>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  buttonUrl,
  naviButtons,
  settings,
  type NaviButton,
} from "./settings";

const props = defineProps<{
  /** Якщо сторінка не під /entity/:id/, можна передати id явно. */
  entityId?: string;
}>();

const host = ref<HTMLElement | null>(null);
const vertical = ref(false);
let observer: ResizeObserver | null = null;

const items = computed(() =>
  naviButtons
    .map((button) => ({
      ...button,
      href: buttonUrl(button.id, props.entityId),
    }))
    .filter((button) => !isCurrent(button.href)),
);

function isCurrent(href: string) {
  if (typeof window === "undefined") return false;
  const norm = (value: string) => value.replace(/\/+$/, "") || "/";
  try {
    const url = new URL(href, window.location.origin);
    return norm(url.pathname) === norm(window.location.pathname);
  } catch {
    return norm(window.location.pathname) === norm(href);
  }
}

function syncLayout() {
  const width = host.value?.clientWidth ?? 0;
  if (width <= 0) return;
  vertical.value = width < settings.layoutBreakpoint;
}

function onClick(event: MouseEvent, button: NaviButton) {
  if (button.disabled) event.preventDefault();
}

onMounted(() => {
  syncLayout();
  if (!host.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver(() => syncLayout());
  observer.observe(host.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<style scoped>
.navi-buttons {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.navi-buttons.vertical {
  flex-direction: column;
}

.navi-btn {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

.navi-buttons.vertical .navi-btn {
  width: 100%;
  flex: 0 0 auto;
}

.navi-btn.disabled {
  pointer-events: none;
  opacity: 0.65;
}
</style>
