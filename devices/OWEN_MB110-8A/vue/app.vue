<template>
  <div
    class="container-fluid vue-container"
    :class="isOffline ? `offline` : `online`"
  >
    <div class="row">
      <div class="col">
        <h3 class="text-center text-italic" :title="device.comment[lang]">
          {{ header }}
        </h3>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <Temperature
          :value="channel(1)"
          :title="device.regs.T1.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(2)"
          :title="device.regs.T2.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(3)"
          :title="device.regs.T3.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(4)"
          :title="device.regs.T4.comment[lang]"
        ></Temperature>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <Temperature
          :value="channel(5)"
          :title="device.regs.T5.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(6)"
          :title="device.regs.T6.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(7)"
          :title="device.regs.T7.comment[lang]"
        ></Temperature>
      </div>
      <div class="col">
        <Temperature
          :value="channel(8)"
          :title="device.regs.T8.comment[lang]"
        ></Temperature>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Temperature from "./Temperature.vue";

const lang = "ua";
const CHANELS = 8;

interface LocalizedText {
  ua: string;
  [key: string]: string;
}

interface DeviceReg {
  comment: LocalizedText;
  value: number | string | null;
}

interface Mb110Device {
  comment: LocalizedText;
  header: LocalizedText;
  baseUrl: string;
  regs: Record<string, DeviceReg>;
}

interface StatusRow {
  offLine: boolean;
  title: string;
}

type Sample = number | string | null;
type BoardCell = StatusRow | Sample;

const props = defineProps<{
  containerId: string;
}>();

const trace = 0;
const ln = `mb110a8::vue.app::`;

const id = props.containerId;
const device = (
  window as Window & { devices: { items: Record<string, Mb110Device> } }
).devices.items[id];

let errorFetchCounter = 0;
const errMax = 5;
if (trace) {
  console.log(ln + `device=`);
  console.dir(device);
}

const header = device.header.ua;
const url = device.baseUrl;

const data: BoardCell[] = [{ offLine: true, title: "Device offline!" }];
for (let i = 1; i <= CHANELS; i++) {
  const regId = `T${i}`;
  const reg = device.regs[regId];
  data.push(reg.value);
}

const count = ref<BoardCell[]>(data);
if (trace) {
  console.log(ln + `count=`);
  console.dir(count);
}

const isOffline = computed(() => (count.value[0] as StatusRow).offLine);

function channel(index: number): Sample {
  const item = count.value[index];
  if (item !== null && typeof item === "object") return null;
  return item;
}

const fetchData = async () => {
  const traceFetch = 0;
  const lnFetch = `${id}::fetchData::`;
  try {
    const response = await fetch(`${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = (await response.json()) as Record<string, Sample | boolean>;
    if (traceFetch) {
      console.log(lnFetch + `jsonData=`);
      console.dir(jsonData);
    }
    (count.value[0] as StatusRow).offLine = Boolean(jsonData.offLine);
    for (let i = 1; i <= CHANELS; i++) {
      const sample = jsonData[`T${i}`];
      count.value[i] = typeof sample === "boolean" ? null : (sample ?? null);
    }
    if (traceFetch) {
      console.log(lnFetch + `count=`);
      console.dir(count);
    }
  } catch (error) {
    console.error(lnFetch + `Fetch error:`, error);
    errorFetchCounter++;
    if (errorFetchCounter > errMax) {
      (count.value[0] as StatusRow).offLine = true;
      errorFetchCounter = errMax;
    }
  }
  setTimeout(fetchData, 5000);
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.vue-container {
  border: 1px solid #42b860;
  padding: 10px;
  margin-top: 5px;
  border-radius: 10px;
  background-color: #f0fdf4;
  color: #35495e;
}
.offline {
  background-color: #fdf0f7;
  border: 2px solid #b84252;
}
.online {
  background-color: #f0fdf4;
  border: 1px solid #42b860;
}
</style>
