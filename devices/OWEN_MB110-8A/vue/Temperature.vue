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
        newValue= parseFloat(newValue).toFixed(1)
    };
    value.value = newValue;
},{ immediate: true });
</script>
