<template>
  <div>
    <button @click="showMyModal = true">Відкрити Модальне Вікно</button>

    <ModalWindow :show="showMyModal" @close="showMyModal = false" :header="header">
      <CheckboxStrike :required=true :id="'modal_checkbox_1'" v-model="checked1"
        :comment="'Це коментар до чекбокса в модальному вікні.'">
        {{ 'Чекбокс всередині модального вікна 1' }}
      </CheckboxStrike>
      <CheckboxStrike :required=true :id="'modal_checkbox_2'" v-model="checked2"
        :comment="'Це коментар до чекбокса в модальному вікні.'">
        {{ 'Чекбокс всередині модального вікна 2' }}
      </CheckboxStrike>
    </ModalWindow>
  </div>
</template>

<script setup>

// Для запуску цього тесту, внести в package.json рядок:
// "dev:vue:test": "cross-env VITE_APP_ROOT=./src/components/atoms/ModalWindow vite",
import { ref } from 'vue';
import ModalWindow from './ModalWindow.vue'; // Переконайтеся, що шлях правильний
import CheckboxStrike from '@atoms/CheckboxStrike/СheckboxStrike.vue';

let header = "Заголовок Модального Вікна";
let checked1 = ref(false);
let checked2 = ref(false);
// Створюємо реактивну змінну для керування видимістю
const showMyModal = ref(false); 
</script>