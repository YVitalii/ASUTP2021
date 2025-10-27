<script setup>
// reuired
let gLn = "checkbox_strike.vue::script::", trace = 1;

// Визначаємо властивості, які компонент отримуватиме від батька
// label - отримує через слот
const props = defineProps({
    required: { // обов'язковість відмітки
        type: Boolean,
        default: false
    },
    id: { // id
        type: String,
        default: ""
    },
    comment: { // спливаюча підказка
        type: String,
        default: ""
    },
    checked: { // стан чекбокса
        type: Boolean,
        default: false
    },
});
// Визначаємо подію, яку компонент надсилатиме батьку
const emit = defineEmits(['changeStatus']); // , "label"

// Функція-обробник, яка викликається при зміні стану чекбокса
const handleChange = (event) => {
    let trace = 0, ln = gLn + "handleChange()::";
    if (trace) { console.log(ln + `event.target=`); console.dir(event.target); }

    emit('changeStatus', props.id, event.target.checked);
};


</script>

<template>
    <div class="checkbox-container form-check" :title="comment">
        <input type="checkbox" :id="id" :required="required" class="form-check-input" @change="handleChange" />
        <label :for="id" :class="{
            'strikethrough': checked,
            'text-bold': !checked
        }" class="form-check-label">

            <slot> Не визначено !!</slot>

        </label>
    </div>
</template>

<style scoped>
.checkbox-container {
    display: flex;
    /* align-items: center; */
    vertical-align: middle;
    gap: 10px;
}

/* Стиль для жирного тексту, коли checked = false */
.text-bold {
    font-weight: bold;
}

.checkbox-container .strikethrough {
    text-decoration: line-through;
    color: #888;
}
</style>