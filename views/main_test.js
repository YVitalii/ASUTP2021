const testCompile = require("./testCompile.js");
let options = {
  lang: "ua",
  pageTitle: { ua: `Header Test`, en: `Header Test`, ru: `Header Test` },
  body: "<p>Це тестовий вміст сторінки</p>",
};
testCompile(__dirname + "\\main.pug", options);
