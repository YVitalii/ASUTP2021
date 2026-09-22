<template>
    <div class="program-container">
        <!-- Шапка програми -->
        <div class="program-header" v-if="programData.length > 0">
            <div class="header-field-row">
                <label class="field-label">Назва:</label>
                <div class="field-control">
                    <FileNameField v-model="programData[0].title" :disabled="readOnly"
                        @update:modelValue="markAsModified" />
                </div>
            </div>

            <div class="header-field-row">
                <label class="field-label">Опис:</label>
                <div class="field-control">
                    <TextAreaField v-model="programData[0].description" :disabled="readOnly"
                        @update:modelValue="markAsModified" />
                </div>
            </div>

            <div class="meta-info-row">
                <span class="date-info">Змінено: {{ formatDate(programData[0].date) }}</span>
                <span class="limit-info">
                    Кроки: {{ stepsList.length }} / {{ programData[0].maxStepsQuantity }}
                </span>
                <span v-if="isModified" class="modified-badge">⚠️ Є незбережені зміни</span>
            </div>
            <!-- Кнопку ReadOnly видалено. Тепер режимом керує батьківський компонент через props -->
        </div>

        <!-- Обгортка таблиці -->
        <div class="table-wrapper" ref="tableWrapperRef">
            <table class="steps-table">
                <thead>
                    <tr>
                        <th class="col-index" title="Порядковий номер кроку виконання програми">№ Кроку</th>
                        <th v-for="(regConfig, regKey) in programData[0]?.regs" :key="regKey"
                            :title="regConfig.comment">
                            <span class="header-title">{{ regConfig.title }}</span>
                            <br>
                            <small>[{{ regConfig.units }}]</small>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(step, index) in stepsList" :key="index" :ref="el => setRowRef(el, index)"
                        :class="{ 'active-row': activeStepIndex === index && !readOnly }" @click="selectRow(index)">
                        <td class="col-index">{{ index + 1 }}</td>

                        <!-- Динамічні поля кроку -->
                        <td v-for="(regConfig, regKey) in programData[0]?.regs" :key="regKey">
                            <TimeField v-if="regConfig.type === 'Time'" v-model="step[regKey]" :min="regConfig.min"
                                :max="regConfig.max" :disabled="readOnly" @update:modelValue="markAsModified" />
                            <NumberField v-else-if="regConfig.type === 'Number'" v-model="step[regKey]"
                                :min="regConfig.min" :max="regConfig.max" :disabled="readOnly"
                                @update:modelValue="markAsModified" />
                            <span v-else>{{ step[regKey] }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Плаваючий джойстик (ховається, якщовімкнено readOnly) -->
            <div v-if="!readOnly && activeStepIndex !== null && rowElements.get(activeStepIndex)"
                class="floating-joystick" :style="joystickStyle">
                <MyJoystick :enable="true" :visible="true"
                    @command="(action) => handleJoystickCommand(action, activeStepIndex!)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TimeField from '../fields/TimeField.vue';
import NumberField from '../fields/NumberField.vue';
import FileNameField from '../fields/FileNameField.vue';
import TextAreaField from '../fields/TextAreaField.vue';
import MyJoystick from '../joystick_upDownInsDel/joystick_upDownInsDel.vue';

// Визначаємо вхідні параметри (props) від батьківського компонента
const props = defineProps<{
    readOnly?: boolean; // Керує режимом блокування ззовні
}>();

interface RegConfig {
    title: string;
    units: string;
    type: string;
    min: number | string;
    max: number | string;
    comment: string;
}

interface ProgramHeader {
    id: number;
    title: string;
    description: string;
    date: Date | string;
    maxStepsQuantity: number;
    regs: Record<string, RegConfig>;
}

interface ProgramStep {
    [key: string]: any;
}

const activeStepIndex = ref<number | null>(0);
const isModified = ref<boolean>(false);

const rowElements = ref<Map<number, HTMLElement>>(new Map());
const setRowRef = (el: any, index: number) => {
    if (el) {
        rowElements.value.set(index, el);
    } else {
        rowElements.value.delete(index);
    }
};

const programData = ref<[ProgramHeader, ...ProgramStep[]]>([
    {
        id: 1,
        title: 'Program 1',
        description: 'Колеса чавунні. Відпуск.',
        date: new Date('2023-05-03T11:04:49.715Z'),
        maxStepsQuantity: 15,
        regs: {
            "tT": { title: "tT", units: "°C", type: "Number", min: 0, max: 1200, comment: "Цільова температура" },
            "H": { title: "H", units: "ГГ:ХХ", type: "Time", min: "00:00", max: "99:59", comment: "Тривалість нагрівання" },
            "Y": { title: "Y", units: "ГГ:ХХ", type: "Time", min: "00:00", max: "99:59", comment: "Тривалість витримки" }
        }
    },
    { "tT": 100, "H": 10, "Y": 20 },
    { "tT": 200, "H": 30, "Y": 40 },
    { "tT": 300, "H": 50, "Y": 70 }
]);

const stepsList = computed(() => programData.value.slice(1) as ProgramStep[]);

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
};

