<script setup>
import CheckboxStrike from "@atoms/CheckboxStrike/СheckboxStrike.vue";
// Визначаємо властивості, які компонент отримуватиме від батька
// label - отримує через слот
defineProps({
    table: { //[{id:String, label:String, comment:String, required:Boolean, checked:Boolean}]
        type: Array,
        required: true
    },
    modelValue: {
        type: Boolean,
        default: false
    },
});

// Визначаємо подію, яку компонент надсилатиме батьку
const emit = defineEmits(['update:modelValue']); // , "label"

// Функція-обробник, яка викликається при зміні стану чекбокса
const handleChange = (event) => {
    // let trace = 1, ln = gLn + "handleChange()::";
    // if (trace) { console.log(ln + `event.target.checked=`); console.dir(event.target.checked); }
    emit('update:modelValue', event.target.checked);
};

</script>

<template>

    <div class="row" v-for="(data, index) in table" :key="index">
        <div class="col">
            <CheckboxStrike :required="data.required" :id="data.id" v-model="data.checked" :comment="data.comment">
                {{ data.label }}
            </CheckboxStrike>
        </div>
    </div>

</template>

<style scoped></style>