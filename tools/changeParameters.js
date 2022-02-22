const pathArr = window.location.href.split('/');
const furnaceId = pathArr[pathArr.length-1];
console.log("Список файлов:");
console.log(fileList);
let testParameters = [
  {
    id: "1",
    title: "Отпуск Колес",
    description: "Колеса диам. 200, Ст20",
    date: new Date(),
  },
  {
    T: 120,
    H: 40,
    Y: 180
  },
  {
    T: 470,
    H: 120,
    Y: 30
  },
  {
    T: 250,
    H: 40,
    Y: 210
  }
]

let logList = document.getElementsByTagName('li');
let selectedList = logList[0];
selectedList.classList.add("active");
for (let li of logList) {
  li.onclick = () => {
    selectedList.classList.remove("active");
    selectedList = li;
    selectedList.classList.add("active");
    buildTable();
    // downloadBtn.download = furnaceId + " " + selectedList.id + ".txt";
    // downloadBtn.href = "/logs/" + furnaceId + "/" + selectedList.id + ".log";
  }
};

let title = document.getElementById("title");
title.innerText = testParameters[0].title;
title.title = testParameters[0].description;

newValue = (id, newValue) => {
  var key = id[0];
  var n = parseInt(id.slice(1));
  // console.log(`Key - ${key}. № = ${n}.`);
  testParameters[n][key] = newValue;
  // console.log(`Изменён  testParameters[${n}][${key}].`);
  // console.log(`Новое значение параметра ${n}${key}: ${newValue}.`);
  // console.log(testParameters);
}

let myTableBody = document.getElementById("paramTableBody");

let clearBtn = document.getElementById("clear-parameters");
clearBtn.onclick = () => {
  testParameters.splice(1);
  buildTable();
}
// let sendBtn = document.getElementById("send-new-parameters");
// sendBtn.onclick = () => {
//   console.log(JSON.stringify(testParameters));

//   var msgN = 1;
//   var xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = function () {
//     if (this.status == 200) {
//       if (msgN == 2) {
//         alert(this.responseText);
//       }
//       msgN++;
//     }
//     if (this.status == 400) {
//       if (msgN == 2) {
//         alert(JSON.parse(this.responseText).err.ru);
//       }
//       msgN++;
//     }
//   }
//   let url = "/saveProgram?folderName="+furnaceId+"&id="+testParameters[0].id+".log"+"&newParameters="+JSON.stringify(testParameters);
//   console.log(url);
//   xhr.open("POST", url, true);
//   xhr.send();
// }

addStep = (id) => {
  var n = parseInt(id.slice(7));
  var newElem = {};
  for (const key in testParameters[n]) {
    newElem[key] = testParameters[n][key];
  }
  testParameters.splice(n+1, 0, newElem);
  console.log(testParameters);
  buildTable();
}
delStep = (id) => {
  var n = parseInt(id.slice(7));
  testParameters.splice(n, 1);
  buildTable();
}
upStep = (id) => {
  var n = parseInt(id.slice(6));
  // console.log(`Поднять шаг №${n}`);
  [testParameters[n-1], testParameters[n]] = [testParameters[n], testParameters[n-1]];
  buildTable();
}
downStep = (id) => {
  var n = parseInt(id.slice(8));
  // console.log(`Опустить шаг №${n}`);
  [testParameters[n], testParameters[n+1]] = [testParameters[n+1], testParameters[n]];
  buildTable();
}
buildTable = () => {
  myTableBody.innerHTML = null;
  if (testParameters.length === 1) {
    testParameters.push({
      T: 0,
      H: 0,
      Y: 0
    });
  }
  console.log(`Длина таблицы параметров: ${testParameters.length}`);

  for (var i=1; i<testParameters.length; i++) {
    var row = document.createElement("tr");

    var cell = document.createElement("th");
    cell.innerText = i;
    row.appendChild(cell);
    for (const key in testParameters[i]) {
      var inputField = document.createElement("input");
      inputField.type = "number";
      inputField.className = "form-control";
      inputField.min = 0;
      inputField.value = testParameters[i][key];
      inputField.id = key + i;
      // console.log(`Построен input c id: ${inputField.id}`);
      inputField.onchange = (e) => {
        newValue(e.target.id, parseInt(e.target.value));
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
    addsvg.title = "Добавить";
    cell = document.createElement("td");
    cell.appendChild(addsvg);

    var delsvg = document.createElement("img");
    delsvg.src = "/img/deleteIcon.svg";
    delsvg.height = 25;
    delsvg.id = `delbtn-${i}`;
    delsvg.onclick = (e) => {
      delStep(e.target.id);
    };
    delsvg.title = "Удалить";
    cell.appendChild(delsvg);

    if (i!=1) {
      var upsvg = document.createElement("img");
      upsvg.src = "/img/upIcon.svg";
      upsvg.height = 25;
      upsvg.id = `upbtn-${i}`;
      upsvg.onclick = (e) => {
        upStep(e.target.id);
      };
      upsvg.title = "Поднять";
      cell.appendChild(upsvg);
    }

    if (i!=testParameters.length-1) {
      var downsvg = document.createElement("img");
      downsvg.src = "/img/downIcon.svg";
      downsvg.height = 25;
      downsvg.id = `downbtn-${i}`;
      downsvg.onclick = (e) => {
        downStep(e.target.id);
      };
      downsvg.title = "Опустить";
      cell.appendChild(downsvg);
    }

    row.appendChild(cell);

    myTableBody.appendChild(row);
  }
}



buildTable();