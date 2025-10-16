<template>
  <div class="container-fluid vue-container">
    <CheckList :table="datas" v-model="showModal" />
  </div>

</template>

<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:test": "cross-env VITE_APP_ROOT=./src/ontrollers/CheckListTask/vue vite",
// потім запустити: npm run dev:vue:test

import CheckList from "./СheckList.vue";
import { ref } from 'vue';

let datas = ref([
  {
    id: "p1",
    label: { ua: `Тиск Азоту ~ 3 атм `, en: ``, ru: `` },
    comment: { ua: `Після відкриття вентиля балона переконайтеся, що на редукторі встановлено тиск 5 атм. \nЗа потреби скоригуйте тиск регулятором на газовому щиту ~3 атм\nЗавжди тримайте один запасний балон напоготові для швидкої заміни. `, en: ``, ru: `` },
    checked: false,
    required: true,
  },
  {
    id: "p2",
    label: { ua: `Тиск Аміаку ~ 2 атм.`, en: ``, ru: `` },
    comment: { ua: `Після відкриття вентиля балона переконайтеся, що на редукторі встановлено тиск 3 атм. \nЗа потреби скоригуйте тиск регулятором на газовому щиту ~2 атм \nЗавжди тримайте один запасний балон напоготові для швидкої заміни. `, en: ``, ru: `` },
    checked: false,
    required: true,
  },
  {
    id: "p3",
    label: { ua: `Тиск СО<sub>2</sub> ~ 2 атм.`, en: ``, ru: `` },
    comment: { ua: `Після відкриття вентиля балона переконайтеся, що на редукторі встановлено тиск 5 атм. \nЗа потреби скоригуйте тиск регулятором на газовому щиту ~3 атм \nЗавжди тримайте один запасний балон напоготові для швидкої заміни. `, en: ``, ru: `` },
    checked: false,
    required: true,
  }]
);
</script>

<style scoped>
.vue-container {
  border: 1px solid #42b860;
  padding: 10px;
  border-radius: 10px;
  background-color: #f0fdf4;
  color: #35495e;
}
</style>