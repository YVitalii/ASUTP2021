buttonTasksAccept.onclick = (e) => {
  //let el = document.createElement("pre");
  let data = tasks.model.getValues();
  //el.innerText = JSON.stringify(data);
  console.log("buttonTasksAccept.onclick");
  console.dir(data);
  // tasks.container.appendChild(el);
};
