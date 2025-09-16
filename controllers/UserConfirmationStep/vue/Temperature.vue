<template>
 <h6 :title="title" class="text-center border rounded"> {{ value }} </h6>    
</template>


<script setup>

import { ref, watch} from 'vue';
const props=defineProps({
  value: {
    type: Number,
    default: '?',
  },
  title:{
    type: String,
    default: '?',
  },
});
const value = ref(props.value);
const title = props.title;
watch(() => props.value, (newValue) => {
    if (newValue === undefined || newValue === null) {
        newValue = '?';
    } else {
        let income=newValue;
        newValue= parseFloat(newValue).toFixed(1)
        console.log(`Temperature.vue::newValue(${income}):: ${title}=${newValue}`);
    };
    value.value = newValue;
},{ immediate: true });
</script>
