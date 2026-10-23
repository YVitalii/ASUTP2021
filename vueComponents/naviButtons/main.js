import { createApp } from "vue";
import NaviButtons from "./naviButtons.vue";

const mounted = new WeakSet();

function mountAll() {
  document.querySelectorAll(".naviButtons").forEach((container) => {
    if (!(container instanceof HTMLElement) || mounted.has(container)) return;
    mounted.add(container);
    createApp(NaviButtons, {
      entityId: container.dataset.entityId || undefined,
    }).mount(container);
  });
}

mountAll();

if (document.documentElement) {
  new MutationObserver(mountAll).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
