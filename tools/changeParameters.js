const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
const programFileList = document.getElementById("file-list");
// console.log("Список файлов:");
// console.log(fileList);
// console.log(typeof fileList);
let programObject = [
  {
    id: "1",
    title: "Назва програми",
    description: "Короткий опис",
    date: new Date(),
  },
  {
    r: 2,
    T: 0,
    H: 0,
    Y: 0,
    o: 0,
    i: 0,
    d: 0,
    u: 0
  }
]

// let programObject = [];

let getProgram = (fileName) => {
  var xhrT = new XMLHttpRequest();
  const geturl="/getProgram?folderName="+furnaceId+"&id="+fileName+".log";
  // const geturl="/getProgram?folderName="+furnaceId+"&id="+programObject[0].id+".log"+"&newParameters="+JSON.stringify(programObject);
  xhrT.onload = function(){
  // данные приняты
  let res = JSON.parse(xhrT.responseText);
  // console.log("Дані отримані з файлу:");
  // console.log(res);
  // console.log("Тип даних:");
  // console.log(typeof res);
  programObject = res;
  buildTable();
  }

  xhrT.onerror = function(){
    console.log("Error POST from /getProgram :"+xhrT.status + ': ' + xhrT.statusText)
  } //  xhrT.onerror

  xhrT.open('POST', geturl, true);
      // -- отправляем запрос
  xhrT.send();
}

let logList = document.getElementsByTagName('li');
let selectedList = logList[0];
selectedList.classList.add("active");
getProgram(selectedList.id);

let title = document.getElementById("title");
// console.log(programObject);
title.innerText = programObject[0].title;
title.setAttribute('contenteditable', true);
let description = document.getElementById("description");
description.innerText = programObject[0].description;
description.setAttribute('contenteditable', true);

for (let li of logList) {
  li.onclick = () => {
    selectedList.classList.remove("active");
    selectedList = li;
    selectedList.classList.add("active");
    getProgram(selectedList.id);
    // downloadBtn.download = furnaceId + " " + selectedList.id + ".txt";
    // downloadBtn.href = "/logs/" + furnaceId + "/" + selectedList.id + ".log";
  }
};

newValue = (id, newValue) => {
  var key = id[0];
  var n = parseInt(id.slice(1));
  // console.log(`Key - ${key}. № = ${n}.`);
  programObject[n][key] = newValue;
  // console.log(`Изменён  programObject[${n}][${key}].`);
  // console.log(`Новое значение параметра ${n}${key}: ${newValue}.`);
  // console.log(programObject);
}

let myTableBody = document.getElementById("paramTableBody");

