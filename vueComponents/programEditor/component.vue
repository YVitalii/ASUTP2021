<template>
    <div class="program-editor-container">

        <!-- Заголовок сторінки із імпортованого об'єкта settings -->
        <div class="editor-page-header">
            <h2>{{ settings.header }}</h2>
            <span v-if="state.programEdited" class="edited-badge">⚠️ Є зміни</span>
        </div>

        <!-- Якщо список програм ще не завантажено — показуємо значок завантаження -->
        <div v-if="state.programList === null" class="global-loading-container">
            <div class="spinner"></div>
            <p>Завантаження списку програм...</p>
        </div>

        <!-- Коли список завантажено — рендеримо весь інтерфейс -->
        <template v-else>
            <!-- Кнопка для згортання / розгортання бокової панелі -->
            <button class="toggle-sidebar-btn" @click="toggleSidebar"
                :title="isSidebarCollapsed ? 'Розгорнути панель' : 'Згорнути панель'">
                {{ isSidebarCollapsed ? '▶' : '◀' }}
            </button>

            <!-- Ліва колонка / верхній рядок з управлінням та списком -->
            <div :class="['editor-sidebar', { 'collapsed': isSidebarCollapsed }]"
                v-show="!isSidebarCollapsed || isPortraitMode">
                <div class="action-buttons">
                    <BtnSave :disabled="!state.programEdited" @click="handleSave" />

                    <button class="btn load-btn" @click="handleLoad">Завантажити</button>
                    <button class="btn delete-btn" @click="handleDelete">Видалити</button>
                    <button class="btn reset-btn" @click="handleReset">Скинути</button>
                </div>

                <div class="program-selector-wrapper">
                    <label class="selector-label">Вибір програми:</label>

                    <!-- Випадаючий список для книжкової орієнтації -->
                    <select class="program-select-dropdown" v-model="state.activeProgramName" @change="onProgramSelect">
                        <option v-for="progName in state.programList" :key="progName" :value="progName">
                            {{ progName }}
                        </option>
                    </select>

                    <!-- Вертикальний список для альбомної орієнтації -->
                    <div class="program-list-box">
                        <div v-for="progName in state.programList" :key="progName"
                            :class="['program-list-item', { 'active': progName === state.activeProgramName }]"
                            @click="selectProgram(progName)">
                            <span class="prog-title">{{ progName }}</span>
                            <span v-if="state.runningProgramName === progName" class="running-badge">🟢
                                Виконується</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Права колонка з таблицею ProgramManager -->
            <div :class="['editor-main-content', { 'full-width': isSidebarCollapsed }]">
                <ProgramManager :program-data="state.programContent" :read-only="isReadOnlyState"
                    @update:programData="markAsEdited" />
            </div>
        </template>

    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import ProgramManager from '../programManager/component.vue';
import BtnSave from './BtnSave.vue';
import { settings } from './settings';

const state = reactive({
    activeProgramName: "",
    programEdited: false,
    programList: null as string[] | null,
    programContent: null as any,
    runningProgramName: null as string | null,

});

const isReadOnlyState = ref<boolean>(false);
const isSidebarCollapsed = ref<boolean>(false);
const isPortraitMode = ref<boolean>(false);

onMounted(() => {
    setTimeout(() => {
        state.programList = ["prg1", "prg2", "prg3"];
        state.activeProgramName = state.programList[0];
        state.runningProgramName = null;

        state.programContent = [
            {
                id: 1,
                title: state.activeProgramName,
                description: 'Колеса чавунні. Відпуск.',
                date: new Date(),
                maxStepsQuantity: 15,
                regs: {
                    "tT": { title: "tT", units: "°C", type: "Number", min: 0, max: 1200, comment: "Цільова температура" },
                    "H": { title: "H", units: "ГГ:ХХ", type: "Time", min: "00:00", max: "99:59", comment: "Тривалість нагрівання" },
                    "Y": { title: "Y", units: "ГГ:ХХ", type: "Time", min: "00:00", max: "99:59", comment: "Тривалість витримки" }
                }
            },
            { "tT": 100, "H": "00:10", "Y": "00:20" },
            { "tT": 200, "H": "00:30", "Y": "00:40" }
        ];

        state.programEdited = false;
    }, 1000);
});

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const markAsEdited = () => {
    console.log("programEditor.js::Program edited!")
    state.programEdited = true;
};

const handleSave = () => {
    console.log(`Збереження файлу за адресою: ${settings.URLs.writeFile}, ім'я: ${state.activeProgramName}`);
    state.programEdited = false;
};

const handleLoad = () => {
    console.log(`Завантаження файлу за адресою: ${settings.URLs.readFile}`);
};

const handleDelete = () => {
    if (!state.programList) return;
    console.log(`Видалення файлу: ${state.activeProgramName} через ${settings.URLs.deleteFile}`);

    state.programList = state.programList.filter(name => name !== state.activeProgramName);
    if (state.programList.length > 0) {
        state.activeProgramName = state.programList[0];
    } else {
        state.programContent = null;
    }
};

const handleReset = () => {
    console.log('Скинути зміни');
    state.programEdited = false;
};

const selectProgram = (name: string) => {
    state.activeProgramName = name;
};

const onProgramSelect = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    selectProgram(target.value);
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
    min-height: 250px;
}

.editor-page-header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 2px solid #3498db;
}

.editor-page-header h2 {
    margin: 0;
    font-size: 18px;
    color: #2c3e50;
}

.edited-badge {
    background-color: #e67e22;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.running-badge {
    font-size: 10px;
    color: #27ae60;
    font-weight: bold;
}

.global-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px;
    gap: 12px;
    color: #666;
    font-size: 14px;
    grid-column: 1 / -1;
}

.spinner {
    width: 36px;
    height: 36px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.toggle-sidebar-btn {
    position: absolute;
    top: 55px;
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

.load-btn {
    background-color: #2980b9;
}

.load-btn:hover {
    background-color: #2471a3;
}

.delete-btn {
    background-color: #e74c3c;
}

.delete-btn:hover {
    background-color: #c0392b;
}

.reset-btn {
    background-color: #7f8c8d;
}

.reset-btn:hover {
    background-color: #626567;
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
    display: flex;
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
    justify-content: space-between;
    align-items: center;
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