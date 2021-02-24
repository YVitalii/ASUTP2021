let keysArr = keys.split(';');
let temperatures = {};
function refreshData() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                temperatures = JSON.parse(xhr.responseText);
            }
        }
    }
    xhr.open("POST", '/getReg?list=' + keys, true);
    xhr.send();
    // for (let i=0; i<keysArr.length; i++) {
    //     let element = document.getElementById(keysArr[i]);
    //     element.innerHTML = temperatures[keysArr[i]].value;
    // }
    for (let key of keysArr) {
        // console.log(temperatures[key]);
        let element = document.getElementById(key);
        if (temperatures[key].value === null){
          element.innerHTML = "Error";
        } else {
          element.innerHTML = temperatures[key].value;
        }
      }
}
let refreshInterval = setInterval(refreshData, 1000);
// clearInterval(refreshInterval);