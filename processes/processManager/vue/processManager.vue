<template>
    <template v-if="program.value != null">
        <div class="row">
            <div class="col">
                <p>Program name:{{ program.header.value }}
                    <small>{{ program.description.value }}</small>
                </p>
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
    <template v-else>
        Завантаження програми...
    </template>
</template>

<script setup>

import { ref, onMounted } from "vue";

import propsDefine from "./processManager_propsDefine.mjs"
import programTransform from "./programTransform.mjs";

let gLn = "ProcessManager.js::", trace = 1;
if (trace) { console.log('i', gLn, `propsDefine=`); console.dir(propsDefine); }

const program = ref(null);

if (trace) { console.log(gLn + `program.value.header=`); console.dir(program.value.header); }

let urls = {
    home: "/entity/Calibrator_9points/processManager", //відносний шлях, щоб працював vite proxy 
    getProgramState: "/getProgram",
    getActiveStepState: "/getActiveStep",
};

let lang = window.myData.language ? window.myData.language : "ua";

setTimeout(function () { program.value.header = "456"; console.log("setTimeout switched!") }, 3000);

async function initProgram() {
    let trace = 1, ln = gLn + `getProgram()::`;
    try {
        let res = await fetchProgramData(urls.home + urls.getProgramState, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
        });
        program = programTransform(res, props);
        if (trace) { console.log(ln + `props=`); console.dir(props); }

    } catch (error) {

    }
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
        return json
    } else {
        let err = "HTTP-Error: " + response.status
        console.error(err);
        return Promise.reject(err)
    }

} //fetch

onMounted(() => {
    console.log("onMounted started")
    initProgram();
});



</script>

<style scoped></style>