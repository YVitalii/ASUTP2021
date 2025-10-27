<script setup>

let gLn = "src/components/molecules/CheckList/СheckList.vue::", trace = 1;

import CheckboxStrike from "@atoms/CheckboxStrike/СheckboxStrike.vue";
// Визначаємо властивості, які компонент отримуватиме від батька
// label - отримує через слот
defineProps({
    table: { //[{id:String, label:String, comment:String, required:Boolean, checked:Boolean}]
        type: Array,
        required: true
    }
});

// Визначаємо подію, яку компонент надсилатиме батьку
const emit = defineEmits(['handleChangeStatus']); // , "label"

// Функція-обробник, яка викликається при зміні стану чекбокса
const handleChangeStatus = (id, state) => {
    let trace = 1, ln = gLn + "handleChange()::";
    trace ? console.log(ln + `id=${id}; state=${state}`) : null;
    emit('handleChangeStatus', id, state);
};

</script>

<template>

    <div class="row" v-for="(data, index) in table" :key="index">
        <div class="col">
            <CheckboxStrike :required="data.required" :id="data.id" :checked="data.checked" :comment="data.comment"
                @change-status="handleChangeStatus">
                {{ data.label }}
            </CheckboxStrike>
        </div>
    </div>

</template>

<style scoped></style>