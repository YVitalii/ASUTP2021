<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">

            <div class="modal-header">
                <h4>{{ header }}</h4>
                <button v-if="headerButtonExitActive" class="close-button" @click="closeModal">×</button>
            </div>

            <div class="modal-body">
                <slot>Тут має бути тіло вікна.</slot>
            </div>
        </div>
    </div>
</template>

<script setup>

// 1. ВЛАСТИВОСТІ (PROPS)
// show -  яка керує видимістю
// header - заголовок модального вікна
// headerButtonExitActive - чи показувати кнопку закриття в заголовку
// slot:default - вміст модального вікна

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
        required: true // Обов'язкова властивість для керування
    },
    header: {
        type: String,
        default: 'Модальне Вікно'
    },
    headerButtonExitActive: {
        type: Boolean,
        default: false
    }
});

// 2. ПОДІЇ (EMITS)
// Визначаємо подію, яку ми будемо надсилати батьківському компоненту для закриття
const emit = defineEmits(['close']);

// 3. ФУНКЦІЇ
// Функція для закриття модального вікна
const closeModal = () => {
    // Ми надсилаємо подію 'close' батьківському компоненту.
    // Батьківський компонент повинен обробити цю подію,
    // встановивши змінну 'showModal' у 'false'.
    emit('close');
};
</script>

<style scoped>
/* -------------------------------------- */
/* СТИЛІ МОДАЛЬНОГО ВІКНА */
/* -------------------------------------- */

/* 1. Накладання (Overlay) */
.modal-overlay {
    position: fixed;
    /* Фіксовано на екрані */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    /* Напівпрозорий чорний фон */
    display: flex;
    justify-content: center;
    /* Центрування по горизонталі */
    align-items: center;
    /* Центрування по вертикалі */
    z-index: 1000;
    /* Розташування поверх усіх інших елементів */
}

/* 2. Контент модального вікна */
.modal-content {
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 70%;
    max-width: 1000px;
    /* Обмеження ширини */
    position: relative;
}

/* 3. Заголовок і кнопка */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
    margin-bottom: 5px;
}

.close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #aaa;
    line-height: 1;
    padding: 100;
}

.close-button:hover {
    color: #333;
}
</style>