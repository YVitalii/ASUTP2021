<template>
    <TaskStateIcon :state="state">

    </TaskStateIcon>
    <div v-if="state == 'heating-quick'" class="svg-wrapper">
        ↑↑
    </div>
    <div v-if="state == 'heating'" class="svg-wrapper">
        ↑
    </div>
    <div v-if="state == 'holding'" class="svg-wrapper">
        🕐
    </div>
    <!-- <div v-else-if="state == 'stoped'" class="svg-wrapper">
       
    </div>
    <div v-else-if="state == 'error'" class="svg-wrapper">
      
    </div> -->


</template>

<script setup>
import TaskStateIcon from "@root/controllers/VueTaskGeneral/TaskStateIcon.vue";

let props = defineProps({
    state: {
        type: String,
        required: true,
        validator: (value) => {
            return ["waiting", "going", "finished", "stoped", "error"].includes(value);
        }
    }
});
</script>

<style scoped>
.svg-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Сам SVG елемент має фіксований розмір */
svg {
    width: auto;
    height: 100%;
    flex-shrink: 0;
    /* `viewBox` у SVG забезпечує масштабування контенту всередині */
}
</style>