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

let program = ref({
  "_id": "waiting",
  "note": {
    "ua": "Очікування",
    "en": "Waiting",
    "ru": "Ожидание"
  },
  "duration": "0",
  "changed": "2025-10-16T07:40:43.379Z",
  "id": "processManager.program::",
  "header": {
    "ua": "12",
    "en": "12",
    "ru": "12"
  },
  "comment": {
    "ua": "Активна програма",
    "en": "Active program",
    "ru": "Активная программа"
  },
  "tasks": [
    {
      "id": "description",
      "header": {
        "ua": "Загальний опис програми",
        "en": "General descriptiom of program",
        "ru": "Общее описание программы"
      },
      "comment": {
        "ua": "Приклад опису\n",
        "en": "Приклад опису\n",
        "ru": "Приклад опису\n"
      },
      "value": "12",
      "editable": false
    },
    {
      "_id": "waiting",
      "note": {
        "ua": "Очікування",
        "en": "Waiting",
        "ru": "Ожидание"
      },
      "duration": "0",
      "changed": "2025-10-16T07:40:43.378Z",
      "id": "st_1",
      "header": {
        "ua": "Термообробка: tT=180; H=90; Y=150",
        "en": "Heat treatment: tT=180; H=90; Y=150",
        "ru": "Термообработка: tT=180; H=90; Y=150"
      },
      "comment": {
        "ua": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "en": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "ru": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;"
      },
      "tasks": [
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.377Z",
          "id": "heating",
          "header": {
            "ua": "->180°C",
            "en": "->180°C",
            "ru": "->180°C"
          },
          "comment": {
            "ua": "ТРМ251.Нагрівання до 180°C",
            "en": "TRM251.Heating to 180°C",
            "ru": "ТРМ251.Нагрев до 180°C"
          }
        },
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.378Z",
          "id": "holding",
          "header": {
            "ua": "= 180°C",
            "en": "= 180°C",
            "ru": "= 180°C"
          },
          "comment": {
            "ua": "ТРМ251.Витримка 180°C",
            "en": "TRM251.Holding  180°C",
            "ru": "ТРМ251.Удержание 180°C"
          }
        }
      ]
    },
    {
      "_id": "waiting",
      "note": {
        "ua": "Очікування",
        "en": "Waiting",
        "ru": "Ожидание"
      },
      "duration": "0",
      "changed": "2025-10-16T07:40:43.378Z",
      "id": "st_2",
      "header": {
        "ua": "Термообробка: tT=300; H=0; Y=30",
        "en": "Heat treatment: tT=300; H=0; Y=30",
        "ru": "Термообработка: tT=300; H=0; Y=30"
      },
      "comment": {
        "ua": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "en": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "ru": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;"
      },
      "tasks": [
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.378Z",
          "id": "heating",
          "header": {
            "ua": "->300°C",
            "en": "->300°C",
            "ru": "->300°C"
          },
          "comment": {
            "ua": "ТРМ251.Нагрівання до 300°C",
            "en": "TRM251.Heating to 300°C",
            "ru": "ТРМ251.Нагрев до 300°C"
          }
        },
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.378Z",
          "id": "holding",
          "header": {
            "ua": "= 300°C",
            "en": "= 300°C",
            "ru": "= 300°C"
          },
          "comment": {
            "ua": "ТРМ251.Витримка 300°C",
            "en": "TRM251.Holding  300°C",
            "ru": "ТРМ251.Удержание 300°C"
          }
        }
      ]
    },
    {
      "_id": "waiting",
      "note": {
        "ua": "Очікування",
        "en": "Waiting",
        "ru": "Ожидание"
      },
      "duration": "0",
      "changed": "2025-10-16T07:40:43.379Z",
      "id": "st_3",
      "header": {
        "ua": "Термообробка: tT=400; H=0; Y=30",
        "en": "Heat treatment: tT=400; H=0; Y=30",
        "ru": "Термообработка: tT=400; H=0; Y=30"
      },
      "comment": {
        "ua": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "en": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;",
        "ru": "wT=0; errTmin=-5; errTmax=5; errH=0; regMode=pos; o=-1; ti=0; td=0;"
      },
      "tasks": [
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.378Z",
          "id": "heating",
          "header": {
            "ua": "->400°C",
            "en": "->400°C",
            "ru": "->400°C"
          },
          "comment": {
            "ua": "ТРМ251.Нагрівання до 400°C",
            "en": "TRM251.Heating to 400°C",
            "ru": "ТРМ251.Нагрев до 400°C"
          }
        },
        {
          "_id": "waiting",
          "note": {
            "ua": "Очікування",
            "en": "Waiting",
            "ru": "Ожидание"
          },
          "duration": "0",
          "changed": "2025-10-16T07:40:43.379Z",
          "id": "holding",
          "header": {
            "ua": "= 400°C",
            "en": "= 400°C",
            "ru": "= 400°C"
          },
          "comment": {
            "ua": "ТРМ251.Витримка 400°C",
            "en": "TRM251.Holding  400°C",
            "ru": "ТРМ251.Удержание 400°C"
          }
        }
      ]
    }
  ],
  "logFileName": "tmp"
}
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