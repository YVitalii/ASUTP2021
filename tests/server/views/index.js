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

buttons.props.reg.regs.bTasksManager = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeUrl + "tasksManager/" },
    id: "bTasksManager",
    header: { ua: `Менеджер задач`, en: `Tasks manager`, ru: `Менеджер задач` },
    type: "button",
    comment: { ua: `Натисніть`, en: `Push`, ru: `Нажмите` },
  },

  //onclick: function () {},
};
buttons.props.reg.regs.bProcessManager = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeUrl + "processManager/" },
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

buttons.props.reg.regs.bDevicesManager = {
  action: "link",
  reg: {
    classes: "btn btn-success",
    attributes: { href: buttons.homeUrl + "devicesManager/" },
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

buttons.elements = new myElementsRender["buttonGroup"](buttons.props);
