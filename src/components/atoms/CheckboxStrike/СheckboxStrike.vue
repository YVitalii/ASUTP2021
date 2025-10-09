<script setup>
// reuired
// let gLn = "checkbox_strike.vue::script::", trace = 1;

// Визначаємо властивості, які компонент отримуватиме від батька
// defineProps(["required", "id", "comment", "modelValue"]);
defineProps({
    required: {
        type: Boolean,
        default: false
    },
    id: {
        type: String,
        default: ""
    },
    comment: {
        type: String,
        default: ""
    },
    modelValue: {
        type: Boolean,
        default: false
    }
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
    <div class="checkbox-container form-check" :title="comment">
        <input type="checkbox" :id="id" :required="required" :checked="modelValue" class="form-check-input"
            @change="handleChange" />
        <label :for="id" :class="{
            'strikethrough': modelValue,
            'text-bold': !modelValue
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