let programSaveChangesBtn = document.getElementById("program-save-changes-btn");
programSaveChangesBtn.onclick = () => {
  if (window.confirm(`Ви точно хочете перезаписати файл?`)) {
    programObject[0].title=title.innerText;
    programObject[0].description=description.innerText;
    // console.log(JSON.stringify(programObject));

    var msgN = 1;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.status == 200) {
        if (msgN == 2) {
          alert(this.responseText);
        }
        msgN++;
      }
      if (this.status == 400) {
        if (msgN == 2) {
          alert(JSON.parse(this.responseText).err.ua);
        }
        msgN++;
      }
    }
    let url = "/saveProgramChanges?folderName="+furnaceId+"&id="+programObject[0].id+".log"+"&newData="+JSON.stringify(programObject);
    console.log(url);
    xhr.open("POST", url, true);
    xhr.send();
  }
}
function findMissingNumber(files) {
  // Функція пошуку першого незайнятого числа в списку файлів, якщо всі числа зайняті створює наступне
  for (let i = 0; i < files.length - 1; i++) {
    if (parseInt(files[i + 1].slice(0, -4)) - parseInt(files[i].slice(0, -4)) !== 1) {
      return parseInt(files[i].slice(0, -4)) + 1;
    }
  }
  return parseInt(files[files.length - 1].slice(0, -4)) + 1;
}
function addListItem(index, text) {
  const newItem = document.createElement("li");
  // newItem.classList.add("list-group-item list-group-item-action list-group-item-info");
  newItem.className = "list-group-item list-group-item-action list-group-item-info";
  newItem.id=text;
  const textNode = document.createTextNode(text);
  newItem.appendChild(textNode);
  newItem.onclick = () => {
    selectedList.classList.remove("active");
    selectedList = newItem;
    selectedList.classList.add("active");
    getProgram(selectedList.id);
  }
  selectedList.classList.remove("active");
  selectedList = newItem;
  selectedList.classList.add("active");
  programFileList.insertBefore(newItem, programFileList.childNodes[index-1]);
  fileList.splice(index-1, 0, text+".log");
}
let programSaveNewBtn = document.getElementById("program-save-new-btn");
programSaveNewBtn.onclick = () => {
  // console.log(`Ім'я першого незайнятого файлу: ${findMissingNumber(fileList)}.log`);
  var fileId = findMissingNumber(fileList);
  programObject[0].id = fileId.toString();
  programObject[0].title=title.innerText;
  programObject[0].description=description.innerText;
  var msgN = 1;
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.status == 200) {
      if (msgN == 2) {
        alert(this.responseText);
        addListItem(fileId, fileId);
      }
      msgN++;
    }
    if (this.status == 400) {
      if (msgN == 2) {
        alert(JSON.parse(this.responseText).err.ua);
      }
      msgN++;
    }
  }
  let url = "/saveProgramNew?folderName="+furnaceId+"&id="+programObject[0].id+".log"+"&newData="+JSON.stringify(programObject);
  // console.log(url);
  xhr.open("POST", url, true);
  xhr.send();
}
let deleteProgramBtn = document.getElementById("delete-program-btn");
deleteProgramBtn.onclick = () => {
  // if (role != "admin") {
  //   alert("У Вас нет прав на удаление файлов.")
  // } else {
    var fileName = selectedList.id;
    if (window.confirm(`Ви точно хочете видалити програму ${fileName}.log?`)) {
      var msgN = 1;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (this.status == 200) {
          if (msgN == 2) {
            alert(this.responseText);
            // console.log(document.getElementById(fileName));
            document.getElementById(fileName).remove();
            fileList.splice(parseInt(fileName)-1, 1);
            // console.log(fileList);
            selectedList = document.getElementById(fileList[0].slice(0, -4));
            selectedList.classList.add("active");
            getProgram(selectedList.id);
          }
          msgN++;
        }
        if (this.status == 400) {
          if (msgN == 2) {
            alert(JSON.parse(this.responseText).err.ua);
          }
          msgN++;
        }
      }
      let url = "/deleteProgram?folderName="+furnaceId+"&id="+fileName+".log";
      // console.log(url);
      xhr.open("POST", url, true);
      xhr.send();
    }
  // }
}
let clearBtn = document.getElementById("clear-parameters");
  clearBtn.onclick = () => {
    programObject.splice(1);
    buildTable();
  }
let sendBtn = document.getElementById("send-new-parameters");
sendBtn.onclick = () => {
  programObject[0].title=title.innerText;
  programObject[0].description=description.innerText;
  // console.log(JSON.stringify(programObject));

  var msgN = 1;
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.status == 200) {
      if (msgN == 2) {
        alert(this.responseText);
      }
      msgN++;
    }
    if (this.status == 400) {
      if (msgN == 2) {
        alert(JSON.parse(this.responseText).err.ua);
      }
      msgN++;
    }
  }
  let url = "/saveProgram?folderName="+furnaceId+"&id="+programObject[0].id+".log"+"&newParameters="+JSON.stringify(programObject);
  console.log(url);
  xhr.open("POST", url, true);
  xhr.send();
}

