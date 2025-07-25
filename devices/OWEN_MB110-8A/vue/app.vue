<template>
  <div class="container-fluid vue-container">
    <div class="row">
      <div class="col">
        <h2 class="text-center text-italic" :title="device.comment[lang]">{{header}}</h2>
      </div>
    </div> 
    <div class="row">
      <div class="col">
        <Temperature :value="data[1].value" :title="data[1].title"></Temperature>
      </div>
      <div class="col">
        <Temperature :value="data[2].value" :title="data[2].title"></Temperature>
      </div>
      <div class="col">
        <Temperature :value="data[3].value" :title="data[3].title"></Temperature>
      </div>
    </div> 
    <div class="row">
      <div class="col"><Temperature :value="data[4].value" :title="data[4].title"></Temperature></div>
      <div class="col"><Temperature :value="data[5].value" :title="data[5].title"></Temperature></div>
      <div class="col"><Temperature :value="data[6].value" :title="data[6].title"></Temperature></div>
    </div>
   </div>
   <p>{{url}}</p>
</template>

<script setup>
let lang= 'ua'; // Мова, яку ви хочете використовувати
import { ref,  onMounted } from 'vue';
import Temperature from './Temperature.vue';

// Оголошуємо, що компонент приймає властивість containerId
const props = defineProps({
  containerId: {
    type: String,
    required: true, // Вказуємо, що ця властивість обов'язкова
  }
});
let trace=1, ln=`mb110a8::vue.app::`;
const id= props.containerId;
const device= window.devices.items[id];

if (trace) { console.log(ln+`device=`); console.dir(device); } 

const header=device.header.ua;
const url = device.baseUrl;

let data=[{offLine:null,title:"Device offline!"}];
for (let i = 1; i < 8; i++) {
  let id=`T${i}`;
  let reg = device.regs[id] ;
  data.push({value:reg.value, title: reg.comment[lang] });
}
if (trace) { console.log(ln+`data=`); console.dir(data); } 
const count = ref(data);

const fetchData = async () => {
  try {
    const response = await fetch(`${url}/"T1;T2;T3;T4;T5;T6;T7;T8"`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    if (trace) { console.log(ln+`jsonData=`); console.dir(jsonData); } 
    // data.forEach((item, index) => {
    //   item.value = jsonData[`T${index + 1}`] ?|jsonData[`T${index + 1}`] :  null;
    // });
  } catch (error) {
    console.error(ln + `Fetch error:`, error);
    console.log(jsonData.slice(0,100));
  }
};
// 4. Виклик функції при монтуванні компонента
onMounted(() => {
  fetchData();
});

</script>

<style scoped>
.vue-container {
  border: 1px solid #42b883;
  padding: 20px;
  margin-top: 20px;
  border-radius: 8px;
  background-color: #f0fdf4;
  color: #35495e;
}

</style>