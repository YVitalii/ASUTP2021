<template>
    <div class="program-container">
        <!-- Якщо дані ще не надійшли ззовні — показуємо завантаження -->
        <div v-if="!programData || programData.length === 0" class="loading-container">
            <p>Завантаження даних програми...</p>
        </div>

        <template v-else>
            <!-- Шапка програми -->
            <div class="program-header">
                <div class="header-field-row">
                    <label class="field-label">Назва:</label>
                    <div class="field-control">
                        <FileNameField v-model="programData[0].title" :disabled="readOnly"
                            @update:modelValue="notifyChanges" />
                    </div>
                </div>

                <div class="header-field-row">
                    <label class="field-label">Опис:</label>
                    <div class="field-control">
                        <TextAreaField v-model="programData[0].description" :disabled="readOnly"
                            @update:modelValue="notifyChanges" />
                    </div>
                </div>

                <div class="meta-info-row">
                    <span class="date-info">Змінено: {{ formatDate(programData[0].date) }}</span>
                    <span class="limit-info">
                        Кроки: {{ stepsList.length }} / {{ programData[0].maxStepsQuantity }}
                    </span>
                </div>
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
                                    :max="regConfig.max" :disabled="readOnly" @update:modelValue="notifyChanges" />
                                <NumberField v-else-if="regConfig.type === 'Number'" v-model="step[regKey]"
                                    :min="regConfig.min" :max="regConfig.max" :disabled="readOnly"
                                    @update:modelValue="notifyChanges" />
                                <span v-else>{{ step[regKey] }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Плаваючий джойстик (ховається, якщо увімкнено readOnly) -->
                <div v-if="!readOnly && activeStepIndex !== null && rowElements.get(activeStepIndex)"
                    class="floating-joystick" :style="joystickStyle">
                    <MyJoystick :enable="true" :visible="true"
                        @command="(action) => handleJoystickCommand(action, activeStepIndex!)" />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TimeField from '../fields/TimeField.vue';
import NumberField from '../fields/NumberField.vue';
import FileNameField from '../fields/FileNameField.vue';
import TextAreaField from '../fields/TextAreaField.vue';
import MyJoystick from '../joystick/MyJoystick.vue';

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

// 1. Отримуємо дані програми та стан readOnly через props
const props = defineProps<{
    programData?: [ProgramHeader, ...ProgramStep[]] | null;
    readOnly?: boolean;
}>();

// 2. Описуємо події (emits), якими компонент сигналізує про зміни нагору
const emit = defineEmits<{
    (e: 'update:programData', value: [ProgramHeader, ...ProgramStep[]]): void;
    (e: 'change'): void; // Загальна подія зміни для активації прапорця незбережених змін
}>();

const activeStepIndex = ref<number | null>(0);

const rowElements = ref<Map<number, HTMLElement>>(new Map());
const setRowRef = (el: any, index: number) => {
    if (el) {
        rowElements.value.set(index, el);
    } else {
        rowElements.value.delete(index);
    }
};

// Отримуємо список кроків (усі елементи масиву, починаючи з індексу 1)
const stepsList = computed(() => {
    if (!props.programData || props.programData.length <= 1) return [];
    return props.programData.slice(1) as ProgramStep[];
});

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
};

// Функція виклику подій при будь-яких змінах у таблиці чи шапці
const notifyChanges = () => {
    if (!props.programData) return;
    // Оновлюємо дату останньої модифікації в заголовку
    props.programData[0].date = new Date();

    // Генеруємо події для батьківського компонента
    emit('update:programData', props.programData);

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
    if (!props.programData || !props.programData[0]) return {};
    const newStep: ProgramStep = {};
    for (const key in props.programData[0].regs) {
        const reg = props.programData[0].regs[key];
        newStep[key] = reg.type === 'Number' ? (Number(reg.min) || 0) : "00:00";
    }
    return newStep;
};

const addStepAfter = (index: number) => {
    if (!props.programData) return;
    if (stepsList.value.length >= props.programData[0].maxStepsQuantity) return;

    const insertAt = index + 1;
    // Змінюємо масив напряму та сповіщаємо батька
    props.programData.splice(insertAt + 1, 0, createDefaultStep());
    activeStepIndex.value = insertAt;
    notifyChanges();
};

const removeStep = (index: number) => {
    if (!props.programData) return;
    if (stepsList.value.length <= 1) return;

    props.programData.splice(index + 1, 1);
    notifyChanges();

    if (activeStepIndex.value !== null) {
        if (activeStepIndex.value >= stepsList.value.length) {
            activeStepIndex.value = stepsList.value.length - 1;
        }
    }
};

const moveStepUp = (index: number) => {
    if (!props.programData || index <= 0) return;
    const item = props.programData.splice(index + 1, 1)[0];
    props.programData.splice(index, 0, item);
    activeStepIndex.value = index - 1;
    notifyChanges();
};

const moveStepDown = (index: number) => {
    if (!props.programData || index >= stepsList.value.length - 1) return;
    const item = props.programData.splice(index + 1, 1)[0];
    props.programData.splice(index + 2, 0, item);
    activeStepIndex.value = index + 1;
    notifyChanges();
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

.loading-container {
    padding: 20px;
    text-align: center;
    color: #666;
}

.header-title {
    font-size: 1.1em;
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