addStep = (id) => {
  var n = parseInt(id.slice(7));
  var newElem = {};
  for (const key in programObject[n]) {
    newElem[key] = programObject[n][key];
  }
  programObject.splice(n+1, 0, newElem);
  // console.log(programObject);
  buildTable();
}
delStep = (id) => {
  var n = parseInt(id.slice(7));
  programObject.splice(n, 1);
  buildTable();
}
upStep = (id) => {
  var n = parseInt(id.slice(6));
  // console.log(`Поднять шаг №${n}`);
  [programObject[n-1], programObject[n]] = [programObject[n], programObject[n-1]];
  buildTable();
}
downStep = (id) => {
  var n = parseInt(id.slice(8));
  // console.log(`Опустить шаг №${n}`);
  [programObject[n], programObject[n+1]] = [programObject[n+1], programObject[n]];
  buildTable();
}
buildTable = () => {
  myTableBody.innerHTML = null;
  if (programObject.length === 1) {
    programObject.push({
    r: 2,
    T: 0,
    H: 0,
    Y: 0,
    o: 0,
    i: 0,
    d: 0,
    u: 0
    });
  }

  for (var i=1; i<programObject.length; i++) {
    var row = document.createElement("tr");

    var cell = document.createElement("th");
    cell.innerText = i;
    row.appendChild(cell);
    for (const key in programObject[i]) {
      if (key == "r") {
        var inputField = document.createElement("select");
        inputField.classList.add("form-select");
        inputField["aria-label"] = "Вибір закону регулювання";
        var newOption1 = document.createElement("option");
        newOption1.value = 1;
        newOption1.setAttribute('selected', true);
        newOption1.innerHTML = "Пропорційний";
        inputField.appendChild(newOption1);
        var newOption2 = document.createElement("option");
        newOption2.value = 2;
        if (programObject[i]["r"] == 2) {
          newOption2.setAttribute('selected', true);
        }
        newOption2.innerHTML = "Позиційний";
        inputField.appendChild(newOption2);
      } else {
        var inputField = document.createElement("input");
        inputField.type = "number";
        inputField.className = "form-control";
        inputField.min = 0;
      }
      inputField.value = programObject[i][key];
      inputField.id = key + i;
      if (key == "i" || key == "d") {
        if (programObject[i]["r"] == 2) {
          programObject[i][key] = 0;
          inputField.value = 0;
          inputField.disabled = true;
        } else {
          inputField.disabled = false;
        }
      }
      // console.log(`Построен input c id: ${inputField.id}`);
      inputField.onchange = (e) => {
        newValue(e.target.id, parseInt(e.target.value));
        if (e.target.id[0] == "r") {
          buildTable();
        }
      }
      cell = document.createElement("td");
      cell.appendChild(inputField);
      row.appendChild(cell);
    }

    var addsvg = document.createElement("img");
    addsvg.src = "/img/addIcon.svg";
    addsvg.height = 25;
    addsvg.id = `addbtn-${i}`;
    addsvg.onclick = (e) => {
      addStep(e.target.id);
    };
    addsvg.title = "Додати";
    cell = document.createElement("td");
    cell.appendChild(addsvg);

    var delsvg = document.createElement("img");
    delsvg.src = "/img/deleteIcon.svg";
    delsvg.height = 25;
    delsvg.id = `delbtn-${i}`;
    delsvg.onclick = (e) => {
      delStep(e.target.id);
    };
    delsvg.title = "Видалити";
    cell.appendChild(delsvg);

    if (i!=1) {
      var upsvg = document.createElement("img");
      upsvg.src = "/img/upIcon.svg";
      upsvg.height = 25;
      upsvg.id = `upbtn-${i}`;
      upsvg.onclick = (e) => {
        upStep(e.target.id);
      };
      upsvg.title = "Підняти";
      cell.appendChild(upsvg);
    }

    if (i!=programObject.length-1) {
      var downsvg = document.createElement("img");
      downsvg.src = "/img/downIcon.svg";
      downsvg.height = 25;
      downsvg.id = `downbtn-${i}`;
      downsvg.onclick = (e) => {
        downStep(e.target.id);
      };
      downsvg.title = "Опустити";
      cell.appendChild(downsvg);
    }

    row.appendChild(cell);

    myTableBody.appendChild(row);
  }
  title.innerText = programObject[0].title;
  description.innerText = programObject[0].description;
}



buildTable();