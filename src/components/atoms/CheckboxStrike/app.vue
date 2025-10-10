<template>
  <div class="container-fluid vue-container">

    <div class="row">
      <div class="col">
        <CheckboxStrike :required=data.required :id=data.id v-model="data.checked" :comment="data.comment.ua">
          {{ data.label.ua }}
        </CheckboxStrike>
      </div>
    </div>
  </div>
  <!-- <p>{{url}}</p> -->
</template>

<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:test": "cross-env VITE_APP_ROOT=./src/components/atoms/CheckboxStrike vite",
// потім запустити: npm run dev:vue:test

import CheckboxStrike from "./СheckboxStrike.vue";
import { ref } from 'vue';

let data = ref(
  {
    id: "st1_1",
    label: { ua: `Тиск азоту на манометрі ГЩ = 3 атм.`, en: ``, ru: `` },
    comment: { ua: `Після відкриття вентиля балона переконайтеся, що на редукторі встановлено тиск 5 атм. \nЗа потреби скоригуйте тиск регулятором на газовому щиту \nЗавжди тримайте один запасний балон азоту напоготові для швидкої заміни. `, en: ``, ru: `` },
    checked: false,
    required: true,
  });
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