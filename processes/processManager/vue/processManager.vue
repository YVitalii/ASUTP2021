<template>
    <div class="row">
        <div class="col">
            <p>Program header</p>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <p> Program control panel</p>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <p> Program body</p>
        </div>
    </div>
</template>

<script setup>

import { ref, onMounted } from "vue";
let gLn = "ProcessManager.js::", trace = 1;
const program = defineProps({
    header: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },


});

let urls = {
    home: "/entity/Calibrator_9points/processManager", //відносний шлях, щоб працював vite proxy 
    getProgramState: "/getProgram",
    getActiveStepState: "/getActiveStep",
};

let lang = window.myData.language ? window.myData.language : "ua";

const parseProgram = (p) => {
    program.header = p.header[lang];
    program.description = p.comment[lang];

}



const fetchProgramData = async (url = "", method = "POST", body = {}, headers = {}) => {
    let trace = 1, ln = gLn + `fetchProgramData(${url})::`;

    let dev = true;
    let options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }
    if (trace) { console.log('i', ln, `options=`); console.dir(options); }
    console.log("Fatching data")
    let response = await fetch(url, options);
    if (response.ok) { // якщо HTTP-статус у діапазоні 200-299
        // отримання тіла запиту (див. про цей метод нижче)
        let json = await response.json();
        if (trace) { console.log(ln + `json=`); console.dir(json); }
    } else {
        alert("HTTP-Error: " + response.status);
    }
    return json
} //fetch

onMounted(() => {
    console.log("onMounted started")
    fetchProgramData(urls.home + urls.getProgramState, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
    })
});



</script>

<style scoped></style>