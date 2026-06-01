/**
 * TAGYBASQA — lang-lab.js
 * ═══════════════════════════════════════════════════════════════════
 * Модуль "Языковая лаборатория" — 5 уникальных интерактивных фич
 * для изучения языков программирования (Python / JavaScript)
 * в соответствии с целью платформы Tagybasqa.
 *
 * ФИЧИ:
 *  1. 🧠 Code Duel   — поединок с AI: кто быстрее решит задачу
 *  2. 🔍 Bug Hunter  — найди ошибку в коде (визуальный отладчик)
 *  3. 🏗️ Code Craft   — собери программу из блоков (drag-and-drop)
 *  4. 📖 Syntax Story — изучи синтаксис через интерактивную историю
 *  5. 🗺️ Skill Map    — карта навыков с разблокировкой тем
 *
 * Подключение в index.html:
 *   <script type="module" src="./static/js/lang-lab.js"></script>
 *
 * Инициализируется в отдельном div:
 *   <div id="lang-lab-root"></div>
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Конфигурация ─────────────────────────────────────────────────
const ROOT_SEL = '#lang-lab-root';
const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

// ─── XP-система ──────────────────────────────────────────────────
const XP = {
  get: () => { try { return JSON.parse(localStorage.getItem('tgb_lab_xp') || '{"xp":0,"level":1,"badges":[]}'); } catch { return {xp:0,level:1,badges:[]}; } },
  add(pts, badge) {
    const d = this.get();
    d.xp += pts;
    d.level = Math.floor(d.xp / 200) + 1;
    if (badge && !d.badges.includes(badge)) d.badges.push(badge);
    localStorage.setItem('tgb_lab_xp', JSON.stringify(d));
    this.toast(`+${pts} XP${badge ? ' · ' + badge : ''}`);
    return d;
  },
  toast(msg) {
    let t = document.getElementById('lab-xp-toast');
    if (!t) { t = document.createElement('div'); t.id = 'lab-xp-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'lab-xp-toast show';
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2500);
  }
};

// ─── Данные задач ─────────────────────────────────────────────────
const CODE_DUEL_TASKS = [
  {
    id: 'cd1', lang: 'python', title: 'Сумма чисел',
    description: 'Напишите функцию `sum_list(nums)`, которая возвращает сумму всех элементов списка.',
    starter: 'def sum_list(nums):\n    # Ваш код здесь\n    pass',
    tests: [
      { input: '[1, 2, 3]', expected: '6' },
      { input: '[10, -5, 3]', expected: '8' },
      { input: '[]', expected: '0' },
    ],
    hint: 'Используйте встроенную функцию sum() или цикл for',
    solution: 'def sum_list(nums):\n    return sum(nums)',
    xp: 50
  },
  {
    id: 'cd2', lang: 'python', title: 'Палиндром',
    description: 'Напишите функцию `is_palindrome(s)`, которая возвращает True если строка является палиндромом.',
    starter: 'def is_palindrome(s):\n    # Ваш код здесь\n    pass',
    tests: [
      { input: '"racecar"', expected: 'True' },
      { input: '"hello"', expected: 'False' },
      { input: '"level"', expected: 'True' },
    ],
    hint: 'Сравните строку с её обратной версией: s == s[::-1]',
    solution: 'def is_palindrome(s):\n    return s == s[::-1]',
    xp: 60
  },
  {
    id: 'cd3', lang: 'javascript', title: 'FizzBuzz',
    description: 'Напишите функцию `fizzBuzz(n)`, которая возвращает массив от 1 до n. Кратные 3 → "Fizz", 5 → "Buzz", оба → "FizzBuzz".',
    starter: 'function fizzBuzz(n) {\n  // Ваш код здесь\n}',
    tests: [
      { input: '5', expected: '[1, 2, "Fizz", 4, "Buzz"]' },
      { input: '15', expected: '...FizzBuzz на 15-м' },
    ],
    hint: 'Используйте оператор % (остаток) и проверяйте сначала оба условия',
    solution: 'function fizzBuzz(n) {\n  return Array.from({length: n}, (_, i) => {\n    const k = i + 1;\n    if (k % 15 === 0) return "FizzBuzz";\n    if (k % 3 === 0) return "Fizz";\n    if (k % 5 === 0) return "Buzz";\n    return k;\n  });\n}',
    xp: 70
  },
  {
    id: 'cd4', lang: 'python', title: 'Факториал',
    description: 'Напишите функцию `factorial(n)` для вычисления факториала числа n рекурсивно.',
    starter: 'def factorial(n):\n    # Ваш код здесь\n    pass',
    tests: [
      { input: '0', expected: '1' },
      { input: '5', expected: '120' },
      { input: '10', expected: '3628800' },
    ],
    hint: 'Базовый случай: factorial(0) = 1. Рекурсия: n * factorial(n-1)',
    solution: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)',
    xp: 65
  }
];

const BUG_TASKS = [
  {
    id: 'bug1', lang: 'python', title: 'Сломанный цикл',
    description: 'Эта функция должна вернуть список квадратов чисел от 1 до n. Найди баг!',
    buggy_code: `def squares(n):
    result = []
    for i in range(n):
        result.append(i * i)
    return result`,
    fixed_code: `def squares(n):
    result = []
    for i in range(1, n + 1):
        result.append(i * i)
    return result`,
    bug_line: 3,
    bug_explanation: 'range(n) начинается с 0, а нужно с 1. И заканчивается на n-1, а нужно на n. Правильно: range(1, n + 1)',
    xp: 40
  },
  {
    id: 'bug2', lang: 'python', title: 'Проблема с отступом',
    description: 'Функция подсчёта суммы элементов. Что-то не так с логикой...',
    buggy_code: `def sum_positive(nums):
    total = 0
    for num in nums:
        if num > 0:
            total += num
        return total`,
    fixed_code: `def sum_positive(nums):
    total = 0
    for num in nums:
        if num > 0:
            total += num
    return total`,
    bug_line: 6,
    bug_explanation: 'return total имеет лишний отступ — он внутри цикла for! Функция завершается на первой итерации. Правильно: убрать один уровень отступа у return.',
    xp: 45
  },
  {
    id: 'bug3', lang: 'javascript', title: 'Сравнение типов',
    description: 'Функция проверки равенства значений даёт неожиданные результаты...',
    buggy_code: `function isEqual(a, b) {
  if (a == b) {
    return true;
  }
  return false;
}

console.log(isEqual(0, false)); // true — это правильно?`,
    fixed_code: `function isEqual(a, b) {
  if (a === b) {
    return true;
  }
  return false;
}

console.log(isEqual(0, false)); // false`,
    bug_line: 2,
    bug_explanation: '== делает приведение типов: 0 == false = true (неожиданно!). Используй === (строгое равенство) — оно сравнивает и значение, и тип.',
    xp: 50
  },
  {
    id: 'bug4', lang: 'python', title: 'Мутабельный аргумент',
    description: 'Классическая ловушка Python! Функция добавления элемента в список ведёт себя странно...',
    buggy_code: `def add_item(item, lst=[]):
    lst.append(item)
    return lst

print(add_item(1))  # [1]
print(add_item(2))  # [1, 2] ← Почему?!`,
    fixed_code: `def add_item(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

print(add_item(1))  # [1]
print(add_item(2))  # [2] ✓`,
    bug_line: 1,
    bug_explanation: 'Изменяемые объекты (списки) как значения по умолчанию создаются ОДИН РАЗ при определении функции. Все вызовы делят один и тот же список! Решение: использовать None и создавать список внутри.',
    xp: 60
  }
];

const STORIES = [
  {
    id: 's1', title: 'Переменные: Хранилище данных', emoji: '📦',
    lang: 'python', xp: 30,
    chapters: [
      {
        text: 'Представь, что переменная — это **коробка с наклейкой**. На наклейке написано имя, а внутри — значение.',
        code: null,
        question: null
      },
      {
        text: 'Создадим нашу первую переменную — имя героя:',
        code: 'hero_name = "Алибек"\nprint(hero_name)  # Алибек',
        question: {
          q: 'Что выведет этот код?',
          opts: ['"hero_name"', '"Алибек"', 'hero_name', 'Ошибка'],
          correct: 1,
          exp: 'print() выводит значение переменной, а не её имя. Переменная hero_name хранит строку "Алибек".'
        }
      },
      {
        text: 'Переменная может изменить своё значение — коробку можно перенаполнить!',
        code: 'score = 0\nprint(score)   # 0\nscore = score + 10\nprint(score)   # 10',
        question: {
          q: 'Какое значение score после выполнения кода?',
          opts: ['0', '10', 'score + 10', 'Ошибка'],
          correct: 1,
          exp: 'score сначала равен 0, потом мы прибавляем 10. score = score + 10 = 0 + 10 = 10.'
        }
      },
      {
        text: 'Python может хранить разные типы данных:',
        code: 'name = "Tagybasqa"    # str — строка\nlevel = 7              # int — целое число\nrating = 4.9           # float — дробное\nis_active = True       # bool — логическое',
        question: {
          q: 'Какой тип у переменной level = 7?',
          opts: ['str', 'float', 'int', 'bool'],
          correct: 2,
          exp: 'Целые числа без точки — это тип int (integer). float — числа с точкой, str — строки в кавычках.'
        }
      }
    ]
  },
  {
    id: 's2', title: 'Условия: Развилка на дороге', emoji: '🔀',
    lang: 'python', xp: 35,
    chapters: [
      {
        text: 'Условный оператор if — это **развилка на дороге**. Программа выбирает путь в зависимости от условия.',
        code: null, question: null
      },
      {
        text: 'Базовая структура if-else:',
        code: 'age = 17\n\nif age >= 18:\n    print("Взрослый")\nelse:\n    print("Несовершеннолетний")',
        question: {
          q: 'Что выведет программа при age = 17?',
          opts: ['Взрослый', 'Несовершеннолетний', 'Ошибка', 'Ничего'],
          correct: 1,
          exp: '17 >= 18 — ложь, поэтому выполняется блок else: "Несовершеннолетний".'
        }
      },
      {
        text: 'elif — дополнительная проверка между if и else:',
        code: 'score = 75\n\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)',
        question: {
          q: 'Какую оценку получит пользователь со score = 75?',
          opts: ['A', 'B', 'C', 'Ошибка'],
          correct: 1,
          exp: '75 >= 90 — ложь. 75 >= 75 — истина! Выполняется grade = "B".'
        }
      }
    ]
  },
  {
    id: 's3', title: 'Циклы: Повторения без усталости', emoji: '🔄',
    lang: 'python', xp: 35,
    chapters: [
      {
        text: 'Цикл — это **машина повторений**. Вместо того чтобы писать одно и то же 100 раз, пишем один раз в цикле.',
        code: null, question: null
      },
      {
        text: 'Цикл for проходит по каждому элементу:',
        code: 'fruits = ["яблоко", "банан", "вишня"]\n\nfor fruit in fruits:\n    print(fruit)',
        question: {
          q: 'Сколько раз выполнится print(fruit)?',
          opts: ['1', '2', '3', '4'],
          correct: 2,
          exp: 'Цикл for перебирает каждый элемент списка. В списке 3 элемента → 3 итерации.'
        }
      },
      {
        text: 'range() генерирует последовательность чисел:',
        code: 'for i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\n# range(start, stop, step)\nfor i in range(2, 10, 2):\n    print(i)  # 2, 4, 6, 8',
        question: {
          q: 'Какие числа выводит range(2, 10, 2)?',
          opts: ['2, 4, 6, 8, 10', '2, 4, 6, 8', '0, 2, 4, 6, 8', '1, 3, 5, 7, 9'],
          correct: 1,
          exp: 'range(start=2, stop=10, step=2): начинаем с 2, прыгаем по 2, НЕ включая 10. Результат: 2, 4, 6, 8.'
        }
      }
    ]
  }
];

const CODE_BLOCKS = {
  python: {
    'fibonacci': {
      title: 'Числа Фибоначчи',
      description: 'Собери программу для вывода чисел Фибоначчи',
      correct_order: ['def fibonacci(n):', '    a, b = 0, 1', '    result = []', '    for _ in range(n):', '        result.append(a)', '        a, b = b, a + b', '    return result'],
      blocks: ['def fibonacci(n):', '    for _ in range(n):', '    result = []', '    return result', '        result.append(a)', '    a, b = 0, 1', '        a, b = b, a + b'],
      xp: 55
    },
    'check_prime': {
      title: 'Проверка простого числа',
      description: 'Собери функцию проверки числа на простоту',
      correct_order: ['def is_prime(n):', '    if n < 2:', '        return False', '    for i in range(2, int(n**0.5) + 1):', '        if n % i == 0:', '            return False', '    return True'],
      blocks: ['    return True', '    for i in range(2, int(n**0.5) + 1):', 'def is_prime(n):', '        if n % i == 0:', '    if n < 2:', '        return False', '        return False'],
      xp: 65
    }
  }
};

const SKILL_MAP_DATA = {
  python: [
    { id: 'py_vars', title: 'Переменные', emoji: '📦', x: 200, y: 60, requires: [], desc: 'int, str, float, bool', lessons: 4 },
    { id: 'py_ops', title: 'Операторы', emoji: '➕', x: 80, y: 180, requires: ['py_vars'], desc: 'Арифметика и сравнения', lessons: 3 },
    { id: 'py_if', title: 'Условия', emoji: '🔀', x: 320, y: 180, requires: ['py_vars'], desc: 'if / elif / else', lessons: 5 },
    { id: 'py_loops', title: 'Циклы', emoji: '🔄', x: 80, y: 320, requires: ['py_ops'], desc: 'for, while, range()', lessons: 6 },
    { id: 'py_funcs', title: 'Функции', emoji: '⚙️', x: 320, y: 320, requires: ['py_if'], desc: 'def, return, args', lessons: 7 },
    { id: 'py_lists', title: 'Списки', emoji: '📋', x: 200, y: 440, requires: ['py_loops', 'py_funcs'], desc: 'list, append, sort', lessons: 5 },
    { id: 'py_dicts', title: 'Словари', emoji: '📚', x: 80, y: 560, requires: ['py_lists'], desc: 'dict, key-value', lessons: 4 },
    { id: 'py_oop', title: 'ООП', emoji: '🏛️', x: 320, y: 560, requires: ['py_funcs', 'py_lists'], desc: 'class, __init__, методы', lessons: 8 },
    { id: 'py_adv', title: 'Продвинутый Python', emoji: '🚀', x: 200, y: 680, requires: ['py_dicts', 'py_oop'], desc: 'Декораторы, генераторы', lessons: 10 },
  ]
};

// ─── Состояние ────────────────────────────────────────────────────
let labState = {
  activeFeature: null,
  duel: { task: null, timerVal: 0, timerInterval: null, hints: 0, aiTyping: false },
  bug: { task: null, selectedLine: null, revealed: false },
  craft: { task: null, placed: [], dragging: null },
  story: { storyIdx: 0, chapterIdx: 0, answered: false },
  skillMap: { lang: 'python', unlocked: new Set(['py_vars']) },
};

// ─── ИНИЦИАЛИЗАЦИЯ ────────────────────────────────────────────────
export function initLangLab(containerId) {
  const root = document.getElementById(containerId || 'lang-lab-root');
  if (!root) return;
  injectLabStyles();
  renderLangLabHome(root);
}

function renderLangLabHome(root) {
  labState.activeFeature = null;
  const xpData = XP.get();

  root.innerHTML = `
    <div class="lab-home">
      <div class="lab-home-header">
        <div class="lab-home-title">
          <span class="lab-logo-icon">🧪</span>
          <div>
            <h2 class="lab-title-text">Языковая лаборатория</h2>
            <p class="lab-title-sub">Python · JavaScript · Интерактивное обучение</p>
          </div>
        </div>
        <div class="lab-xp-display">
          <div class="lab-xp-bar-wrap">
            <div class="lab-xp-bar-fill" style="width:${Math.min((xpData.xp % 200) / 200 * 100, 100)}%"></div>
          </div>
          <div class="lab-xp-info">
            <span class="lab-level-badge">LV.${xpData.level}</span>
            <span class="lab-xp-num">⚡ ${xpData.xp} XP</span>
          </div>
        </div>
      </div>

      <div class="lab-features-grid">

        <div class="lab-feature-card lab-feat-duel" data-feat="duel">
          <div class="lab-feat-accent"></div>
          <div class="lab-feat-icon">🥊</div>
          <div class="lab-feat-content">
            <div class="lab-feat-title">Code Duel</div>
            <div class="lab-feat-desc">Сразись с AI: реши задачу быстрее, получи больше XP</div>
            <div class="lab-feat-tags">
              <span class="lab-tag">⏱ Таймер</span>
              <span class="lab-tag">🤖 AI-соперник</span>
              <span class="lab-tag">+50 XP</span>
            </div>
          </div>
          <div class="lab-feat-arrow">→</div>
        </div>

        <div class="lab-feature-card lab-feat-bug" data-feat="bug">
          <div class="lab-feat-accent"></div>
          <div class="lab-feat-icon">🔍</div>
          <div class="lab-feat-content">
            <div class="lab-feat-title">Bug Hunter</div>
            <div class="lab-feat-desc">Найди ошибку в коде — визуальный интерактивный отладчик</div>
            <div class="lab-feat-tags">
              <span class="lab-tag">🐛 Отладка</span>
              <span class="lab-tag">💡 Объяснение</span>
              <span class="lab-tag">+40 XP</span>
            </div>
          </div>
          <div class="lab-feat-arrow">→</div>
        </div>

        <div class="lab-feature-card lab-feat-craft" data-feat="craft">
          <div class="lab-feat-accent"></div>
          <div class="lab-feat-icon">🏗️</div>
          <div class="lab-feat-content">
            <div class="lab-feat-title">Code Craft</div>
            <div class="lab-feat-desc">Собери программу из блоков кода — как пазл</div>
            <div class="lab-feat-tags">
              <span class="lab-tag">🧩 Drag & Drop</span>
              <span class="lab-tag">🔡 Синтаксис</span>
              <span class="lab-tag">+55 XP</span>
            </div>
          </div>
          <div class="lab-feat-arrow">→</div>
        </div>

        <div class="lab-feature-card lab-feat-story" data-feat="story">
          <div class="lab-feat-accent"></div>
          <div class="lab-feat-icon">📖</div>
          <div class="lab-feat-content">
            <div class="lab-feat-title">Syntax Story</div>
            <div class="lab-feat-desc">Изучи синтаксис через интерактивные истории с квизами</div>
            <div class="lab-feat-tags">
              <span class="lab-tag">📚 Теория</span>
              <span class="lab-tag">⚡ Квизы</span>
              <span class="lab-tag">+30 XP</span>
            </div>
          </div>
          <div class="lab-feat-arrow">→</div>
        </div>

        <div class="lab-feature-card lab-feat-map" data-feat="skillmap">
          <div class="lab-feat-accent"></div>
          <div class="lab-feat-icon">🗺️</div>
          <div class="lab-feat-content">
            <div class="lab-feat-title">Skill Map</div>
            <div class="lab-feat-desc">Визуальная карта навыков — открывай темы в правильном порядке</div>
            <div class="lab-feat-tags">
              <span class="lab-tag">🔓 Разблокировка</span>
              <span class="lab-tag">📊 Прогресс</span>
              <span class="lab-tag">Roadmap</span>
            </div>
          </div>
          <div class="lab-feat-arrow">→</div>
        </div>

      </div>

      ${xpData.badges.length > 0 ? `
      <div class="lab-badges-strip">
        <span class="lab-badges-label">🏅 Мои значки:</span>
        ${xpData.badges.map(b => `<span class="lab-badge-chip">${b}</span>`).join('')}
      </div>` : ''}
    </div>
  `;

  root.querySelectorAll('.lab-feature-card[data-feat]').forEach(card => {
    card.addEventListener('click', () => {
      const feat = card.dataset.feat;
      if (feat === 'duel') renderCodeDuel(root);
      else if (feat === 'bug') renderBugHunter(root);
      else if (feat === 'craft') renderCodeCraft(root);
      else if (feat === 'story') renderSyntaxStory(root);
      else if (feat === 'skillmap') renderSkillMap(root);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// ФИЧА 1: CODE DUEL — поединок с AI
// ═══════════════════════════════════════════════════════════════════
function renderCodeDuel(root) {
  const task = CODE_DUEL_TASKS[Math.floor(Math.random() * CODE_DUEL_TASKS.length)];
  labState.duel.task = task;
  labState.duel.timerVal = 0;
  labState.duel.hints = 0;
  clearInterval(labState.duel.timerInterval);

  root.innerHTML = `
    <div class="lab-screen">
      <div class="lab-screen-header">
        <button class="lab-back-btn" id="labBack">← Назад</button>
        <h3 class="lab-screen-title">🥊 Code Duel</h3>
        <div class="lab-screen-meta">
          <span class="lab-lang-badge">${task.lang === 'python' ? '🐍 Python' : '⚡ JS'}</span>
          <span class="lab-xp-badge">+${task.xp} XP</span>
        </div>
      </div>

      <div class="duel-arena">
        <!-- Левая колонка: задача -->
        <div class="duel-left">
          <div class="duel-task-card">
            <div class="duel-task-title">${task.title}</div>
            <div class="duel-task-desc">${task.description}</div>
            <div class="duel-tests">
              <div class="duel-tests-label">Тест-кейсы:</div>
              ${task.tests.map(t => `
                <div class="duel-test-row">
                  <span class="duel-test-in">→ ${t.input}</span>
                  <span class="duel-test-arrow">⟹</span>
                  <span class="duel-test-out">${t.expected}</span>
                  <span class="duel-test-status" id="test-${t.input.replace(/[^a-z0-9]/gi,'_')}"></span>
                </div>`).join('')}
            </div>
          </div>

          <!-- Таймер и соперники -->
          <div class="duel-vs-bar">
            <div class="duel-player">
              <div class="duel-player-avatar">👤</div>
              <div class="duel-player-name">Ты</div>
              <div class="duel-player-time" id="playerTimer">00:00</div>
            </div>
            <div class="duel-vs-text">VS</div>
            <div class="duel-player duel-ai">
              <div class="duel-player-avatar">🤖</div>
              <div class="duel-player-name">AI</div>
              <div class="duel-player-time" id="aiTimer">⏳</div>
            </div>
          </div>
        </div>

        <!-- Правая колонка: редактор -->
        <div class="duel-right">
          <div class="duel-editor-header">
            <span class="duel-editor-file">${task.lang === 'python' ? 'solution.py' : 'solution.js'}</span>
            <div style="display:flex;gap:8px;">
              <button class="duel-hint-btn" id="duelHintBtn">💡 Подсказка</button>
              <button class="duel-run-btn" id="duelRunBtn">▶ Запустить</button>
            </div>
          </div>
          <textarea class="duel-editor" id="duelEditor" spellcheck="false">${task.starter}</textarea>
          <div class="duel-output" id="duelOutput">
            <span style="color:var(--text3);font-style:italic;">Нажмите ▶ Запустить для проверки...</span>
          </div>
        </div>
      </div>

      <!-- Подсказка (скрыта) -->
      <div class="duel-hint-box" id="duelHintBox" style="display:none;">
        <span class="duel-hint-icon">💡</span>
        <span id="duelHintText">${task.hint}</span>
      </div>

      <!-- Результат поединка -->
      <div class="duel-result" id="duelResult" style="display:none;"></div>
    </div>
  `;

  root.querySelector('#labBack')?.addEventListener('click', () => {
    clearInterval(labState.duel.timerInterval);
    renderLangLabHome(root);
  });

  // Таймер игрока
  const timerEl = document.getElementById('playerTimer');
  labState.duel.timerInterval = setInterval(() => {
    labState.duel.timerVal++;
    const m = String(Math.floor(labState.duel.timerVal / 60)).padStart(2, '0');
    const s = String(labState.duel.timerVal % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // Кнопка подсказки
  root.querySelector('#duelHintBtn')?.addEventListener('click', () => {
    const box = document.getElementById('duelHintBox');
    if (box) {
      box.style.display = box.style.display === 'none' ? 'flex' : 'none';
      labState.duel.hints++;
    }
  });

  // Кнопка запуска
  root.querySelector('#duelRunBtn')?.addEventListener('click', () => runDuelCode(root, task));
}

async function runDuelCode(root, task) {
  const code = document.getElementById('duelEditor')?.value || '';
  const btn = document.getElementById('duelRunBtn');
  const output = document.getElementById('duelOutput');
  if (!btn || !output) return;

  btn.disabled = true;
  btn.textContent = '⏳ Проверяем...';
  output.innerHTML = '<span style="color:var(--duo-blue)">⏳ Анализируем ваш код...</span>';

  // Используем Claude API для проверки кода
  try {
    const resp = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: `Ты — строгий проверщик кода для учебной платформы. Проверь код студента и верни JSON:
{"passed": boolean, "tests": [{"input": "...", "expected": "...", "actual": "...", "ok": boolean}], "feedback": "краткий отзыв на русском (1-2 предложения)", "score": 0-100}
Симулируй выполнение кода мысленно. Не выполняй реально — только логически проанализируй. Отвечай ТОЛЬКО JSON без markdown.`,
        messages: [{
          role: 'user',
          content: `Задача: ${task.description}\n\nКод студента:\n${code}\n\nТест-кейсы: ${JSON.stringify(task.tests)}`
        }]
      })
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || '{}';
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());

    clearInterval(labState.duel.timerInterval);
    const playerTime = labState.duel.timerVal;

    // Симуляция времени AI (немного меньше или больше игрока)
    const aiTime = result.passed
      ? playerTime + Math.floor(Math.random() * 15) + 5  // AI чуть медленнее
      : playerTime - Math.floor(Math.random() * 10) - 5;  // AI быстрее при провале

    document.getElementById('aiTimer').textContent = result.passed
      ? `${String(Math.floor(aiTime/60)).padStart(2,'0')}:${String(aiTime%60).padStart(2,'0')}`
      : '✓';

    // Обновить статусы тестов
    (result.tests || []).forEach(t => {
      const key = (t.input || '').replace(/[^a-z0-9]/gi,'_');
      const el = document.getElementById(`test-${key}`);
      if (el) el.textContent = t.ok ? '✅' : '❌';
    });

    // Показать результат
    const won = result.passed && playerTime < aiTime;
    const resultEl = document.getElementById('duelResult');
    if (resultEl) {
      resultEl.style.display = 'block';
      const xpEarned = result.passed
        ? Math.max(task.xp - labState.duel.hints * 10, 10)
        : 5;

      resultEl.innerHTML = `
        <div class="duel-result-inner ${result.passed ? (won ? 'duel-win' : 'duel-ok') : 'duel-fail'}">
          <div class="duel-result-emoji">${result.passed ? (won ? '🏆' : '✅') : '❌'}</div>
          <div class="duel-result-title">${result.passed ? (won ? 'Победа! Ты быстрее AI!' : 'Правильно! AI оказался быстрее') : 'Не совсем...'}</div>
          <div class="duel-result-feedback">${result.feedback}</div>
          <div class="duel-result-xp">+${xpEarned} XP</div>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
            <button class="lab-btn-secondary" id="duelSolution">Показать решение</button>
            <button class="lab-btn-primary" id="duelNext">Следующая задача →</button>
          </div>
        </div>
      `;

      XP.add(xpEarned, result.passed && won ? '⚔️ Победитель Дуэли' : null);

      root.querySelector('#duelSolution')?.addEventListener('click', () => {
        output.innerHTML = `<div style="color:var(--duo-green);font-weight:700;margin-bottom:8px;">Эталонное решение:</div><pre style="color:var(--text2);margin:0;">${task.solution}</pre>`;
      });
      root.querySelector('#duelNext')?.addEventListener('click', () => renderCodeDuel(root));
    }

    output.innerHTML = `
      <div style="color:${result.passed ? 'var(--duo-green)' : 'var(--duo-red)'};font-weight:700;margin-bottom:8px;">
        ${result.passed ? '✅ Все тесты пройдены!' : '❌ Тесты не пройдены'}
      </div>
      <div style="color:var(--text3);font-size:13px;">${result.feedback}</div>
    `;
  } catch (e) {
    output.innerHTML = `<span style="color:var(--duo-red);">⚠️ Ошибка подключения к AI. Проверьте сеть.</span>`;
  }

  btn.disabled = false;
  btn.textContent = '▶ Запустить';
}

// ═══════════════════════════════════════════════════════════════════
// ФИЧА 2: BUG HUNTER — охотник за багами
// ═══════════════════════════════════════════════════════════════════
function renderBugHunter(root) {
  const task = BUG_TASKS[Math.floor(Math.random() * BUG_TASKS.length)];
  labState.bug = { task, selectedLine: null, revealed: false };
  const lines = task.buggy_code.split('\n');

  root.innerHTML = `
    <div class="lab-screen">
      <div class="lab-screen-header">
        <button class="lab-back-btn" id="labBack">← Назад</button>
        <h3 class="lab-screen-title">🔍 Bug Hunter</h3>
        <div class="lab-screen-meta">
          <span class="lab-lang-badge">${task.lang === 'python' ? '🐍 Python' : '⚡ JS'}</span>
          <span class="lab-xp-badge">+${task.xp} XP</span>
        </div>
      </div>

      <div class="bug-layout">
        <!-- Описание задачи -->
        <div class="bug-task-desc">
          <div class="bug-task-icon">🐛</div>
          <div>
            <div class="bug-task-title">${task.title}</div>
            <div class="bug-task-text">${task.description}</div>
          </div>
        </div>

        <!-- Редактор с кликабельными строками -->
        <div class="bug-instruction">
          <span>👆 Нажми на строку с ошибкой</span>
          <span class="bug-score-display" id="bugAttempts">3 попытки</span>
        </div>

        <div class="bug-code-block" id="bugCodeBlock">
          ${lines.map((line, i) => `
            <div class="bug-line" data-line="${i + 1}" id="bug-line-${i + 1}">
              <span class="bug-line-num">${i + 1}</span>
              <span class="bug-line-code">${escapeHtml(line)}</span>
              <span class="bug-line-indicator"></span>
            </div>`).join('')}
        </div>

        <div class="bug-controls">
          <button class="lab-btn-secondary" id="bugHintBtn">💡 Подсказка (-10 XP)</button>
          <button class="lab-btn-primary" id="bugSubmitBtn" disabled>✓ Проверить выбор</button>
        </div>

        <div class="bug-result-area" id="bugResultArea" style="display:none;"></div>
      </div>
    </div>
  `;

  root.querySelector('#labBack')?.addEventListener('click', () => renderLangLabHome(root));

  let attempts = 3;
  let hintUsed = false;

  // Клик по строкам
  root.querySelectorAll('.bug-line').forEach(line => {
    line.addEventListener('click', () => {
      if (labState.bug.revealed) return;
      root.querySelectorAll('.bug-line').forEach(l => l.classList.remove('bug-line-selected'));
      line.classList.add('bug-line-selected');
      labState.bug.selectedLine = parseInt(line.dataset.line);
      root.querySelector('#bugSubmitBtn').disabled = false;
    });
  });

  // Подсказка
  root.querySelector('#bugHintBtn')?.addEventListener('click', () => {
    if (hintUsed) return;
    hintUsed = true;
    const hintLine = root.querySelector(`#bug-line-${task.bug_line}`);
    if (hintLine) {
      hintLine.style.border = '1px solid var(--duo-orange)';
      hintLine.style.background = 'rgba(255,150,0,0.05)';
    }
    root.querySelector('#bugHintBtn').textContent = '💡 Подсказка (использована)';
    root.querySelector('#bugHintBtn').disabled = true;
  });

  // Проверка выбора
  root.querySelector('#bugSubmitBtn')?.addEventListener('click', () => {
    const selected = labState.bug.selectedLine;
    const correct = task.bug_line;
    const isCorrect = selected === correct;

    if (!isCorrect) {
      attempts--;
      const line = root.querySelector(`#bug-line-${selected}`);
      if (line) {
        line.classList.add('bug-line-wrong');
        setTimeout(() => line.classList.remove('bug-line-wrong', 'bug-line-selected'), 800);
      }
      root.querySelector('#bugAttempts').textContent = `${attempts} попытки`;
      root.querySelector('#bugSubmitBtn').disabled = true;
      labState.bug.selectedLine = null;

      if (attempts <= 0) showBugResult(root, false, task, hintUsed);
      return;
    }

    labState.bug.revealed = true;
    const line = root.querySelector(`#bug-line-${selected}`);
    if (line) line.classList.add('bug-line-correct');
    showBugResult(root, true, task, hintUsed);
  });
}

function showBugResult(root, success, task, hintUsed) {
  const area = document.getElementById('bugResultArea');
  if (!area) return;
  area.style.display = 'block';

  const xpEarned = success ? (hintUsed ? task.xp - 10 : task.xp) : 5;

  const diffLines = getDiff(task.buggy_code, task.fixed_code);

  area.innerHTML = `
    <div class="bug-result ${success ? 'bug-result-ok' : 'bug-result-fail'}">
      <div class="bug-result-title">${success ? '🎉 Баг найден!' : '💡 Ответ:'}</div>
      <div class="bug-explanation">${task.bug_explanation}</div>
      <div class="bug-diff">
        <div class="bug-diff-label">Исправление:</div>
        <div class="bug-diff-code">
          ${diffLines.map(l => `<div class="bug-diff-line ${l.type}">${escapeHtml(l.text)}</div>`).join('')}
        </div>
      </div>
      <div class="bug-result-xp">+${xpEarned} XP</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
        <button class="lab-btn-primary" id="bugNext">Следующий баг →</button>
      </div>
    </div>
  `;

  XP.add(xpEarned, success && !hintUsed ? '🔍 Зоркий Охотник' : null);
  root.querySelector('#bugNext')?.addEventListener('click', () => renderBugHunter(root));
}

function getDiff(old_, new_) {
  const oldLines = old_.split('\n');
  const newLines = new_.split('\n');
  const result = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] !== undefined) result.push({ type: 'removed', text: '- ' + oldLines[i] });
      if (newLines[i] !== undefined) result.push({ type: 'added', text: '+ ' + newLines[i] });
    } else if (oldLines[i] !== undefined) {
      result.push({ type: 'context', text: '  ' + oldLines[i] });
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// ФИЧА 3: CODE CRAFT — сборка из блоков
// ═══════════════════════════════════════════════════════════════════
function renderCodeCraft(root) {
  const taskKey = Math.random() > 0.5 ? 'fibonacci' : 'check_prime';
  const task = CODE_BLOCKS.python[taskKey];
  labState.craft = { task, placed: [], dragging: null };
  const shuffled = [...task.blocks];

  root.innerHTML = `
    <div class="lab-screen">
      <div class="lab-screen-header">
        <button class="lab-back-btn" id="labBack">← Назад</button>
        <h3 class="lab-screen-title">🏗️ Code Craft</h3>
        <div class="lab-screen-meta">
          <span class="lab-lang-badge">🐍 Python</span>
          <span class="lab-xp-badge">+${task.xp} XP</span>
        </div>
      </div>

      <div class="craft-layout">
        <div class="craft-task-info">
          <div class="craft-task-title">${task.title}</div>
          <div class="craft-task-desc">${task.description}</div>
        </div>

        <div class="craft-workspace">
          <!-- Зона сборки -->
          <div class="craft-zone">
            <div class="craft-zone-label">📋 Ваш код (перетаскивайте сюда):</div>
            <div class="craft-drop-area" id="craftDropArea">
              <div class="craft-drop-placeholder">Перетащите блоки сюда...</div>
            </div>
            <div class="craft-actions">
              <button class="lab-btn-secondary" id="craftClear">🗑️ Очистить</button>
              <button class="lab-btn-primary" id="craftCheck">✓ Проверить</button>
            </div>
          </div>

          <!-- Пул блоков -->
          <div class="craft-pool">
            <div class="craft-zone-label">🧩 Доступные блоки:</div>
            <div class="craft-blocks-pool" id="craftPool">
              ${shuffled.map((block, i) => `
                <div class="craft-block" draggable="true" data-block="${encodeURIComponent(block)}" data-idx="${i}" id="cb-${i}">
                  <span class="craft-block-drag">⠿</span>
                  <code>${escapeHtml(block)}</code>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="craft-result-area" id="craftResultArea" style="display:none;"></div>
      </div>
    </div>
  `;

  root.querySelector('#labBack')?.addEventListener('click', () => renderLangLabHome(root));

  // Drag-and-drop
  const pool = root.querySelector('#craftPool');
  const dropArea = root.querySelector('#craftDropArea');

  root.querySelectorAll('.craft-block').forEach(block => {
    block.addEventListener('dragstart', e => {
      labState.craft.dragging = {
        text: decodeURIComponent(block.dataset.block),
        source: 'pool',
        id: block.dataset.idx
      };
      e.dataTransfer.effectAllowed = 'move';
      block.classList.add('craft-block-dragging');
    });
    block.addEventListener('dragend', () => block.classList.remove('craft-block-dragging'));
  });

  dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('craft-drop-over'); });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('craft-drop-over'));
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('craft-drop-over');
    if (!labState.craft.dragging) return;
    const text = labState.craft.dragging.text;
    if (labState.craft.placed.includes(text)) return;
    labState.craft.placed.push(text);
    updateCraftDropArea(root, task);

    // Скрыть блок из пула
    const poolBlock = root.querySelector(`#cb-${labState.craft.dragging.id}`);
    if (poolBlock) { poolBlock.style.opacity = '0.3'; poolBlock.draggable = false; }
    labState.craft.dragging = null;
  });

  // Клик как альтернатива drag
  root.querySelectorAll('.craft-block').forEach(block => {
    block.addEventListener('click', () => {
      const text = decodeURIComponent(block.dataset.block);
      if (labState.craft.placed.includes(text) || block.style.opacity === '0.3') return;
      labState.craft.placed.push(text);
      updateCraftDropArea(root, task);
      block.style.opacity = '0.3';
      block.draggable = false;
    });
  });

  root.querySelector('#craftClear')?.addEventListener('click', () => {
    labState.craft.placed = [];
    root.querySelectorAll('.craft-block').forEach(b => { b.style.opacity = '1'; b.draggable = true; });
    updateCraftDropArea(root, task);
  });

  root.querySelector('#craftCheck')?.addEventListener('click', () => checkCraftSolution(root, task));
}

function updateCraftDropArea(root, task) {
  const area = root.querySelector('#craftDropArea');
  if (!area) return;
  if (labState.craft.placed.length === 0) {
    area.innerHTML = '<div class="craft-drop-placeholder">Перетащите блоки сюда...</div>';
    return;
  }
  area.innerHTML = labState.craft.placed.map((line, i) => `
    <div class="craft-placed-line" data-i="${i}">
      <span class="craft-line-num">${i + 1}</span>
      <code class="craft-line-code">${escapeHtml(line)}</code>
      <button class="craft-remove-btn" data-i="${i}">✕</button>
    </div>`).join('');

  area.querySelectorAll('.craft-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.i);
      const removed = labState.craft.placed.splice(idx, 1)[0];
      // Вернуть в пул
      root.querySelectorAll('.craft-block').forEach(b => {
        if (decodeURIComponent(b.dataset.block) === removed) {
          b.style.opacity = '1'; b.draggable = true;
        }
      });
      updateCraftDropArea(root, task);
    });
  });
}

function checkCraftSolution(root, task) {
  const placed = labState.craft.placed;
  const correct = task.correct_order;
  const area = root.querySelector('#craftResultArea');
  if (!area) return;

  const isCorrect = placed.length === correct.length && placed.every((b, i) => b === correct[i]);
  area.style.display = 'block';

  if (isCorrect) {
    area.innerHTML = `
      <div class="craft-result craft-result-ok">
        <div class="craft-result-icon">🎉</div>
        <div class="craft-result-title">Правильно! Программа собрана верно!</div>
        <div class="craft-result-xp">+${task.xp} XP</div>
        <button class="lab-btn-primary" id="craftNext" style="margin-top:12px;">Следующая задача →</button>
      </div>`;
    XP.add(task.xp, '🏗️ Мастер Крафта');
    root.querySelector('#craftNext')?.addEventListener('click', () => renderCodeCraft(root));
  } else {
    // Показать какие строки не так
    let wrongIdx = -1;
    for (let i = 0; i < correct.length; i++) {
      if (placed[i] !== correct[i]) { wrongIdx = i; break; }
    }
    area.innerHTML = `
      <div class="craft-result craft-result-fail">
        <div class="craft-result-icon">❌</div>
        <div class="craft-result-title">Не совсем... ${wrongIdx >= 0 ? `Строка ${wrongIdx + 1} не на месте` : 'Порядок блоков неверный'}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:8px;">Попробуй ещё раз или посмотри подсказку</div>
        <button class="lab-btn-secondary" id="craftHint" style="margin-top:12px;">💡 Первый неверный блок</button>
      </div>`;
    root.querySelector('#craftHint')?.addEventListener('click', () => {
      if (wrongIdx >= 0) {
        const el = root.querySelectorAll('.craft-placed-line')[wrongIdx];
        if (el) { el.style.border = '1px solid var(--duo-red)'; el.style.background = 'rgba(255,75,75,0.1)'; }
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// ФИЧА 4: SYNTAX STORY — интерактивная история
// ═══════════════════════════════════════════════════════════════════
function renderSyntaxStory(root) {
  labState.story.chapterIdx = 0;
  labState.story.answered = false;

  root.innerHTML = `
    <div class="lab-screen">
      <div class="lab-screen-header">
        <button class="lab-back-btn" id="labBack">← Назад</button>
        <h3 class="lab-screen-title">📖 Syntax Story</h3>
        <div class="lab-screen-meta" id="storyMeta"></div>
      </div>

      <!-- Выбор истории -->
      <div class="story-select-grid" id="storySelectGrid">
        ${STORIES.map((s, i) => `
          <div class="story-select-card" data-idx="${i}">
            <div class="story-select-emoji">${s.emoji}</div>
            <div class="story-select-title">${s.title}</div>
            <div class="story-select-meta">
              <span class="lab-lang-badge">${s.lang === 'python' ? '🐍 Python' : '⚡ JS'}</span>
              <span class="lab-xp-badge">+${s.xp} XP</span>
            </div>
            <div class="story-select-chapters">${s.chapters.length} глав</div>
          </div>`).join('')}
      </div>

      <div id="storyContent" style="display:none;"></div>
    </div>
  `;

  root.querySelector('#labBack')?.addEventListener('click', () => renderLangLabHome(root));

  root.querySelectorAll('.story-select-card').forEach(card => {
    card.addEventListener('click', () => {
      const story = STORIES[parseInt(card.dataset.idx)];
      labState.story.storyIdx = parseInt(card.dataset.idx);
      labState.story.chapterIdx = 0;
      root.querySelector('#storySelectGrid').style.display = 'none';
      root.querySelector('#storyContent').style.display = 'block';
      renderStoryChapter(root, story, 0);
    });
  });
}

function renderStoryChapter(root, story, chIdx) {
  const ch = story.chapters[chIdx];
  const content = root.querySelector('#storyContent');
  const meta = root.querySelector('#storyMeta');
  if (!content || !meta) return;

  meta.innerHTML = `<span style="font-family:var(--mono);font-size:12px;color:var(--text3);">${chIdx + 1} / ${story.chapters.length}</span>`;

  const progressPct = Math.round((chIdx / story.chapters.length) * 100);

  content.innerHTML = `
    <div class="story-chapter">
      <!-- Прогресс -->
      <div class="story-progress-bar">
        <div class="story-progress-fill" style="width:${progressPct}%"></div>
      </div>

      <!-- Заголовок истории -->
      <div class="story-title-row">
        <span class="story-emoji">${story.emoji}</span>
        <div>
          <div class="story-chapter-title">${story.title}</div>
          <div class="story-chapter-num">Глава ${chIdx + 1}</div>
        </div>
      </div>

      <!-- Текст -->
      <div class="story-text">${renderMarkdown(ch.text)}</div>

      <!-- Блок кода (если есть) -->
      ${ch.code ? `
      <div class="story-code-block">
        <div class="story-code-header">
          <span class="story-code-lang">${story.lang === 'python' ? '🐍 Python' : '⚡ JS'}</span>
          <button class="story-copy-btn" id="storyCopyBtn">📋 Копировать</button>
        </div>
        <pre class="story-code"><code>${escapeHtml(ch.code)}</code></pre>
      </div>` : ''}

      <!-- Квиз (если есть) -->
      ${ch.question ? `
      <div class="story-quiz" id="storyQuiz">
        <div class="story-quiz-q">${ch.question.q}</div>
        <div class="story-quiz-opts" id="storyQuizOpts">
          ${ch.question.opts.map((opt, i) => `
            <button class="story-quiz-opt" data-idx="${i}">${opt}</button>`).join('')}
        </div>
        <div class="story-quiz-exp" id="storyQuizExp" style="display:none;"></div>
      </div>` : ''}

      <!-- Кнопки навигации -->
      <div class="story-nav" id="storyNav">
        ${chIdx > 0 ? `<button class="lab-btn-secondary" id="storyPrev">← Назад</button>` : '<div></div>'}
        ${!ch.question ? `<button class="lab-btn-primary" id="storyNext">${chIdx === story.chapters.length - 1 ? '🎉 Завершить' : 'Далее →'}</button>` : ''}
      </div>
    </div>
  `;

  // Копирование кода
  root.querySelector('#storyCopyBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(ch.code || '').then(() => {
      const btn = root.querySelector('#storyCopyBtn');
      if (btn) { btn.textContent = '✓ Скопировано!'; setTimeout(() => btn.textContent = '📋 Копировать', 1500); }
    });
  });

  // Навигация
  root.querySelector('#storyPrev')?.addEventListener('click', () => renderStoryChapter(root, story, chIdx - 1));
  root.querySelector('#storyNext')?.addEventListener('click', () => {
    if (chIdx === story.chapters.length - 1) {
      // Завершение истории
      XP.add(story.xp, '📖 Сказочник');
      content.innerHTML = `
        <div class="story-complete">
          <div class="story-complete-emoji">${story.emoji}</div>
          <div class="story-complete-title">История завершена!</div>
          <div class="story-complete-sub">${story.title}</div>
          <div class="story-complete-xp">+${story.xp} XP</div>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
            <button class="lab-btn-secondary" id="storyAnother">Другая история</button>
            <button class="lab-btn-primary" id="storyHome">← На главную</button>
          </div>
        </div>`;
      root.querySelector('#storyAnother')?.addEventListener('click', () => renderSyntaxStory(root));
      root.querySelector('#storyHome')?.addEventListener('click', () => renderLangLabHome(root));
    } else {
      renderStoryChapter(root, story, chIdx + 1);
    }
  });

  // Квиз
  if (ch.question) {
    root.querySelectorAll('.story-quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (labState.story.answered) return;
        const chosen = parseInt(btn.dataset.idx);
        const isCorrect = chosen === ch.question.correct;
        labState.story.answered = true;

        root.querySelectorAll('.story-quiz-opt').forEach(b => b.disabled = true);
        btn.classList.add(isCorrect ? 'story-opt-correct' : 'story-opt-wrong');
        if (!isCorrect) {
          root.querySelectorAll('.story-quiz-opt')[ch.question.correct]?.classList.add('story-opt-correct');
        }

        const exp = document.getElementById('storyQuizExp');
        if (exp) {
          exp.style.display = 'block';
          exp.innerHTML = `<span class="${isCorrect ? 'exp-ok' : 'exp-fail'}">${isCorrect ? '✅' : '❌'}</span> ${ch.question.exp}`;
        }

        // Добавить кнопку "Далее"
        const nav = document.getElementById('storyNav');
        if (nav) {
          const nextBtn = document.createElement('button');
          nextBtn.className = 'lab-btn-primary';
          nextBtn.textContent = chIdx === story.chapters.length - 1 ? '🎉 Завершить' : 'Далее →';
          nextBtn.addEventListener('click', () => {
            labState.story.answered = false;
            if (chIdx === story.chapters.length - 1) {
              XP.add(story.xp, '📖 Сказочник');
              content.innerHTML = `
                <div class="story-complete">
                  <div class="story-complete-emoji">${story.emoji}</div>
                  <div class="story-complete-title">История завершена!</div>
                  <div class="story-complete-sub">${story.title}</div>
                  <div class="story-complete-xp">+${story.xp} XP</div>
                  <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
                    <button class="lab-btn-secondary" id="storyAnother">Другая история</button>
                    <button class="lab-btn-primary" id="storyHome2">← На главную</button>
                  </div>
                </div>`;
              root.querySelector('#storyAnother')?.addEventListener('click', () => renderSyntaxStory(root));
              root.querySelector('#storyHome2')?.addEventListener('click', () => renderLangLabHome(root));
            } else {
              renderStoryChapter(root, story, chIdx + 1);
            }
          });
          nav.appendChild(nextBtn);
        }
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// ФИЧА 5: SKILL MAP — карта навыков
// ═══════════════════════════════════════════════════════════════════
function renderSkillMap(root) {
  const lang = labState.skillMap.lang;
  const nodes = SKILL_MAP_DATA[lang];
  const unlocked = labState.skillMap.unlocked;

  root.innerHTML = `
    <div class="lab-screen">
      <div class="lab-screen-header">
        <button class="lab-back-btn" id="labBack">← Назад</button>
        <h3 class="lab-screen-title">🗺️ Skill Map</h3>
        <div class="lab-screen-meta">
          <span class="lab-lang-badge">🐍 Python</span>
          <span style="font-family:var(--mono);font-size:11px;color:var(--text3);">
            ${unlocked.size}/${nodes.length} открыто
          </span>
        </div>
      </div>

      <div class="skillmap-container">
        <!-- SVG карта -->
        <div class="skillmap-canvas-wrap">
          <svg class="skillmap-svg" id="skillMapSvg" viewBox="0 0 500 760" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.15)"/>
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(88,204,2,0.6)"/>
              </marker>
            </defs>

            <!-- Линии связей -->
            ${nodes.map(node =>
              node.requires.map(reqId => {
                const req = nodes.find(n => n.id === reqId);
                if (!req) return '';
                const bothUnlocked = unlocked.has(node.id) && unlocked.has(reqId);
                return `<line
                  x1="${req.x + 50}" y1="${req.y + 30}"
                  x2="${node.x + 50}" y2="${node.y + 10}"
                  stroke="${bothUnlocked ? 'rgba(88,204,2,0.4)' : 'rgba(255,255,255,0.1)'}"
                  stroke-width="2"
                  stroke-dasharray="${bothUnlocked ? 'none' : '6 4'}"
                  marker-end="${bothUnlocked ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}"
                />`;
              }).join('')
            ).join('')}

            <!-- Узлы -->
            ${nodes.map(node => {
              const isUnlocked = unlocked.has(node.id);
              const canUnlock = !isUnlocked && node.requires.every(r => unlocked.has(r));
              return `
              <g class="skill-node ${isUnlocked ? 'skill-unlocked' : ''} ${canUnlock ? 'skill-available' : ''}"
                 data-id="${node.id}"
                 transform="translate(${node.x}, ${node.y})">
                <rect width="100" height="60" rx="12"
                  fill="${isUnlocked ? 'rgba(88,204,2,0.15)' : canUnlock ? 'rgba(28,176,246,0.12)' : 'rgba(255,255,255,0.03)'}"
                  stroke="${isUnlocked ? 'rgba(88,204,2,0.6)' : canUnlock ? 'rgba(28,176,246,0.5)' : 'rgba(255,255,255,0.08)'}"
                  stroke-width="${canUnlock ? '2' : '1'}"
                />
                <text x="50" y="20" text-anchor="middle" font-size="18">${node.emoji}</text>
                <text x="50" y="38" text-anchor="middle" font-size="10" font-weight="700"
                  fill="${isUnlocked ? '#58cc02' : canUnlock ? '#1cb0f6' : 'rgba(255,255,255,0.4)'}">
                  ${node.title}
                </text>
                <text x="50" y="52" text-anchor="middle" font-size="8"
                  fill="rgba(255,255,255,0.3)">
                  ${isUnlocked ? '✓ ' + node.lessons + ' уроков' : canUnlock ? '🔓 Доступно' : '🔒'}
                </text>
              </g>`;
            }).join('')}
          </svg>
        </div>

        <!-- Панель информации -->
        <div class="skillmap-panel" id="skillMapPanel">
          <div class="skillmap-panel-empty">
            <div style="font-size:32px;margin-bottom:8px;">🗺️</div>
            <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Карта навыков Python</div>
            <div style="font-size:12px;color:var(--text3);line-height:1.5;">
              Нажми на узел чтобы узнать подробности.<br>
              🟢 — пройдено · 🔵 — доступно · 🔒 — заблокировано
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  root.querySelector('#labBack')?.addEventListener('click', () => renderLangLabHome(root));

  // Клик по узлам
  root.querySelectorAll('.skill-node').forEach(node => {
    node.style.cursor = 'pointer';
    node.addEventListener('click', () => {
      const id = node.dataset.id;
      const skill = nodes.find(n => n.id === id);
      if (!skill) return;

      const isUnlocked = unlocked.has(id);
      const canUnlock = !isUnlocked && skill.requires.every(r => unlocked.has(r));

      const panel = root.querySelector('#skillMapPanel');
      if (!panel) return;

      panel.innerHTML = `
        <div class="skillmap-detail">
          <div class="skillmap-detail-header">
            <span class="skillmap-detail-emoji">${skill.emoji}</span>
            <div>
              <div class="skillmap-detail-title">${skill.title}</div>
              <div class="skillmap-detail-desc">${skill.desc}</div>
            </div>
          </div>

          <div class="skillmap-detail-stats">
            <div class="skillmap-stat">
              <span class="skillmap-stat-num">${skill.lessons}</span>
              <span class="skillmap-stat-lbl">Уроков</span>
            </div>
            <div class="skillmap-stat">
              <span class="skillmap-stat-num">${skill.lessons * 25}</span>
              <span class="skillmap-stat-lbl">XP</span>
            </div>
            <div class="skillmap-stat">
              <span class="skillmap-stat-num ${isUnlocked ? 'stat-green' : canUnlock ? 'stat-blue' : 'stat-gray'}">
                ${isUnlocked ? '✓' : canUnlock ? '🔓' : '🔒'}
              </span>
              <span class="skillmap-stat-lbl">Статус</span>
            </div>
          </div>

          ${skill.requires.length > 0 ? `
          <div class="skillmap-requires">
            <div class="skillmap-req-label">Требует:</div>
            ${skill.requires.map(r => {
              const req = nodes.find(n => n.id === r);
              return `<span class="skillmap-req-chip ${unlocked.has(r) ? 'req-done' : 'req-need'}">
                ${req?.emoji || ''} ${req?.title || r}
              </span>`;
            }).join('')}
          </div>` : '<div class="skillmap-req-label" style="color:var(--duo-green);">✓ Начальная тема — доступна всем</div>'}

          ${isUnlocked ? `
          <div class="skillmap-status-badge status-unlocked">✓ Тема открыта</div>
          <button class="lab-btn-primary" style="width:100%;margin-top:12px;" onclick="window.showToast && window.showToast('🎯 Переходим к урокам...')">
            Перейти к урокам →
          </button>` : canUnlock ? `
          <button class="lab-btn-primary skill-unlock-btn" data-id="${id}" style="width:100%;margin-top:12px;">
            🔓 Открыть тему (+${skill.lessons * 10} XP)
          </button>` : `
          <div class="skillmap-status-badge status-locked">🔒 Сначала пройдите: ${skill.requires.map(r => nodes.find(n => n.id === r)?.title || r).join(', ')}</div>`}
        </div>
      `;

      root.querySelector('.skill-unlock-btn')?.addEventListener('click', (e) => {
        const skillId = e.target.dataset.id;
        unlocked.add(skillId);
        // Сохранить в localStorage
        const arr = Array.from(unlocked);
        localStorage.setItem('tgb_skillmap_py', JSON.stringify(arr));
        XP.add(nodes.find(n => n.id === skillId)?.lessons * 10 || 20, '🗺️ Исследователь');
        renderSkillMap(root);
        // Сразу показать деталь новой темы
        setTimeout(() => {
          const newNode = root.querySelector(`[data-id="${skillId}"]`);
          newNode?.dispatchEvent(new Event('click'));
        }, 100);
      });
    });
  });

  // Загрузить сохранённые разблокированные темы
  try {
    const saved = JSON.parse(localStorage.getItem('tgb_skillmap_py') || '["py_vars"]');
    labState.skillMap.unlocked = new Set(saved);
  } catch { labState.skillMap.unlocked = new Set(['py_vars']); }
}

// ─── Утилиты ──────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="inline-code">$1</code>');
}

// ═══════════════════════════════════════════════════════════════════
// СТИЛИ
// ═══════════════════════════════════════════════════════════════════
function injectLabStyles() {
  if (document.getElementById('lab-styles')) return;
  const s = document.createElement('style');
  s.id = 'lab-styles';
  s.textContent = `
  /* ── XP Toast ── */
  .lab-xp-toast {
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%) translateY(20px);
    background:var(--duo-green); color:#000; font-weight:900; font-family:var(--mono);
    font-size:14px; padding:10px 24px; border-radius:99px; z-index:9999;
    opacity:0; transition:all .3s; pointer-events:none; white-space:nowrap;
  }
  .lab-xp-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

  /* ── HOME ── */
  .lab-home { padding:20px; max-width:900px; margin:0 auto; }
  .lab-home-header {
    display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:16px; margin-bottom:24px;
    padding-bottom:20px; border-bottom:1px solid var(--border);
  }
  .lab-home-title { display:flex; align-items:center; gap:14px; }
  .lab-logo-icon { font-size:40px; }
  .lab-title-text { font-size:24px; font-weight:900; margin:0; letter-spacing:-.5px; }
  .lab-title-sub { font-family:var(--mono); font-size:12px; color:var(--text3); margin-top:4px; }

  .lab-xp-display { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .lab-xp-bar-wrap { width:180px; height:8px; background:var(--bg3); border-radius:99px; overflow:hidden; }
  .lab-xp-bar-fill { height:100%; background:linear-gradient(90deg,var(--duo-blue),var(--duo-green)); border-radius:99px; transition:width .5s; }
  .lab-xp-info { display:flex; gap:10px; align-items:center; }
  .lab-level-badge { background:var(--duo-purple); color:#fff; font-family:var(--mono); font-size:10px; font-weight:800; padding:3px 10px; border-radius:99px; text-transform:uppercase; }
  .lab-xp-num { font-family:var(--mono); font-size:13px; font-weight:700; color:var(--duo-green); }

  /* ── Feature Cards ── */
  .lab-features-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
    gap:14px; margin-bottom:24px;
  }
  .lab-feature-card {
    background:var(--bg2); border:1.5px solid var(--border);
    border-radius:16px; padding:20px; cursor:pointer;
    transition:all .2s; display:flex; align-items:flex-start; gap:14px;
    position:relative; overflow:hidden;
  }
  .lab-feature-card:hover { transform:translateY(-4px); box-shadow:0 10px 30px rgba(0,0,0,.4); }
  .lab-feat-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
  .lab-feat-duel .lab-feat-accent { background:linear-gradient(90deg,#ff4b4b,#ff9600); }
  .lab-feat-duel:hover { border-color:rgba(255,75,75,.4); }
  .lab-feat-bug .lab-feat-accent { background:linear-gradient(90deg,#ffd900,#ff9600); }
  .lab-feat-bug:hover { border-color:rgba(255,217,0,.4); }
  .lab-feat-craft .lab-feat-accent { background:linear-gradient(90deg,#1cb0f6,#a560e8); }
  .lab-feat-craft:hover { border-color:rgba(28,176,246,.4); }
  .lab-feat-story .lab-feat-accent { background:linear-gradient(90deg,#57cc02,#1cb0f6); }
  .lab-feat-story:hover { border-color:rgba(87,204,2,.4); }
  .lab-feat-map .lab-feat-accent { background:linear-gradient(90deg,#a560e8,#ff9600); }
  .lab-feat-map:hover { border-color:rgba(165,96,232,.4); }

  .lab-feat-icon { font-size:36px; flex-shrink:0; }
  .lab-feat-content { flex:1; }
  .lab-feat-title { font-size:17px; font-weight:900; margin-bottom:5px; }
  .lab-feat-desc { font-size:12px; color:var(--text3); line-height:1.5; margin-bottom:10px; }
  .lab-feat-tags { display:flex; gap:6px; flex-wrap:wrap; }
  .lab-tag { font-family:var(--mono); font-size:9px; font-weight:700; background:var(--bg3); color:var(--text3); border:1px solid var(--border); padding:2px 8px; border-radius:99px; }
  .lab-feat-arrow { font-size:20px; color:var(--text3); flex-shrink:0; margin-top:4px; }

  .lab-badges-strip { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:12px 16px; background:var(--bg2); border-radius:12px; border:1px solid var(--border); }
  .lab-badges-label { font-family:var(--mono); font-size:11px; color:var(--text3); }
  .lab-badge-chip { background:rgba(255,217,0,.15); color:var(--duo-yellow); font-family:var(--mono); font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; }

  /* ── SCREEN BASE ── */
  .lab-screen { display:flex; flex-direction:column; height:100%; min-height:600px; }
  .lab-screen-header {
    display:flex; align-items:center; gap:14px; flex-wrap:wrap;
    padding:16px 20px; border-bottom:1px solid var(--border);
    background:var(--bg2); flex-shrink:0;
  }
  .lab-back-btn { background:var(--bg3); border:1px solid var(--border2); color:var(--text3); padding:8px 14px; border-radius:99px; cursor:pointer; font-family:var(--font); font-weight:700; font-size:13px; transition:all .15s; white-space:nowrap; }
  .lab-back-btn:hover { border-color:var(--duo-blue); color:var(--duo-blue); }
  .lab-screen-title { font-size:18px; font-weight:900; flex:1; }
  .lab-screen-meta { display:flex; gap:8px; align-items:center; }
  .lab-lang-badge { background:rgba(28,176,246,.15); color:var(--duo-blue); font-family:var(--mono); font-size:10px; font-weight:800; padding:3px 10px; border-radius:99px; }
  .lab-xp-badge { background:rgba(87,204,2,.15); color:var(--duo-green); font-family:var(--mono); font-size:10px; font-weight:800; padding:3px 10px; border-radius:99px; }

  /* ── BUTTONS ── */
  .lab-btn-primary { background:var(--duo-blue); border:none; border-bottom:3px solid var(--duo-blue2); color:#fff; border-radius:99px; padding:10px 20px; font-family:var(--font); font-weight:800; font-size:13px; cursor:pointer; transition:filter .15s; }
  .lab-btn-primary:hover { filter:brightness(1.1); }
  .lab-btn-secondary { background:transparent; border:2px solid var(--border2); color:var(--text2); border-radius:99px; padding:9px 18px; font-family:var(--font); font-weight:700; font-size:13px; cursor:pointer; transition:all .15s; }
  .lab-btn-secondary:hover { border-color:var(--border3); color:var(--text); }

  /* ── CODE DUEL ── */
  .duel-arena { display:grid; grid-template-columns:1fr 1.2fr; gap:16px; padding:16px; flex:1; overflow:hidden; }
  @media(max-width:768px) { .duel-arena { grid-template-columns:1fr; } }
  .duel-left { display:flex; flex-direction:column; gap:12px; }
  .duel-task-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:16px; }
  .duel-task-title { font-size:16px; font-weight:800; margin-bottom:8px; }
  .duel-task-desc { font-size:13px; color:var(--text2); line-height:1.5; margin-bottom:12px; }
  .duel-tests-label { font-family:var(--mono); font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; }
  .duel-test-row { display:flex; align-items:center; gap:8px; font-family:var(--mono); font-size:12px; padding:5px 0; border-bottom:1px solid var(--border); }
  .duel-test-row:last-child { border:none; }
  .duel-test-in { color:var(--duo-blue); }
  .duel-test-out { color:var(--duo-green); }
  .duel-test-arrow { color:var(--text3); }
  .duel-test-status { margin-left:auto; }
  .duel-vs-bar { display:flex; align-items:center; justify-content:space-between; background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
  .duel-player { display:flex; flex-direction:column; align-items:center; gap:4px; }
  .duel-player-avatar { font-size:28px; }
  .duel-player-name { font-size:12px; font-weight:700; }
  .duel-player-time { font-family:var(--mono); font-size:18px; font-weight:900; color:var(--duo-blue); }
  .duel-vs-text { font-size:24px; font-weight:900; color:var(--text3); }
  .duel-ai .duel-player-time { color:var(--duo-red); }

  .duel-right { display:flex; flex-direction:column; }
  .duel-editor-header { display:flex; justify-content:space-between; align-items:center; background:var(--bg3); border:1px solid var(--border); border-bottom:none; border-radius:10px 10px 0 0; padding:8px 14px; }
  .duel-editor-file { font-family:var(--mono); font-size:11px; color:var(--text3); }
  .duel-editor { flex:1; min-height:220px; background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:var(--mono); font-size:13px; padding:14px; resize:none; outline:none; line-height:1.6; }
  .duel-editor:focus { border-color:var(--duo-blue); }
  .duel-output { background:var(--bg3); border:1px solid var(--border); border-top:none; border-radius:0 0 10px 10px; padding:12px 14px; font-family:var(--mono); font-size:12px; min-height:60px; }
  .duel-hint-btn { background:transparent; border:1px solid var(--border2); color:var(--text3); padding:6px 12px; border-radius:99px; font-family:var(--font); font-size:11px; cursor:pointer; transition:all .15s; }
  .duel-hint-btn:hover { border-color:var(--duo-orange); color:var(--duo-orange); }
  .duel-run-btn { background:var(--duo-green); border:none; border-bottom:2px solid var(--duo-green2); color:#000; padding:7px 16px; border-radius:99px; font-family:var(--font); font-weight:800; font-size:12px; cursor:pointer; transition:filter .15s; }
  .duel-run-btn:hover { filter:brightness(1.1); }
  .duel-run-btn:disabled { opacity:.5; cursor:default; }
  .duel-hint-box { display:flex; align-items:center; gap:10px; margin:8px 16px; background:rgba(255,150,0,.1); border:1px solid rgba(255,150,0,.3); border-radius:10px; padding:12px 16px; font-size:13px; }
  .duel-hint-icon { font-size:20px; flex-shrink:0; }
  .duel-result { margin:8px 16px 16px; }
  .duel-result-inner { border-radius:14px; padding:20px; text-align:center; }
  .duel-win { background:rgba(88,204,2,.12); border:1px solid rgba(88,204,2,.3); }
  .duel-ok { background:rgba(28,176,246,.1); border:1px solid rgba(28,176,246,.3); }
  .duel-fail { background:rgba(255,75,75,.1); border:1px solid rgba(255,75,75,.3); }
  .duel-result-emoji { font-size:48px; margin-bottom:10px; }
  .duel-result-title { font-size:18px; font-weight:900; margin-bottom:8px; }
  .duel-result-feedback { font-size:13px; color:var(--text2); margin-bottom:10px; }
  .duel-result-xp { font-family:var(--mono); font-size:18px; font-weight:900; color:var(--duo-green); }

  /* ── BUG HUNTER ── */
  .bug-layout { padding:16px; flex:1; display:flex; flex-direction:column; gap:14px; }
  .bug-task-desc { display:flex; align-items:flex-start; gap:12px; background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:16px; }
  .bug-task-icon { font-size:28px; flex-shrink:0; }
  .bug-task-title { font-size:15px; font-weight:800; margin-bottom:5px; }
  .bug-task-text { font-size:13px; color:var(--text3); }
  .bug-instruction { display:flex; justify-content:space-between; align-items:center; font-family:var(--mono); font-size:12px; color:var(--text3); }
  .bug-score-display { color:var(--duo-orange); font-weight:700; }
  .bug-code-block { background:var(--bg3); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  .bug-line { display:flex; align-items:center; gap:0; padding:6px 14px; cursor:pointer; transition:background .1s; border-bottom:1px solid var(--border); }
  .bug-line:last-child { border:none; }
  .bug-line:hover { background:rgba(255,255,255,.03); }
  .bug-line-selected { background:rgba(28,176,246,.12) !important; }
  .bug-line-wrong { animation:bug-shake .4s; background:rgba(255,75,75,.15) !important; }
  .bug-line-correct { background:rgba(88,204,2,.15) !important; }
  @keyframes bug-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .bug-line-num { font-family:var(--mono); font-size:11px; color:var(--text3); width:24px; flex-shrink:0; user-select:none; }
  .bug-line-code { font-family:var(--mono); font-size:13px; flex:1; white-space:pre; }
  .bug-line-indicator { width:16px; flex-shrink:0; }
  .bug-controls { display:flex; gap:10px; justify-content:flex-end; }
  .bug-result-area { }
  .bug-result { border-radius:14px; padding:20px; }
  .bug-result-ok { background:rgba(88,204,2,.1); border:1px solid rgba(88,204,2,.3); }
  .bug-result-fail { background:rgba(255,75,75,.08); border:1px solid rgba(255,75,75,.25); }
  .bug-result-title { font-size:18px; font-weight:900; margin-bottom:10px; }
  .bug-explanation { font-size:13px; color:var(--text2); line-height:1.6; margin-bottom:14px; }
  .bug-diff { background:var(--bg3); border-radius:10px; overflow:hidden; margin-bottom:12px; }
  .bug-diff-label { font-family:var(--mono); font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; padding:8px 12px; border-bottom:1px solid var(--border); }
  .bug-diff-code { padding:8px 0; }
  .bug-diff-line { font-family:var(--mono); font-size:12px; padding:3px 12px; white-space:pre; }
  .bug-diff-line.removed { background:rgba(255,75,75,.15); color:#ff8080; }
  .bug-diff-line.added { background:rgba(88,204,2,.15); color:#89e219; }
  .bug-diff-line.context { color:var(--text3); }
  .bug-result-xp { font-family:var(--mono); font-size:18px; font-weight:900; color:var(--duo-green); text-align:center; }

  /* ── CODE CRAFT ── */
  .craft-layout { padding:16px; flex:1; display:flex; flex-direction:column; gap:14px; }
  .craft-task-info { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
  .craft-task-title { font-size:15px; font-weight:800; margin-bottom:4px; }
  .craft-task-desc { font-size:13px; color:var(--text3); }
  .craft-workspace { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media(max-width:768px) { .craft-workspace { grid-template-columns:1fr; } }
  .craft-zone { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
  .craft-zone-label { font-family:var(--mono); font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; }
  .craft-drop-area { min-height:160px; background:var(--bg3); border:2px dashed var(--border2); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:4px; transition:border-color .15s; }
  .craft-drop-area.craft-drop-over { border-color:var(--duo-blue); background:rgba(28,176,246,.05); }
  .craft-drop-placeholder { font-family:var(--mono); font-size:12px; color:var(--text3); text-align:center; padding:30px 16px; font-style:italic; }
  .craft-placed-line { display:flex; align-items:center; gap:8px; background:var(--bg2); border:1px solid var(--border); border-radius:6px; padding:6px 10px; }
  .craft-line-num { font-family:var(--mono); font-size:10px; color:var(--text3); width:16px; flex-shrink:0; }
  .craft-line-code { font-family:var(--mono); font-size:12px; flex:1; white-space:pre; }
  .craft-remove-btn { background:none; border:none; color:var(--text3); cursor:pointer; font-size:12px; padding:0 4px; flex-shrink:0; transition:color .15s; }
  .craft-remove-btn:hover { color:var(--duo-red); }
  .craft-pool { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
  .craft-blocks-pool { display:flex; flex-direction:column; gap:6px; max-height:300px; overflow-y:auto; }
  .craft-block { display:flex; align-items:center; gap:10px; background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:8px 12px; cursor:grab; transition:all .15s; user-select:none; }
  .craft-block:hover { border-color:var(--duo-blue); background:rgba(28,176,246,.06); }
  .craft-block.craft-block-dragging { opacity:.5; transform:scale(.97); }
  .craft-block-drag { color:var(--text3); font-size:14px; flex-shrink:0; cursor:grab; }
  .craft-block code { font-family:var(--mono); font-size:12px; color:var(--text2); white-space:pre; }
  .craft-actions { display:flex; gap:8px; justify-content:flex-end; }
  .craft-result-area { }
  .craft-result { border-radius:14px; padding:20px; text-align:center; }
  .craft-result-ok { background:rgba(88,204,2,.1); border:1px solid rgba(88,204,2,.3); }
  .craft-result-fail { background:rgba(255,75,75,.08); border:1px solid rgba(255,75,75,.25); }
  .craft-result-icon { font-size:48px; margin-bottom:8px; }
  .craft-result-title { font-size:16px; font-weight:800; margin-bottom:8px; }
  .craft-result-xp { font-family:var(--mono); font-size:18px; font-weight:900; color:var(--duo-green); }

  /* ── SYNTAX STORY ── */
  .story-select-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; padding:16px; }
  .story-select-card { background:var(--bg2); border:1.5px solid var(--border); border-radius:14px; padding:20px; cursor:pointer; transition:all .2s; text-align:center; }
  .story-select-card:hover { border-color:var(--duo-blue); transform:translateY(-3px); }
  .story-select-emoji { font-size:40px; margin-bottom:10px; display:block; }
  .story-select-title { font-size:14px; font-weight:800; margin-bottom:8px; }
  .story-select-meta { display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:6px; }
  .story-select-chapters { font-family:var(--mono); font-size:10px; color:var(--text3); }

  .story-chapter { padding:16px 20px; flex:1; display:flex; flex-direction:column; gap:14px; }
  .story-progress-bar { height:6px; background:var(--bg3); border-radius:99px; overflow:hidden; }
  .story-progress-fill { height:100%; background:linear-gradient(90deg,var(--duo-blue),var(--duo-green)); border-radius:99px; transition:width .4s; }
  .story-title-row { display:flex; align-items:center; gap:12px; }
  .story-emoji { font-size:36px; }
  .story-chapter-title { font-size:17px; font-weight:900; }
  .story-chapter-num { font-family:var(--mono); font-size:11px; color:var(--text3); margin-top:3px; }
  .story-text { font-size:15px; line-height:1.7; color:var(--text2); }
  .story-text strong { color:var(--text); font-weight:800; }
  .inline-code { background:var(--bg3); color:var(--duo-blue); font-family:var(--mono); font-size:13px; padding:1px 6px; border-radius:4px; border:1px solid var(--border); }
  .story-code-block { background:var(--bg3); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  .story-code-header { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; border-bottom:1px solid var(--border); }
  .story-code-lang { font-family:var(--mono); font-size:11px; color:var(--text3); }
  .story-copy-btn { background:transparent; border:1px solid var(--border2); color:var(--text3); padding:4px 10px; border-radius:6px; font-family:var(--font); font-size:11px; cursor:pointer; transition:all .15s; }
  .story-copy-btn:hover { border-color:var(--duo-blue); color:var(--duo-blue); }
  .story-code { margin:0; padding:14px; font-family:var(--mono); font-size:13px; color:var(--text2); line-height:1.6; overflow-x:auto; }
  .story-quiz { background:var(--bg2); border:1px solid var(--border); border-radius:14px; padding:16px; }
  .story-quiz-q { font-size:15px; font-weight:800; margin-bottom:12px; }
  .story-quiz-opts { display:flex; flex-direction:column; gap:8px; }
  .story-quiz-opt { background:var(--bg3); border:2px solid var(--border); border-radius:10px; padding:11px 14px; text-align:left; color:var(--text); font-family:var(--font); font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
  .story-quiz-opt:hover:not(:disabled) { border-color:var(--duo-blue); }
  .story-opt-correct { border-color:var(--duo-green) !important; background:rgba(88,204,2,.12) !important; }
  .story-opt-wrong { border-color:var(--duo-red) !important; background:rgba(255,75,75,.12) !important; }
  .story-quiz-exp { margin-top:12px; background:var(--bg3); border-radius:10px; padding:12px; font-size:13px; color:var(--text2); border-left:3px solid var(--duo-blue); line-height:1.6; }
  .exp-ok { color:var(--duo-green); font-weight:700; }
  .exp-fail { color:var(--duo-red); font-weight:700; }
  .story-nav { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:auto; }
  .story-complete { text-align:center; padding:40px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; }
  .story-complete-emoji { font-size:64px; animation:bounce .6s; }
  .story-complete-title { font-size:24px; font-weight:900; }
  .story-complete-sub { font-size:14px; color:var(--text3); }
  .story-complete-xp { font-family:var(--mono); font-size:22px; font-weight:900; color:var(--duo-green); }
  @keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

  /* ── SKILL MAP ── */
  .skillmap-container { display:grid; grid-template-columns:1fr 280px; flex:1; overflow:hidden; }
  @media(max-width:768px) { .skillmap-container { grid-template-columns:1fr; } }
  .skillmap-canvas-wrap { overflow:auto; padding:16px; background:var(--bg); }
  .skillmap-svg { width:100%; max-width:500px; display:block; margin:0 auto; }
  .skill-node { transition:all .2s; }
  .skill-node:hover rect { stroke-width:2.5 !important; }
  .skill-node.skill-available { animation:pulse-node 2s ease-in-out infinite; }
  @keyframes pulse-node { 0%,100%{opacity:1} 50%{opacity:.7} }
  .skillmap-panel { background:var(--bg2); border-left:1px solid var(--border); padding:20px; overflow-y:auto; }
  .skillmap-panel-empty { text-align:center; padding:20px 0; color:var(--text3); }
  .skillmap-detail { display:flex; flex-direction:column; gap:14px; }
  .skillmap-detail-header { display:flex; align-items:center; gap:12px; }
  .skillmap-detail-emoji { font-size:36px; }
  .skillmap-detail-title { font-size:17px; font-weight:900; }
  .skillmap-detail-desc { font-size:12px; color:var(--text3); margin-top:3px; }
  .skillmap-detail-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .skillmap-stat { background:var(--bg3); border-radius:10px; padding:10px; text-align:center; }
  .skillmap-stat-num { display:block; font-size:20px; font-weight:900; line-height:1; }
  .skillmap-stat-lbl { display:block; font-family:var(--mono); font-size:9px; color:var(--text3); text-transform:uppercase; margin-top:4px; }
  .stat-green { color:var(--duo-green); }
  .stat-blue { color:var(--duo-blue); }
  .stat-gray { color:var(--text3); }
  .skillmap-requires { display:flex; flex-direction:column; gap:6px; }
  .skillmap-req-label { font-family:var(--mono); font-size:10px; color:var(--text3); text-transform:uppercase; letter-spacing:.08em; }
  .skillmap-req-chip { font-size:12px; font-weight:700; padding:5px 12px; border-radius:99px; display:inline-block; }
  .req-done { background:rgba(88,204,2,.15); color:var(--duo-green); }
  .req-need { background:rgba(255,75,75,.12); color:var(--duo-red); }
  .skillmap-status-badge { border-radius:10px; padding:10px 14px; font-size:13px; font-weight:700; text-align:center; }
  .status-unlocked { background:rgba(88,204,2,.12); color:var(--duo-green); border:1px solid rgba(88,204,2,.3); }
  .status-locked { background:rgba(255,75,75,.08); color:var(--duo-red); border:1px solid rgba(255,75,75,.2); font-size:12px; }
  .skill-unlock-btn { background:var(--duo-blue); border:none; border-bottom:3px solid var(--duo-blue2); color:#fff; border-radius:99px; padding:12px 20px; font-family:var(--font); font-weight:800; font-size:14px; cursor:pointer; transition:filter .15s; }
  .skill-unlock-btn:hover { filter:brightness(1.1); }
  `;
  document.head.appendChild(s);
}

// ─── Автоинициализация ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('lang-lab-root')) {
    initLangLab('lang-lab-root');
  }
});