import { createApp, h, ref } from "vue";
import ProcessManager from "./ProcessManager.vue";

const states = ["waiting", "going", "error", "finished", "stoped"];

createApp({
  setup() {
    const stateId = ref("waiting");
    return () =>
      h("div", { class: "host" }, [
        h(
          "div",
          { class: "switcher" },
          states.map((state) =>
            h(
              "button",
              {
                type: "button",
                onClick: () => {
                  stateId.value = state;
                },
              },
              state,
            ),
          ),
        ),
        h("div", { class: "frame" }, [
          h(ProcessManager, { stateId: stateId.value }),
        ]),
      ]);
  },
}).mount("#app");
