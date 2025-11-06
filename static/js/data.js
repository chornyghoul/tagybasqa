// Демо-данные: специальности, темы, материалы, тесты
window.AppData = (function() {
  const specialties = [
    { code: '0e120100', key: 'software_provision', title: 'Software Provision', desc: 'Программирование, инженерия ПО, тестирование.', color: '#eff6ff' },
    { code: '0e130200', key: 'info_security', title: 'Information Security Systems', desc: 'Криптография, анализ уязвимостей, защита.', color: '#fef2f2' },
    { code: '0e140300', key: 'radio_engineering', title: 'Radio Engineering', desc: 'Сигналы, электроника, схемотехника.', color: '#ecfeff' },
    { code: '0e150400', key: 'machinery_ops', title: 'Operation Maintenance of Machinery Equipment', desc: 'Эксплуатация и обслуживание, оборудование.', color: '#f0fdf4' },
    { code: '0e150500', key: 'info_networks', title: 'Information Networks', desc: 'Сети, протоколы, маршрутизация.', color: '#fff7ed' },
  ];

  const topics = {
    software_provision: [
      { id: 'sp-basics', title: 'Основы программирования', level: 'начальный', type: 'theory', tags: ['языки', 'переменные', 'алгоритмы'] },
      { id: 'sp-dev', title: 'Разработка ПО', level: 'средний', type: 'practice', tags: ['git', 'ci/cd', 'паттерны'] },
      { id: 'sp-test', title: 'Тестирование и отладка', level: 'средний', type: 'test', tags: ['юнит', 'интеграция', 'ошибки'] },
    ],
    info_security: [
      { id: 'is-sec', title: 'Основы ИБ', level: 'начальный', type: 'theory', tags: ['модели', 'угрозы'] },
      { id: 'is-crypto', title: 'Криптография', level: 'продвинутый', type: 'theory', tags: ['rsa', 'aes', 'хеш'] },
      { id: 'is-audit', title: 'Анализ уязвимостей', level: 'средний', type: 'practice', tags: ['pentest', 'сканирование'] },
    ],
    radio_engineering: [
      { id: 're-signal', title: 'Теория сигналов', level: 'начальный', type: 'theory', tags: ['фурье', 'шум'] },
      { id: 're-circuit', title: 'Схемотехника', level: 'средний', type: 'practice', tags: ['усилители', 'фильтры'] },
    ],
    machinery_ops: [
      { id: 'mo-ops', title: 'Эксплуатация оборудования', level: 'начальный', type: 'theory', tags: ['техобслуживание'] },
      { id: 'mo-safety', title: 'Техника безопасности', level: 'начальный', type: 'test', tags: ['охрана труда'] },
    ],
    info_networks: [
      { id: 'in-basics', title: 'Основы сетей', level: 'начальный', type: 'theory', tags: ['osi', 'tcp/ip', 'маршрутизация'] },
      { id: 'in-routing', title: 'Маршрутизация', level: 'средний', type: 'practice', tags: ['ospf', 'bgp'] },
      { id: 'in-sec', title: 'Безопасность сетей', level: 'средний', type: 'test', tags: ['firewall', 'ids/ips'] },
    ],
  };

  const materials = {
    'sp-basics': [
      { id: 'm1', kind: 'theory', title: 'Переменные и типы данных', content: 'Базовые типы, операции, приведение типов.' },
      { id: 'm2', kind: 'practice', title: 'Задачи на циклы', content: 'Практика по for/while, вычисления.' },
    ],
    'in-basics': [
      { id: 'm3', kind: 'theory', title: 'Модель OSI', content: '7 уровней: физический до прикладного.' },
    ],
  };

  const tests = {
    'sp-test': [
      { id: 't1', question: 'Что делает юнит-тест?', options: ['Тестирует модуль в изоляции', 'Тестирует UI вручную'], answer: 0, explain: 'Юнит-тест проверяет отдельный модуль/функцию в изоляции.' }
    ],
    'in-sec': [
      { id: 't2', question: 'Назначение брандмауэра?', options: ['Фильтрация трафика', 'Хранение паролей'], answer: 0, explain: 'Фильтрация входящего/исходящего трафика по правилам.' }
    ]
  };

  // Подсказки для поиска (автодополнение)
  const searchIndex = [];
  specialties.forEach(sp => {
    searchIndex.push({ type: 'specialty', key: sp.key, label: `${sp.title} (${sp.code})`, code: sp.code });
  });
  Object.entries(topics).forEach(([key, items]) => {
    items.forEach(t => {
      searchIndex.push({ type: 'topic', key, id: t.id, label: `${t.title} — ${key}`, level: t.level, kind: t.type, tags: t.tags });
    });
  });

  return { specialties, topics, materials, tests, searchIndex };
})();
