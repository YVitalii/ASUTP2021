<template>
  <div class="container-fluid vue-container" :class="count[0].offLine ? `offline` : `online`"   >
    <div class="row">
      <div class="col">
        <h3 class="text-center text-italic" :title="device.comment[lang]">{{header}}</h3>
      </div>
    </div> 
    <div class="row">
      <div class="col">
        <Temperature :value="count[1]" :title="device.regs.T1.comment[lang]"></Temperature>
      </div>
      <div class="col">
        <Temperature :value="count[2]" :title="device.regs.T2.comment[lang]"></Temperature>
      </div>
      <div class="col">
        <Temperature :value="count[3]" :title="device.regs.T3.comment[lang]"></Temperature>
      </div>
    </div> 
    <div class="row">
      <div class="col"><Temperature :value="count[4]" :title="device.regs.T4.comment[lang]"></Temperature></div>
      <div class="col"><Temperature :value="count[5]" :title="device.regs.T5.comment[lang]"></Temperature></div>
      <div class="col"><Temperature :value="count[6]" :title="device.regs.T6.comment[lang]"></Temperature></div>
    </div>
    <div class="row">
      <div class="col"><Temperature :value="count[7]" :title="device.regs.T7.comment[lang]"></Temperature></div>
      <div class="col"><Temperature :value="count[8]" :title="device.regs.T8.comment[lang]"></Temperature></div>
      <!-- <div class="col"><Temperature :value="count[9]" :title="device.regs.T6.comment[lang]"></Temperature></div> -->
    </div>
   </div>
   <!-- <p>{{url}}</p> -->
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
let trace=0, ln=`mb110a8::vue.app::`;
const id= props.containerId;
const device= window.devices.items[id];
const errorFetchCounter=0, errMax=5;
if (trace) { console.log(ln+`device=`); console.dir(device); } 

const header=device.header.ua;
const url = device.baseUrl;

let data=[{offLine:true,title:"Device offline!"}];
for (let i = 1; i < 8; i++) {
  let id=`T${i}`;
  let reg = device.regs[id] ;
  data.push(reg.value);
}


const count = ref(data);
if (trace) { console.log(ln+`count=`); console.dir(count); } 

const fetchData = async () => {
  let trace=0, ln=`${id}::fetchData::`;
  try {
    const response = await fetch(`${url}`,{
      method:"POST", headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    if (trace) { console.log(ln+`jsonData=`); console.dir(jsonData); } 
    count.value[0].offLine = jsonData[`offLine`]; // 
    // Оновлюємо дані
    for (let i = 1; i < 8; i++) {
      count.value[i]=jsonData[`T${i}`];
      
    }
    if (trace) { console.log(ln+`count=`); console.dir(count); }
    // data.forEach((item, index) => {
    //   item.value = jsonData[`T${index + 1}`] ?|jsonData[`T${index + 1}`] :  null;
    // });
  } catch (error) {
    console.error(ln + `Fetch error:`, error);
     errorFetchCounter++;
    if (errorFetchCounter > errMax) { 
      count.value[0].offLine = true; // Встановлюємо статус офлайн
      errorFetchCounter = errMax;
    }
  }
  setTimeout(fetchData, 5000); // Повторюємо запит кожні 5 секунд

};
// 4. Виклик функції при монтуванні компонента
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