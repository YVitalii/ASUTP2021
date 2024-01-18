buttonTasksAccept.onclick = (e) => {
  let el = document.createElement("pre");
  let data = [];
  for (let i = 0; i < tasks.model.length; i++) {
    data.push(tasks.model[i].getValues());
  }
  el.innerText = JSON.stringify(data);
  tasks.container.appendChild(el);
};
