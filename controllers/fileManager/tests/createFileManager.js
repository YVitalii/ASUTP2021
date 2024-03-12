// тестування:
// supervisor  -w '.,./views' -i './tests/testFiles' -e 'js,pug' --no-restart-on exit ./tests/createFileManager.js
// додано в ігнор список шлях до теки з тестовими файлами, інакше супервізор перезапускає програму

const pathResolve = require("path").resolve;
const dummy = require("../../../tools/dummy.js").dummyPromise;
const homeDir = __dirname; //pathResolve("./");
const log = require("../../../tools/log");
let trace = 1,
  ln = "createFileManager()::";
trace ? log("i", ln, `homeDir=`, homeDir) : null;
const ClassFileManager = require("../ClassFileManager.js");
const fileManager = new ClassFileManager({
  homeDir: homeDir + "/testFiles",
  ln: "createFileManager()::",
});

if (trace) {
  log("i", ln, `fileManager=`);
  console.dir(fileManager);
}

(async () => {
  let data = getData();
  let fName = "test1.js";
  try {
    await fileManager.writeFile(fName, data);

    log("i", ln, `Write  filefileName="${fName}" :: Comleted!`);

    let file = await fileManager.readFile(fName);
    if (trace) {
      log("i", ln, `Read fileName="${fName}" :: data=`);
      console.dir(JSON.parse(file));
    }
    await dummy();

    await fileManager.deleteFile(fName);
    log("i", ln, `filefileName="${fName}" :: Was deleted!`);
    fName = "test2.js";
    await fileManager.writeFile(fName, data);
    await dummy();
    // ---- append -------
    await fileManager.appendFile(
      fName,
      "\n Was apended data =" + new Date().toLocaleTimeString()
    );
    await dummy();
    data = "\n Was apended data =" + new Date().toLocaleTimeString();
    await fileManager.appendFile(fName, data);
    log("i", ln, data);
    // ---- readSync --------------------------------
    log("i", ln, "data=", fileManager.readFileSync(fName));
    // ---- exist -------
    log("i", ln, `fileManager.exist(${fName})=`, fileManager.exist(fName));
    log(
      "i",
      ln,
      `fileManager.exist(${"undefinedFile"})=`,
      fileManager.exist("undefinedFile")
    );
  } catch (error) {
    log("e", error);
  }
})();

function getData() {
  let list = [];
  list.push({
    id: "description",
    name: "prg01",
    created: "2023-05-03T11:04:49.715Z",
    note: "Короткий опис програми",
  });

  list.push({
    id: "ClassTask_Heating",
    tT: 80,
    errTmin: -15,
    errTmax: 15,
    regMode: "pid",
    o: 10,
    i: 10,
    d: 10,
  });
  list.push({
    id: "ClassTask_Heating",
    tT: 120,
    errTmin: -10,
    errTmax: 10,
    regMode: "pid",
    o: 20,
    i: 20,
    d: 20,
  });

  list.push({
    id: "TaskNitriding",
    kN: 1.2,
    regMode: "pid",
    o: 10,
    i: 10,
    d: 10,
  });

  return list;
}
