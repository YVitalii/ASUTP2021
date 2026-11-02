/**
 * Тестовий шаблон програми для MermaidTools.
 *
 * tasks — дерево кроків:
 *   об'єкт — один крок;
 *   масив  — група. Перший елемент групи — stepDescription:
 *     parallel: false — кроки групи йдуть послідовно;
 *     parallel: true  — кроки групи йдуть паралельно.
 * Вкладений масив — окрема гілка всередині групи.
 *
 * ProsessStep_SimpleBadge повторює знімок ClassStep.getState():
 * _id, header, comment, note, startTime, duration.
 */

/** @param {string} ua @param {string} [en] @param {string} [ru] */
function lang(ua, en = ua, ru = ua) {
  return { ua, en, ru };
}

/**
 * Крок-бейдж у стані очікування.
 * @param {string} id
 * @param {string} title підпис вузла
 */
function badge(id, title) {
  return {
    id,
    type: "ProsessStep_SimpleBadge",
    _id: "waiting",
    header: lang(title),
    comment: lang(""),
    note: lang("Очікування", "Waiting", "Ожидание"),
    startTime: null,
    duration: "00d00:00:00",
  };
}

/**
 * Опис групи кроків.
 * @param {string} id
 * @param {boolean} parallel
 * @param {string} title
 */
function description(id, parallel, title) {
  return {
    id,
    type: "stepDescription",
    parallel,
    header: lang(title),
  };
}

const tasks = [
  description("t0", false, "Послідовне виконання"),
  badge("t1", "Крок t1"),
  [
    description("t2-0", true, "Паралельне виконання"),
    badge("t2-1", "Крок t2-1"),
    badge("t2-2", "Крок t2-2"),
    [
      badge("t2-3-1", "Крок t2-3-1"),
      badge("t2-3-2", "Крок t2-3-2"),
      badge("t2-3-3", "Крок t2-3-3"),
    ],
  ],
  [
    description("t3-0", false, "Послідовна гілка"),
    badge("t3-1", "Крок t3-1"),
    badge("t3-2", "Крок t3-2"),
  ],
  badge("t4", "Крок t4"),
];

module.exports = tasks;

if (require.main === module) {
  console.dir(tasks, { depth: null });
}
