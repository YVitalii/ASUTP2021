// періодично перевіряє доступність сервера
// у випадку відсутності відповіді встановлює клас: bg-danger + title

let headerManager = {};
headerManager.container = document.getElementById("header");
headerManager.homeUrl = "/ping";
headerManager.connected = undefined;
headerManager.ln = "headerManager::";
headerManager.testConnection = async () => {
  let result;
  try {
    let response = await fetch(headerManager.homeUrl, {
      method: "POST",
      headers: { "Content-type": "application/json;charset=utf-8" },
      body: JSON.stringify({}), //  ,
    });
    if (response.status === 200 || response.status === 400) {
      // отримуємо результат
      result = await response.json();
    }
    if (!headerManager.connected || headerManager.connected === undefined) {
      headerManager.container.classList.remove("bg-danger");
      headerManager.container.setAttribute("title", result.data[lang]);
    }
  } catch (error) {
    let msg = {
      ua: `Помилка сервера!! ${error.message}`,
      en: `Server error!! ${error.message}`,
      ru: `Ошибка сервера!! ${error.message}`,
    }[lang];
    if (headerManager.connected || headerManager.connected === undefined) {
      headerManager.container.classList.add("bg-danger");
      headerManager.container.setAttribute("title", msg);
    }
    console.error(headerManager.ln + msg);
  }
  setTimeout(() => headerManager.testConnection(), 20 * 1000);
};
setTimeout(() => headerManager.testConnection(), 3000);
