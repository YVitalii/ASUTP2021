<template>
    <div :class="['program-editor-container', { 'sidebar-collapsed': isSidebarCollapsed }]">

        <!-- Кнопка для згортання / розгортання бокової панелі -->
        <button class="toggle-sidebar-btn" @click="toggleSidebar"
            :title="isSidebarCollapsed ? 'Розгорнути панель' : 'Згорнути панель'">
            {{ isSidebarCollapsed ? '▶' : '◀' }}
        </button>

        <!-- Ліва колонка (в альбомному) або Верхній рядок (у книжковому) -->
        <div class="editor-sidebar" v-show="!isSidebarCollapsed || isPortraitMode">
            <!-- Панель кнопок керування -->
            <div class="action-buttons">
                <button class="btn save-btn" @click="handleSave">Зберегти</button>
                <button class="btn load-btn" @click="handleLoad">Завантажити</button>
                <button class="btn reset-btn" @click="handleReset">Скинути</button>
            </div>

            <!-- Список програм для вибору -->
            <div class="program-selector-wrapper">
                <label class="selector-label">Вибір програми:</label>

                <!-- Випадаючий список для мобільних / книжкової орієнтації -->
                <select class="program-select-dropdown" v-model="selectedProgramId" @change="onProgramSelect">
                    <option v-for="prog in availablePrograms" :key="prog.id" :value="prog.id">
                        {{ prog.title }}
                    </option>
                </select>

                <!-- Вертикальний список для альбомної орієнтації -->
                <div class="program-list-box">
                    <div v-for="prog in availablePrograms" :key="prog.id"
                        :class="['program-list-item', { 'active': prog.id === selectedProgramId }]"
                        @click="selectProgram(prog.id)">
                        <span class="prog-title">{{ prog.title }}</span>
                        <span class="prog-desc">{{ prog.description }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Права колонка з таблицею редагування (вирівняна по центру) -->
        <div class="editor-main-content">
            <ProgramManager :read-only="isReadOnlyState" />
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// Використовуємо наш зафіксований правильний шлях до ProgramManager
import ProgramManager from '../programManager/component.vue';

interface ProgramSummary {
    id: number;
    title: string;
    description: string;
}

const availablePrograms = ref<ProgramSummary[]>([
    { id: 1, title: 'Program 1', description: 'Колеса чавунні. Відпуск.' },
    { id: 2, title: 'Program 2', description: 'Гільзи циліндрів. Гартування.' },
    { id: 3, title: 'Program 3', description: 'Пружини підвіски. Термообробка.' }
]);

const selectedProgramId = ref<number>(1);
const isReadOnlyState = ref<boolean>(false);

// Стан для згортання бокової панелі
const isSidebarCollapsed = ref<boolean>(false);
const isPortraitMode = ref<boolean>(false);

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const handleSave = () => {
    console.log('Натиснуто: Зберегти програму ID:', selectedProgramId.value);
};

const handleLoad = () => {
    console.log('Натиснуто: Завантажити програму');
};

const handleReset = () => {
    console.log('Натиснуто: Скинути зміни');
};

const selectProgram = (id: number) => {
    selectedProgramId.value = id;
};

const onProgramSelect = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    selectedProgramId.value = Number(target.value);
};
</script>

<style scoped>
.program-editor-container {
    position: relative;
    display: grid;
    gap: 12px;
    padding: 10px;
    background-color: #f4f6f8;
    border-radius: 8px;
    box-sizing: border-box;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    transition: grid-template-columns 0.3s ease;
}

.toggle-sidebar-btn {
    position: absolute;
    top: 16px;
    left: 225px;
    z-index: 10;
    background-color: #34495e;
    color: white;
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: left 0.3s ease, background-color 0.2s;
}

.toggle-sidebar-btn:hover {
    background-color: #2c3e50;
}

.program-editor-container.sidebar-collapsed .toggle-sidebar-btn {
    left: 10px;
}

.editor-sidebar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #ffffff;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #dcdcdc;
    box-sizing: border-box;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.btn {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: bold;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s;
    text-align: center;
}

.save-btn {
    background-color: #27ae60;
}

.save-btn:hover {
    background-color: #219653;
}

.load-btn {
    background-color: #2980b9;
}

.load-btn:hover {
    background-color: #2471a3;
}

.reset-btn {
    background-color: #c0392b;
}

.reset-btn:hover {
    background-color: #a93226;
}

.program-selector-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.selector-label {
    font-size: 12px;
    font-weight: bold;
    color: #333;
}

.program-select-dropdown {
    padding: 6px;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
    width: 100%;
    box-sizing: border-box;
}

.program-list-box {
    display: none;
    flex-direction: column;
    gap: 4px;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 4px;
    background: #fafafa;
}

.program-list-item {
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.program-list-item:hover {
    background: #f0f4f8;
    border-color: #d0d7de;
}

.program-list-item.active {
    background: #e3fcef;
    border-color: #42b883;
}

.prog-title {
    font-weight: bold;
    font-size: 13px;
    color: #2c3e50;
}

.prog-desc {
    font-size: 11px;
    color: #666;
}

.editor-main-content {
    background: #ffffff;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #dcdcdc;
    box-sizing: border-box;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow-x: auto;
}

@media screen and (orientation: portrait) {
    .program-editor-container {
        grid-template-columns: 1fr;
    }

    .toggle-sidebar-btn {
        display: none;
    }

    .program-select-dropdown {
        display: block;
    }

    .program-list-box {
        display: none;
    }
}

@media screen and (orientation: landscape) {
    .program-editor-container {
        grid-template-columns: 220px 1fr;
    }

    .program-editor-container.sidebar-collapsed {
        grid-template-columns: 1fr;
    }

    .program-select-dropdown {
        display: none;
    }

    .program-list-box {
        display: flex;
    }
}
</style>