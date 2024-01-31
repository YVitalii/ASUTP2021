buttonTasksAccept.onclick = (e) => {
  let el = document.createElement("pre");
  let modelData = tasks.model.data;
  let data = [];
  for (let i = 1; i < modelData.length; i++) {
    data.push(modelData[i].getValues());
  }
  el.innerText = JSON.stringify(data);
  tasks.container.appendChild(el);
};
