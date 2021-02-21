let modalWindow = document.getElementById("modalWindow");
let settingsBtn = document.getElementById("settings");
settingsBtn.onclick = () => {
  modalWindow.style.display = "block";
}
let setNewTimeBtn = document.getElementById("setNewTime");
setNewTimeBtn.onclick = () => {
  let timeStr = document.getElementById("timeStr");
  if(timeStr.value == "") {
    alert("Неправильное значение.");
  } else {
    alert(timeStr.value);
    modalWindow.style.display = "none";
  }
}
let closeModal = document.getElementById("closeModal");
closeModal.onclick = () => {
  modalWindow.style.display = "none";
}