<template>


    <div class="row">
        <div class="col-3 task-icon-wraper">
            <TaskStateIcon :state="state"> </TaskStateIcon>
        </div>

        <div class="col-9 task-content-wraper">

            <div class="row">
                <div class="col task-step-wraper">
                    <div class="task-step-header">{{ header }}</div>
                </div>
            </div>
            <div class="row">
                <template v-for="step in props.tasks">
                    <ProcessTaskGeneral v-bind="step">
                        <div class="task-step-header">{{ step.header }}</div>
                    </ProcessTaskGeneral>
                </template>
            </div>
            <div class="row">
                <div class="col task-step-header">
                    ↑↑
                </div>
                <div class="col task-step-header">
                    ↑
                </div>
                <div class="col task-step-header">
                    🕐
                </div>
            </div>
        </div>
    </div>



</template>

<script setup>
import TaskStateIcon from "@root/controllers/VueTaskGeneral/TaskStateIcon.vue";
import ProcessTaskGeneral from "@root/controllers/VueTaskGeneral/ProcessTaskGeneral.vue"
const props = defineProps({
    state: {
        type: String,
        required: true,
    },
    header: {
        type: String,
        required: true,
    },
    tasks: {
        type: Array,
        required: true
    }

});
</script>

<style scoped>
.task-step-header {
    text-align: center;
}
</style>