const markAsModified = () => {
    isModified.value = true;
    programData.value[0].date = new Date();
};

const joystickStyle = computed(() => {
    if (activeStepIndex.value === null) return {};
    const rowEl = rowElements.value.get(activeStepIndex.value);
    if (!rowEl) return {};

    const topPosition = rowEl.offsetTop;
    const rowHeight = rowEl.offsetHeight;
    const joystickHeight = 60;
    const centeringOffset = (rowHeight - joystickHeight) / 2;

    return {
        top: `${topPosition + centeringOffset}px`
    };
});

const selectRow = (index: number) => {
    if (props.readOnly) return;
    activeStepIndex.value = index;
};

const createDefaultStep = (): ProgramStep => {
    const newStep: ProgramStep = {};
    for (const key in programData.value[0].regs) {
        const reg = programData.value[0].regs[key];
        newStep[key] = reg.type === 'Number' ? (Number(reg.min) || 0) : 0;
    }
    return newStep;
};

const addStepAfter = (index: number) => {
    if (stepsList.value.length >= programData.value[0].maxStepsQuantity) return;

    const insertAt = index + 1;
    programData.value.splice(insertAt + 1, 0, createDefaultStep());
    activeStepIndex.value = insertAt;
    markAsModified();
};

const removeStep = (index: number) => {
    if (stepsList.value.length <= 1) return;

    programData.value.splice(index + 1, 1);
    markAsModified();

    if (activeStepIndex.value !== null) {
        if (activeStepIndex.value >= stepsList.value.length) {
            activeStepIndex.value = stepsList.value.length - 1;
        }
    }
};

const moveStepUp = (index: number) => {
    if (index <= 0) return;
    const item = programData.value.splice(index + 1, 1)[0];
    programData.value.splice(index, 0, item);
    activeStepIndex.value = index - 1;
    markAsModified();
};

const moveStepDown = (index: number) => {
    if (index >= stepsList.value.length - 1) return;
    const item = programData.value.splice(index + 1, 1)[0];
    programData.value.splice(index + 2, 0, item);
    activeStepIndex.value = index + 1;
    markAsModified();
};

const handleJoystickCommand = (action: string, index: number) => {
    switch (action) {
        case 'UP':
            moveStepUp(index);
            break;
        case 'DOWN':
            moveStepDown(index);
            break;
        case 'DELETE':
            removeStep(index);
            break;
        case 'INSERT':
            addStepAfter(index);
            break;
    }
};
</script>

<style scoped>
.program-container {
    display: inline-block;
    min-width: 480px;
    max-width: 650px;
    padding: 16px;
    font-family: Arial, sans-serif;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #dcdcdc;
    box-sizing: border-box;
}

/* Додаємо стиль для назви регістра замість застарілого тегу <big> */
.header-title {
    font-size: 1.1em;
    /* Робить текст трохи більшим за стандартний */
    font-weight: bold;
}

.program-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #42b883;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.header-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.field-label {
    font-weight: bold;
    font-size: 14px;
    width: 60px;
    flex-shrink: 0;
}

.field-control {
    flex-grow: 1;
}

.meta-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    color: #555;
}

.modified-badge {
    color: #d35400;
    font-weight: bold;
    font-size: 12px;
    background: #fdf2e9;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e67e22;
}

.table-wrapper {
    position: relative;
    display: inline-block;
    padding-right: 75px;
    box-sizing: border-box;
}

.steps-table {
    border-collapse: collapse;
    background: #ffffff;
}

.steps-table th,
.steps-table td {
    border: 1px solid #e0e0e0;
    padding: 8px 10px;
    text-align: center;
    vertical-align: middle;
}

.steps-table th {
    background-color: #f7f7f7;
    font-size: 14px;
    font-weight: bold;
}

.col-index {
    width: 50px;
}

.steps-table tr.active-row {
    background-color: #e8f8f0;
}

.steps-table tr:hover {
    background-color: #fafafa;
    cursor: pointer;
}

.floating-joystick {
    position: absolute;
    right: 5px;
    width: 60px;
    height: 60px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    z-index: 10;
    transition: top 0.15s ease-out;
}
</style>