buttons.props = {};
buttons.props = {
  container: buttons.container,
  // id: "buttonsGroup",
  types: myElementsRender,
  reg: {
    id: "buttonsGroup",
    header: {
      ua: `Доступні компоненти`,
      en: `Available components`,
      ru: `Доступные компоненты`,
    },
    type: "buttonGroup",
    comment: {
      ua: `Зробіть свій вибір`,
      en: `Make your choice`,
      ru: `Сделайте свой выбор`,
    },
    regs: {},
  },
};

// ------ buttons description ----------
let btn;

// ------------- new button ------
btn = {
  action: "link",
  reg: {
    classes: "btn btn-primary",
    attributes: { href: buttons.homeURL + "/" },
    id: "bEntityManager",
    header: {
      ua: `Менеджер сутності`,
      en: `Entity manager`,
      ru: `Менеджер сущности`,
    },
    type: "button",
    comment: { ua: `Натисніть`, en: `Push`, ru: `Нажмите` },
  },
};
buttons.props.reg.regs[btn.reg.id] = btn;

// ------------- new button ------
btn = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeURL + "/tasksManager/" },
    id: "bTasksManager",
    header: { ua: `Менеджер задач`, en: `Tasks manager`, ru: `Менеджер задач` },
    type: "button",
    comment: { ua: `Натисніть`, en: `Push`, ru: `Нажмите` },
    //onclick: function () {},
  },
};
buttons.props.reg.regs[btn.reg.id] = btn;

// ------------- new button ------
btn = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeURL + "/processManager/" },
    id: "bProcessManager",
    header: {
      ua: `Менеджер процесу`,
      en: `Process manager`,
      ru: `Менеджер процессов`,
    },
    type: "button",
  },
  onclick: function () {},
};
buttons.props.reg.regs[btn.reg.id] = btn;

// ------------- new button ------
btn = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeURL + "/devicesManager/" },
    id: "bDevicesManager",
    header: {
      ua: `Менеджер приладів`,
      en: `Devices manager`,
      ru: `Менеджер приборов`,
    },
    type: "button",
  },
  onclick: function () {},
};
buttons.props.reg.regs[btn.reg.id] = btn;

// ------------- new button ------
btn = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeURL + "/loggerManager/" },
    id: "bGraphManager",
    header: {
      ua: `Менеджер самописця`,
      en: `Logger manager`,
      ru: `Менеджер самописца`,
    },
    type: "button",
  },
  onclick: function () {},
};
buttons.props.reg.regs[btn.reg.id] = btn;

buttons.elements = new myElementsRender["buttonGroup"](buttons.props);
