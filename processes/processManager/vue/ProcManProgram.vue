<template>
    <template v-for="task in tasks">
        <div class="row task-wrapper">
            <template v-if="Array.isArray(task) && task.length > 0">
                <template v-for="parallelTask in task">
                    <div class="col">
                        <ProcManTasksSelector :task="parallelTask">
                        </ProcManTasksSelector>
                    </div>
                </template>
            </template>
            <div v-else class="col ">
                <ProcManTasksSelector :task="task">
                </ProcManTasksSelector>
            </div>

        </div>
    </template>

</template>

<script setup>
import ProcManTasksSelector from "./ProcManTasksSelector.vue";
const props = defineProps({
    tasks: { // масив кроків програми
        type: Array,
        required: true,
    },
});
</script>

<style scoped>
.task-wrapper {
    border: 3px solid #8a7c7c;
    padding: 5px;
    margin-bottom: 5px;
    margin-left: 1%;
    margin-right: 1%;
    border-radius: 5px;
    background-color: #e9e9e9;
}
</style>