let modalWindow = document.getElementById("modalWindow");
let settingsBtn = document.getElementById("settings");
settingsBtn.onclick = () => {
  modalWindow.style.display = "block";
}
let setNewTimeBtn = document.getElementById("setNewTime");
setNewTimeBtn.onclick = () => {
  let timeStr = document.getElementById("timeStr");
  if(timeStr.value == "") {
    alert("Неправильне значення.");
  } else {
    let newTime = new Date(timeStr.value);
    // alert(newTime.toISOString());
    var xhr = new XMLHttpRequest();
    let url = "/setTime?time="+newTime.toISOString();
    xhr.open("POST", url, true);
    xhr.send();
    modalWindow.style.display = "none";
  }
}
let closeModal = document.getElementById("closeModal");
closeModal.onclick = () => {
  modalWindow.style.display = "none";
}