<template>
    <template v-if="program != null">
        <div class="row">
            <div class="col">
                <ProcMan_Header :name="program.header" :description="program.description" :state="program.state">

                </ProcMan_Header>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <ProcMan_ControlPanel :btnStartEnable="program.btnStartEnable" :programLength="program.steps.length"
                    @click="clickStartBtn">

                </ProcMan_ControlPanel>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <ProcManProgram :tasks="program.steps">

                </ProcManProgram>
            </div>
        </div>
    </template>
    <template v-else>
        Завантаження програми...
    </template>
</template>

<script setup>

import { ref, onMounted } from "vue";
import ProcMan_ControlPanel from "./ProcMan_ControlPanel.vue";
import ProcMan_Header from "./ProcMan_Header.vue";
import ProcManProgram from "./ProcManProgram.vue";
import propsDefine from "./ProcessMan_propsDefine.mjs"
import programTransform from "./programTransform.mjs";
import rawData from "./rawProgramFromServer.mjs"; //сирі дані для тестування
let gLn = "ProcessManager.js::", trace = 1;
if (trace) { console.log('i', gLn, `propsDefine=`); console.dir(propsDefine); }

const program = ref(null);

function clickStartBtn(stepN) {
    program.value.btnStartEnable = !program.value.btnStartEnable;
    trace ? console.log(gLn + `program.value.btnStartEnable=${program.value.btnStartEnable}`) : null;
    program.value.state = program.value.btnStartEnable ? 'stoped' : 'going';
    trace ? console.log(gLn + `program.value.state=${program.value.state}`) : null;
    console.log('Control Panel clicked: start from step', stepN)
};

// if (trace) { console.log(gLn + `program.value.header=`); console.dir(program.value.header); }

let urls = {
    home: "/entity/Calibrator_9points/processManager", //відносний шлях, щоб працював vite proxy 
    getProgramState: "/getProgram",
    getActiveStepState: "/getActiveStep",
};

let lang = window.myData.language ? window.myData.language : "ua";

setTimeout(function () {
    program.value.header = "456";
    // program.value.state = "going";
    console.log("setTimeout switched!")
}, 5000);

async function initProgram() {
    let dev = 1, trace = 1, ln = gLn + `initProgram()::`;

    try {
        let res;
        if (dev) { res = rawData; }
        else {
            res = await fetchProgramData(urls.home + urls.getProgramState, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
            });
        }
        // res = await fetchProgramData(urls.home + urls.getProgramState, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json;charset=utf-8'
        //     },
        // });
        if (trace) { console.log(ln + `Server response: res=`); console.dir(res); }
        let transformedProgram = programTransform(res);
        if (trace) { console.log(ln + `transformedProgram=`); console.dir(transformedProgram); }
        program.value = transformedProgram;
        if (trace) { console.log(ln + `ref(program)=`); console.dir(program); }
    } catch (error) {
        console.error(ln + `error=`); console.dir(error);
    }
}

const fetchProgramData = async (url = "", method = "POST", body = {}, headers = {}) => {
    let trace = 1, ln = gLn + `fetchProgramData(${url})::`;
    trace ? console.log('i', ln, `Started.`,) : null;
    let dev = true;
    let options = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    };
    if (trace) { console.log('i', ln, `options=`); console.dir(options); }
    console.log("Fatching data");
    let response = await fetch(url, options);
    if (response.ok) { // якщо HTTP-статус у діапазоні 200-299
        // отримання тіла запиту (див. про цей метод нижче)
        let json = await response.json();
        if (trace) { console.log(ln + `json=`); console.dir(json); }
        return json
    } else {
        let err = "HTTP-Error: " + response.status;
        console.error(err);
        return Promise.reject(err);
    }
} //fetch

onMounted(() => {
    console.log("onMounted started")
    initProgram();
});

</script>

<style scoped></style>