<template>
  <div class="container-fluid vue-container">

    <div class="row">
      <div class="col">
        <CheckBoxStrike> data </CheckBoxStrike>
      </div>
    </div>
  </div>
  <!-- <p>{{url}}</p> -->
</template>

<script setup>
let lang = window.myData.lang; // Мова, яку ви хочете використовувати
// import { checked } from 'happy-dom/lib/PropertySymbol.js';
// import { ref, onMounted } from 'vue';
let name = "CheckboxStrike";
import { CheckBoxStrike } from "./СheckboxStrike.vue";
let data =
{
  id: st1_1,
  header: { ua: `Тиск азоту на манометрі ГЩ = 3 атм.`, en: ``, ru: `` },
  comment: { ua: `Відкрийте вентиль балону та встановіть тиск на редукторі 5 атм. Азоту повинно бути не менше 2-х балонів `, en: ``, ru: `` },
  checked: false,
};
// // Оголошуємо, властивості
// const props = defineProps({
//   id: {
//     type: String,
//     required: true
//   },
//   header: {
//     type: String,
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true,
//   },
//   comment: {
//     type: String,
//     required: true,
//   },
// });

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