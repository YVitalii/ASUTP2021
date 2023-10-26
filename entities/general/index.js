/** модуль склдає список всіх сутностей в що представлені в АСУТП */

const entities = {};

// загальний опис
entities.about.fullName = {
  ua: `Список об'єктів`,
  en: `The list of Objects`,
  ru: `Список обьектов`,
};

// поки що костиль, потрібно зробити автоматичне сканування та додавання сутностей
// з теки з сутностями
entities[`SScham-7-12_2023`] = require("./SScham-7-12_2023");

entities.about.htmlFull = () => {};

module.exports = entities;
