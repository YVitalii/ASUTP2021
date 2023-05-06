let analogOutput = document.getElementById("analog-output");
let analogOutputValue = document.getElementById("analog-output-value");
let discreteOutput = document.getElementById("discrete-output");
let discreteInput = document.getElementById("discrete-input");
let analogInput = document.getElementById("analog-input");

let newOutputSignal = document.getElementById("new-output-signal");
newOutputSignal.onclick = () => {
  var newSignal = [];
  newSignal.push({AO: analogOutput.value});
  newSignal.push({IO: discreteOutput.checked});
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
  let url = "/newAkonOutputSignal"+"?newSignal="+JSON.stringify(newSignal);
  xhr.open("POST", url, true);
  xhr.send();
  changeDiscreteInputState(discreteOutput.checked);
  changeAnalogInputState(parseFloat(analogOutput.value));
  console.log(parseFloat(analogOutput.value));
}

let changeDiscreteInputState = (newState) => {
  if (newState) {
    discreteInput.innerHTML = "Дискретний вхід замкнено.";
    discreteInput.style.color = "green";
  } else {
    discreteInput.innerHTML = "Дискретний вхід розімкнено.";
    discreteInput.style.color = "red";
  }
}

let changeAnalogInputState = (newValue) => {
  analogInput.innerHTML = `${newValue} мА.`;
  // analogInput.setAttribute(aria-valuenow, toString(newValue));
  analogInput.style.width = `${newValue*5}%`;
}

analogOutput.onchange = () => {
  analogOutputValue.innerHTML = `Нове значення: ${analogOutput.value} мА.`;
}