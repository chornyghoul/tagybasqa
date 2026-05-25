/**
 * TAGYBASQA — Плеер «Три в одном» v2.0 (lecture-player.js)
 *
 * НОВОЕ В v2.0:
 *  — Поиск по названию, описанию и тегам
 *  — Фильтр по subject (табы категорий) + level + сортировка
 *  — Карточки с рейтингом ⭐, кол-вом студентов и тегами
 *  — Встроенный системный промпт для генерации уроков через AI
 *  — Кнопка «Сгенерировать урок» (Claude API) прямо в каталоге
 *
 * СТРУКТУРА ЛЕКЦИИ (Firestore: collection "lectures"):
 * {
 *   title, description, subject, level, emoji, duration, videoUrl,
 *   tags: string[],
 *   rating: number (4.0–5.0),
 *   studentsCount: number,
 *   slides: [{ time, imageUrl, title }],
 *   timeline: [{ time, type, title, content, ...typeFields }]
 * }
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, query }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAywbSZkiReHjTq4oc46Kbw9iZ0iDHVTpY",
  authDomain: "pystart-dd2db.firebaseapp.com",
  projectId: "pystart-dd2db",
  storageBucket: "pystart-dd2db.firebasestorage.app",
  messagingSenderId: "9188811255",
  appId: "1:9188811255:web:6f7280f1f7f67b80d90ef2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const CONTAINER_SELECTOR = '#view-story .lesson-container';

// ─── Системный промпт для AI-генератора уроков ───────────────────────────────
const AI_SYSTEM_PROMPT = `Ты — ведущий AI-методолог и архитектор учебного контента для платформы Tagybasqa. Твоя задача — генерировать структурированные интерактивные лекции, которые идеально встраиваются в плеер «Три в одном» (синхронизация видео, слайдов и живого конспекта).

Каждый сгенерированный урок должен строго соответствовать JSON-схеме коллекции "lectures" в Firestore.

### 🎨 СТИЛИСТИКА И ТОН (В стиле Duolingo / Kahoot)
- Контент должен быть геймифицированным, увлекательным, без унылой академической лексики.
- Используй яркие emoji для блоков конспекта, подсказок и квизов.
- Задания должны быть короткими, бьющими в цель (микрообучение).

### 📐 СТРУКТУРНЫЕ ПРАВИЛА ГЕНЕРАЦИИ

1. Шкала времени (Timeline):
   - Все события (timeline и slides) привязываются к секундам (time).
   - Урок длится в среднем 15-25 минут (duration). Все таймкоды должны распределяться равномерно от 0 до (duration * 60).
   - Обязательно чередуй типы блоков: text, code, callout, quiz, checklist, task.

2. Типы интерактивных блоков:
   - quiz: Вопрос (content), ровно 4 варианта ответов (options), индекс правильного (correct от 0 до 3) и понятное объяснение (explanation).
   - task: Вопрос, строка точного ответа (expected), хитрая подсказка (hint). Ответ должен быть лаконичным (слово, число или короткая строка кода).
   - callout: Яркая иконка (icon) + инсайт.
   - code: Чистый код в поле content с указанием language.

3. Синхронизация слайдов (slides):
   - Каждые 2-3 минуты (120-180 секунд) должен меняться слайд.
   - У каждого слайда должен быть четкий, мотивирующий заголовок (title).

### 🛠 РАСШИРЕННЫЕ ПОЛЯ ДЛЯ КАТАЛОГА
Обязательно добавляй:
- subject: Направление (Python, JavaScript, Алгоритмы, Web-дизайн, ML/AI).
- level: beginner | intermediate | advanced
- tags: Массив строк-тегов (3-6 тегов, например: ["переменные", "основы", "типы данных"]).
- rating: Число от 4.0 до 5.0.
- studentsCount: Число студентов.

### 📥 ФОРМАТ ВЫХОДНЫХ ДАННЫХ
Выдавай результат СТРОГО в формате валидного JSON-объекта, без лишних слов, пояснений и разметки markdown (без \`\`\`json блоков). Начинай сразу с символа {.`;

// ─── Демо-данные ─────────────────────────────────────────────────────────────
const DEMO_LECTURES = [
  {
    id: 'demo-1',
    title: 'Введение в Python: Переменные и типы данных',
    description: 'Разберём основы Python: как хранить данные, какие типы существуют, и как Python отличается от других языков.',
    subject: 'Python',
    emoji: '🐍',
    duration: 18,
    level: 'beginner',
    tags: ['переменные', 'типы данных', 'основы', 'int', 'str'],
    rating: 4.9,
    studentsCount: 2340,
    videoUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8',
    slides: [
      { time: 0, imageUrl: null, title: 'Добро пожаловать в Python' },
      { time: 120, imageUrl: null, title: 'Что такое переменная?' },
      { time: 300, imageUrl: null, title: 'Типы данных: int, float, str, bool' },
      { time: 480, imageUrl: null, title: 'Динамическая типизация' },
      { time: 660, imageUrl: null, title: 'Практика: первая программа' },
    ],
    timeline: [
      { time: 45, type: 'callout', icon: '💡', title: 'Важно запомнить', content: 'В Python не нужно объявлять тип переменной заранее — интерпретатор определяет его автоматически при присвоении значения.' },
      { time: 100, type: 'code', title: 'Объявление переменных', language: 'python', content: 'name = "Алибек"     # str\nage = 17            # int\ngpa = 4.8           # float\nis_student = True   # bool\n\nprint(type(name))   # <class \'str\'>' },
      { time: 200, type: 'quiz', title: '⚡ Быстрая проверка', content: 'Какой тип данных имеет переменная x = 3.14?', options: ['int', 'str', 'float', 'bool'], correct: 2, explanation: 'Числа с точкой — это float (число с плавающей запятой).' },
      { time: 320, type: 'text', title: 'Зачем нужны типы данных?', content: 'Тип данных определяет, какие операции можно выполнять с переменной. Нельзя сложить строку и число без явного преобразования — Python выбросит TypeError.' },
      { time: 450, type: 'checklist', title: '📋 Чеклист понимания', items: ['Я понимаю, что такое переменная', 'Я знаю 4 базовых типа данных в Python', 'Я понимаю динамическую типизацию', 'Я могу использовать функцию type()'] },
      { time: 570, type: 'task', title: '🔧 Практика', content: 'Как называется тип данных для текстовых значений в Python?', expected: 'str', hint: 'Это сокращение от слова "string" (строка).' },
      { time: 720, type: 'quiz', title: '🎯 Финальный квиз', content: 'Что выведет: print(type(True))?', options: ["<class 'int'>", "<class 'bool'>", "<class 'str'>", 'True'], correct: 1, explanation: 'В Python bool — отдельный тип. Хотя True == 1, тип будет именно bool.' }
    ]
  },
  {
    id: 'demo-2',
    title: 'Алгоритмы сортировки: визуальный разбор',
    description: 'Пузырьковая, быстрая и сортировка слиянием — разбираем с временной сложностью и живыми примерами кода.',
    subject: 'Алгоритмы',
    emoji: '🔢',
    duration: 22,
    level: 'intermediate',
    tags: ['сортировка', 'big-o', 'алгоритмы', 'bubble sort', 'quick sort'],
    rating: 4.7,
    studentsCount: 1180,
    videoUrl: 'https://www.youtube.com/embed/g-PGLbMth_g',
    slides: [
      { time: 0, imageUrl: null, title: 'Зачем нужна сортировка?' },
      { time: 150, imageUrl: null, title: 'Bubble Sort: O(n²)' },
      { time: 420, imageUrl: null, title: 'Quick Sort: O(n log n)' },
      { time: 780, imageUrl: null, title: 'Merge Sort: O(n log n)' },
    ],
    timeline: [
      { time: 60, type: 'callout', icon: '📊', title: 'Нотация Big O', content: 'O(n²) означает: при удвоении входных данных время вырастет в 4 раза. O(n log n) — гораздо лучше для больших массивов.' },
      { time: 200, type: 'code', title: 'Bubble Sort на Python', language: 'python', content: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr' },
      { time: 310, type: 'quiz', title: '⚡ Проверка', content: 'Какова сложность Bubble Sort в худшем случае?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], correct: 2, explanation: 'Два вложенных цикла дают квадратичную сложность O(n²).' },
      { time: 500, type: 'task', title: '🔧 Задание', content: 'Какой алгоритм сортировки работает по принципу "разделяй и властвуй"?', expected: 'quick sort', hint: 'Этот алгоритм выбирает опорный элемент (pivot) и делит массив на две части.' },
      { time: 650, type: 'checklist', title: '📋 Что я усвоил', items: ['Понимаю нотацию Big O', 'Знаю как работает Bubble Sort', 'Понимаю Quick Sort', 'Могу объяснить разницу между O(n²) и O(n log n)'] }
    ]
  },
  {
    id: 'demo-3',
    title: 'Машинное обучение: нейросети с нуля',
    description: 'Как работает нейрон, перцептрон и простая нейросеть. Математика без страха — только понятные объяснения.',
    subject: 'ML / AI',
    emoji: '🧠',
    duration: 30,
    level: 'advanced',
    tags: ['нейросети', 'ml', 'deep learning', 'backpropagation', 'перцептрон'],
    rating: 4.8,
    studentsCount: 890,
    videoUrl: 'https://www.youtube.com/embed/aircAruvnKk',
    slides: [
      { time: 0, imageUrl: null, title: 'Биологический нейрон' },
      { time: 180, imageUrl: null, title: 'Математическая модель нейрона' },
      { time: 480, imageUrl: null, title: 'Функции активации' },
      { time: 900, imageUrl: null, title: 'Обратное распространение ошибки' },
    ],
    timeline: [
      { time: 90, type: 'callout', icon: '🧮', title: 'Формула нейрона', content: 'Выход нейрона: y = σ(w₁x₁ + w₂x₂ + ... + b), где σ — функция активации, w — веса, b — смещение.' },
      { time: 240, type: 'quiz', title: '⚡ Проверка', content: 'Для чего нужна функция активации в нейроне?', options: ['Для ускорения обучения', 'Для добавления нелинейности', 'Для нормализации данных', 'Для подбора весов'], correct: 1, explanation: 'Без функции активации нейросеть — это просто линейная модель. Нелинейность позволяет учить сложные паттерны.' },
      { time: 400, type: 'code', title: 'Нейрон на Python', language: 'python', content: 'import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef neuron(inputs, weights, bias):\n    z = np.dot(inputs, weights) + bias\n    return sigmoid(z)\n\n# Пример\noutput = neuron([0.5, 0.8], [0.4, 0.6], 0.1)\nprint(f"Выход: {output:.4f}")' },
      { time: 600, type: 'task', title: '🔧 Задание', content: 'Как называется процесс обновления весов нейросети на основе ошибки?', expected: 'backpropagation', hint: 'Ошибка "распространяется" от выходного слоя к входному.' },
      { time: 780, type: 'checklist', title: '📋 Финальный чеклист', items: ['Понимаю структуру нейрона', 'Знаю, что такое функция активации', 'Могу объяснить прямое и обратное распространение', 'Понимаю, как нейросеть учится'] }
    ]
  },
  {
    id: 'demo-4',
    title: 'CSS Grid и Flexbox: современные раскладки',
    description: 'Разбираем две главные системы раскладки CSS: Grid для двумерных сеток и Flexbox для одномерных линий.',
    subject: 'Фронтенд',
    emoji: '🎨',
    duration: 20,
    level: 'beginner',
    tags: ['css', 'grid', 'flexbox', 'вёрстка', 'layout'],
    rating: 4.6,
    studentsCount: 3120,
    videoUrl: 'https://www.youtube.com/embed/T-slCsOrLcc',
    slides: [
      { time: 0, imageUrl: null, title: 'Зачем нужны системы раскладки?' },
      { time: 150, imageUrl: null, title: 'Flexbox: главная ось и поперечная' },
      { time: 420, imageUrl: null, title: 'CSS Grid: строки и колонки' },
      { time: 720, imageUrl: null, title: 'Когда что применять?' },
    ],
    timeline: [
      { time: 60, type: 'callout', icon: '📐', title: 'Ключевое различие', content: 'Flexbox — одномерный (строка ИЛИ колонка). Grid — двумерный (строки И колонки одновременно). Выбирай исходя из задачи!' },
      { time: 180, type: 'code', title: 'Flexbox: центрирование', language: 'css', content: '.container {\n  display: flex;\n  justify-content: center; /* горизонталь */\n  align-items: center;     /* вертикаль */\n  gap: 16px;\n}' },
      { time: 300, type: 'quiz', title: '⚡ Проверка', content: 'Какое свойство CSS Grid отвечает за определение колонок?', options: ['grid-rows', 'grid-template-columns', 'flex-basis', 'grid-areas'], correct: 1, explanation: 'grid-template-columns задаёт количество и размер колонок в Grid-контейнере.' },
      { time: 480, type: 'code', title: 'CSS Grid: авторесайз', language: 'css', content: '.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n  gap: 20px;\n}\n/* Колонки сами подстроятся под ширину контейнера */' },
      { time: 620, type: 'task', title: '🔧 Задание', content: 'Каким CSS-свойством задаётся расстояние между элементами в Flexbox/Grid?', expected: 'gap', hint: 'Это современное свойство, которое заменяет margin между элементами.' },
      { time: 800, type: 'checklist', title: '📋 Итог', items: ['Знаю разницу Flexbox vs Grid', 'Умею центрировать через Flexbox', 'Умею создавать адаптивную сетку Grid', 'Знаю когда применять каждый инструмент'] }
    ]
  }
];

// ─── Состояние каталога ───────────────────────────────────────────────────────
let catalogState = {
  allLectures: [],
  searchQuery: '',
  activeSubject: 'all',
  activeLevel: 'all',
  sortBy: 'popular',
};

// ─── Состояние плеера ─────────────────────────────────────────────────────────
let playerState = {
  lecture: null, currentTime: 0, isPlaying: false,
  shownBlocks: new Set(), pendingBlock: null,
  currentSlideIndex: 0, videoEl: null,
  timerInterval: null, completedInteractions: new Set(),
};

// ─── Точка входа ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector(CONTAINER_SELECTOR);
  if (!container) return;
  injectPlayerStyles();
  renderCatalog(container);
});

// ═══════════════════════════════════════════════════════════════════════════════
// КАТАЛОГ С ПОИСКОМ И ФИЛЬТРАМИ
// ═══════════════════════════════════════════════════════════════════════════════

async function renderCatalog(container) {
  container.innerHTML = `<div class="lp-loading">⏳ Загрузка лекций...</div>`;

  let lectures = [];
  try {
    const snap = await getDocs(query(collection(db, "lectures")));
    snap.forEach(d => lectures.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Firebase недоступен, используем демо-данные:", e);
  }
  if (!lectures.length) lectures = DEMO_LECTURES;

  catalogState.allLectures = lectures;
  container.innerHTML = '';

  // ── Заголовок ──────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'lp-catalog-header';
  header.innerHTML = `
    <div class="lp-header-top">
      <div class="lp-header-text">
        <h1 class="lp-catalog-title"><span class="lp-title-accent">▶</span> Интерактивные лекции</h1>
        <p class="lp-catalog-desc">Видео + слайды + живой конспект — всё синхронизировано на одной шкале времени</p>
      </div>
      <button class="lp-ai-gen-btn" id="lpAiGenBtn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Сгенерировать урок
      </button>
    </div>
    <div class="lp-feature-pills">
      <div class="lp-feature-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Интерактивные паузы</div>
      <div class="lp-feature-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Живой конспект</div>
      <div class="lp-feature-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Синхронизация слайдов</div>
    </div>
  `;
  container.appendChild(header);

  // ── Панель фильтров ────────────────────────────────────────────────────────
  const subjects = ['all', ...new Set(lectures.map(l => l.subject).filter(Boolean))];
  const filterPanel = document.createElement('div');
  filterPanel.className = 'lp-catalog-filters';
  filterPanel.innerHTML = `
    <div class="lp-search-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="lpSearchInput" placeholder="Поиск по теме, тегу или технологии...">
      <button class="lp-search-clear" id="lpSearchClear" style="display:none">✕</button>
    </div>
    <div class="lp-filter-row">
      <div class="lp-subject-tabs" id="lpSubjectTabs">
        ${subjects.map(s => `
          <button class="lp-subject-tab ${s === 'all' ? 'active' : ''}" data-subject="${s}">
            ${s === 'all' ? '🌐 Все' : s}
          </button>`).join('')}
      </div>
      <div class="lp-filter-selects">
        <select id="lpLevelFilter" class="lp-select">
          <option value="all">📊 Все уровни</option>
          <option value="beginner">🟢 Начинающий</option>
          <option value="intermediate">🟡 Средний</option>
          <option value="advanced">🟣 Продвинутый</option>
        </select>
        <select id="lpSortSelect" class="lp-select">
          <option value="popular">🔥 По популярности</option>
          <option value="rating">⭐ Высший рейтинг</option>
          <option value="duration">⏱ По длительности</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(filterPanel);

  // ── Счётчик и сетка ───────────────────────────────────────────────────────
  const resultsBar = document.createElement('div');
  resultsBar.className = 'lp-results-bar';
  resultsBar.id = 'lpResultsBar';
  container.appendChild(resultsBar);

  const grid = document.createElement('div');
  grid.className = 'lp-catalog-grid';
  grid.id = 'lpCatalogGrid';
  container.appendChild(grid);

  // ── AI-генератор модал ─────────────────────────────────────────────────────
  const genModal = buildGenModal();
  container.appendChild(genModal);

  // ── Навешиваем обработчики фильтров ───────────────────────────────────────
  const searchInput = document.getElementById('lpSearchInput');
  const searchClear = document.getElementById('lpSearchClear');

  searchInput?.addEventListener('input', (e) => {
    catalogState.searchQuery = e.target.value;
    searchClear.style.display = e.target.value ? '' : 'none';
    renderGrid(container);
  });
  searchClear?.addEventListener('click', () => {
    searchInput.value = '';
    catalogState.searchQuery = '';
    searchClear.style.display = 'none';
    renderGrid(container);
  });

  document.getElementById('lpSubjectTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.lp-subject-tab');
    if (!btn) return;
    document.querySelectorAll('.lp-subject-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    catalogState.activeSubject = btn.dataset.subject;
    renderGrid(container);
  });

  document.getElementById('lpLevelFilter')?.addEventListener('change', (e) => {
    catalogState.activeLevel = e.target.value;
    renderGrid(container);
  });

  document.getElementById('lpSortSelect')?.addEventListener('change', (e) => {
    catalogState.sortBy = e.target.value;
    renderGrid(container);
  });

  document.getElementById('lpAiGenBtn')?.addEventListener('click', () => {
    document.getElementById('lpGenModal').classList.add('active');
  });

  initGenModal(container);
  renderGrid(container);
}

// ─── Фильтрация + рендер сетки ───────────────────────────────────────────────
function renderGrid(container) {
  const grid = document.getElementById('lpCatalogGrid');
  const resultsBar = document.getElementById('lpResultsBar');
  if (!grid) return;

  let list = [...catalogState.allLectures];

  // Поиск
  if (catalogState.searchQuery) {
    const q = catalogState.searchQuery.toLowerCase();
    list = list.filter(l =>
      (l.title || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (l.subject || '').toLowerCase().includes(q)
    );
  }

  // Фильтр по предмету
  if (catalogState.activeSubject !== 'all') {
    list = list.filter(l => l.subject === catalogState.activeSubject);
  }

  // Фильтр по уровню
  if (catalogState.activeLevel !== 'all') {
    list = list.filter(l => l.level === catalogState.activeLevel);
  }

  // Сортировка
  if (catalogState.sortBy === 'popular') {
    list.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
  } else if (catalogState.sortBy === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (catalogState.sortBy === 'duration') {
    list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
  }

  // Счётчик результатов
  if (resultsBar) {
    if (catalogState.searchQuery || catalogState.activeSubject !== 'all' || catalogState.activeLevel !== 'all') {
      resultsBar.innerHTML = `<span class="lp-results-count">${list.length} лекций найдено</span>${catalogState.searchQuery ? `<span class="lp-results-query">по запросу «${esc(catalogState.searchQuery)}»</span>` : ''}`;
      resultsBar.style.display = '';
    } else {
      resultsBar.style.display = 'none';
    }
  }

  // Пустой результат
  if (!list.length) {
    grid.innerHTML = `
      <div class="lp-empty-state">
        <div class="lp-empty-icon">🔍</div>
        <p class="lp-empty-title">Ничего не найдено</p>
        <p class="lp-empty-desc">Попробуйте изменить запрос или сбросить фильтры</p>
        <button class="lp-reset-btn" id="lpResetFilters">Сбросить фильтры</button>
      </div>`;
    document.getElementById('lpResetFilters')?.addEventListener('click', () => {
      catalogState.searchQuery = '';
      catalogState.activeSubject = 'all';
      catalogState.activeLevel = 'all';
      catalogState.sortBy = 'popular';
      document.getElementById('lpSearchInput').value = '';
      document.getElementById('lpSearchClear').style.display = 'none';
      document.getElementById('lpLevelFilter').value = 'all';
      document.getElementById('lpSortSelect').value = 'popular';
      document.querySelectorAll('.lp-subject-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
      renderGrid(container);
    });
    return;
  }

  const LEVEL_MAP = {
    beginner: ['🟢 Начинающий', 'var(--duo-green)'],
    intermediate: ['🟡 Средний', 'var(--duo-orange)'],
    advanced: ['🟣 Продвинутый', 'var(--duo-purple, #a560e8)']
  };

  grid.innerHTML = '';
  list.forEach(lec => {
    const [levelLabel, levelColor] = LEVEL_MAP[lec.level] || ['⚪ Общий', 'var(--duo-blue)'];
    const interactiveCount = (lec.timeline || []).filter(b => ['quiz', 'task'].includes(b.type)).length;
    const slideCount = (lec.slides || []).length;
    const rating = lec.rating ? lec.rating.toFixed(1) : '—';
    const students = lec.studentsCount ? formatCount(lec.studentsCount) : '—';
    const tags = (lec.tags || []).slice(0, 3);

    const card = document.createElement('div');
    card.className = 'lp-lecture-card';
    card.innerHTML = `
      <div class="lp-card-top">
        <span class="lp-card-subject">${esc(lec.subject || 'Python')}</span>
        <span class="lp-card-level" style="color:${levelColor}">${levelLabel}</span>
      </div>
      <div class="lp-card-body">
        <div class="lp-card-emoji">${lec.emoji || '📖'}</div>
        <div class="lp-card-text">
          <h3 class="lp-card-title">${esc(lec.title)}</h3>
          <p class="lp-card-desc">${esc(lec.description || '')}</p>
        </div>
      </div>
      ${tags.length ? `<div class="lp-card-tags">${tags.map(t => `<span class="lp-tag">#${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="lp-card-stats">
        <div class="lp-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${lec.duration || '?'} мин
        </div>
        <div class="lp-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          ${slideCount} слайдов
        </div>
        <div class="lp-stat lp-stat-rating">
          <svg viewBox="0 0 24 24" fill="var(--duo-orange)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${rating}
        </div>
        <div class="lp-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${students}
        </div>
      </div>
      <div class="lp-card-footer">
        <div class="lp-interact-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${interactiveCount} заданий
        </div>
        <button class="lp-start-btn">

          Открыть лекцию
        </button>
      </div>
    `;

    const startBtn = card.querySelector('.lp-start-btn');
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); openPlayer(lec, container); });
    card.addEventListener('click', () => openPlayer(lec, container));

    grid.appendChild(card);
    // Анимация появления
    requestAnimationFrame(() => card.classList.add('lp-card-visible'));
  });
}

// ─── AI-генератор модал ───────────────────────────────────────────────────────
function buildGenModal() {
  const modal = document.createElement('div');
  modal.className = 'lp-modal-overlay';
  modal.id = 'lpGenModal';
  modal.innerHTML = `
    <div class="lp-modal-box">
      <div class="lp-modal-header">
        <div class="lp-modal-title">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Сгенерировать урок с AI
        </div>
        <button class="lp-modal-close" id="lpGenClose">✕</button>
      </div>
      <div class="lp-modal-body">
        <p class="lp-modal-desc">Опишите тему, уровень и стиль урока — AI создаст полноценную интерактивную лекцию с таймлайном, квизами и заданиями.</p>
        <div class="lp-gen-field">
          <label class="lp-gen-label">Тема урока</label>
          <input type="text" id="lpGenTopic" class="lp-gen-input" placeholder="Например: Списки в Python для начинающих">
        </div>
        <div class="lp-gen-field-row">
          <div class="lp-gen-field">
            <label class="lp-gen-label">Предмет</label>
            <select id="lpGenSubject" class="lp-select">
              <option>Python</option>
              <option>JavaScript</option>
              <option>Алгоритмы</option>
              <option>Фронтенд</option>
              <option>ML / AI</option>
            </select>
          </div>
          <div class="lp-gen-field">
            <label class="lp-gen-label">Уровень</label>
            <select id="lpGenLevel" class="lp-select">
              <option value="beginner">🟢 Начинающий</option>
              <option value="intermediate">🟡 Средний</option>
              <option value="advanced">🟣 Продвинутый</option>
            </select>
          </div>
          <div class="lp-gen-field">
            <label class="lp-gen-label">Длина</label>
            <select id="lpGenDuration" class="lp-select">
              <option value="15">15 минут</option>
              <option value="20" selected>20 минут</option>
              <option value="25">25 минут</option>
            </select>
          </div>
        </div>
        <div class="lp-gen-prompt-wrap">
          <div class="lp-gen-prompt-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Системный промпт для AI (можно редактировать)
          </div>
          <textarea id="lpGenSystemPrompt" class="lp-gen-textarea" rows="5">${AI_SYSTEM_PROMPT.substring(0, 400)}...</textarea>
        </div>
        <div class="lp-gen-result" id="lpGenResult" style="display:none">
          <div class="lp-gen-result-header">
            <span>📄 Сгенерированный JSON</span>
            <button class="lp-copy-btn" id="lpCopyJson">Скопировать</button>
          </div>
          <pre class="lp-gen-json" id="lpGenJson"></pre>
          <button class="lp-add-demo-btn" id="lpAddToDemo">➕ Добавить в каталог (демо)</button>
        </div>
        <div class="lp-gen-error" id="lpGenError" style="display:none"></div>
      </div>
      <div class="lp-modal-footer">
        <button class="lp-cancel-btn" id="lpGenCancel">Отмена</button>
        <button class="lp-gen-submit-btn" id="lpGenSubmit">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Сгенерировать
        </button>
      </div>
    </div>
  `;
  return modal;
}

function initGenModal(container) {
  document.getElementById('lpGenClose')?.addEventListener('click', closeGenModal);
  document.getElementById('lpGenCancel')?.addEventListener('click', closeGenModal);
  document.getElementById('lpGenModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'lpGenModal') closeGenModal();
  });

  document.getElementById('lpGenSubmit')?.addEventListener('click', async () => {
    const topic = document.getElementById('lpGenTopic')?.value?.trim();
    if (!topic) { showGenError('Введите тему урока'); return; }

    const subject = document.getElementById('lpGenSubject')?.value;
    const level = document.getElementById('lpGenLevel')?.value;
    const duration = document.getElementById('lpGenDuration')?.value;
    const btn = document.getElementById('lpGenSubmit');
    const resultEl = document.getElementById('lpGenResult');
    const errorEl = document.getElementById('lpGenError');

    btn.disabled = true;
    btn.textContent = '⏳ Генерирую...';
    resultEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const userPrompt = `Создай интерактивную лекцию на тему: "${topic}".
Предмет: ${subject}
Уровень: ${level}
Длительность: ${duration} минут
Используй реальный YouTube embed URL для видео по данной теме (или поставь null если не знаешь точного URL).
Сгенерируй не менее 6-8 блоков в timeline, равномерно распределённых по всей длительности урока.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: AI_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }]
        })
      });

      const data = await response.json();
      const rawText = data.content?.map(c => c.text || '').join('').trim();

      // Попытка распарсить JSON
      let parsed;
      try {
        const clean = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        throw new Error('AI вернул невалидный JSON. Попробуйте ещё раз.');
      }

      parsed.id = 'ai-' + Date.now();
      const formatted = JSON.stringify(parsed, null, 2);
      document.getElementById('lpGenJson').textContent = formatted;
      resultEl.style.display = '';

      // Скопировать
      document.getElementById('lpCopyJson')?.addEventListener('click', () => {
        navigator.clipboard.writeText(formatted).then(() => {
          document.getElementById('lpCopyJson').textContent = '✓ Скопировано!';
          setTimeout(() => document.getElementById('lpCopyJson').textContent = 'Скопировать', 2000);
        });
      }, { once: true });

      // Добавить в каталог
      document.getElementById('lpAddToDemo')?.addEventListener('click', () => {
        catalogState.allLectures.unshift(parsed);
        renderGrid(container);
        closeGenModal();
      }, { once: true });

    } catch (err) {
      showGenError(err.message || 'Ошибка генерации. Попробуйте снова.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Сгенерировать';
    }
  });
}

function closeGenModal() {
  document.getElementById('lpGenModal')?.classList.remove('active');
}
function showGenError(msg) {
  const el = document.getElementById('lpGenError');
  if (el) { el.textContent = '❌ ' + msg; el.style.display = ''; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ПЛЕЕР «ТРИ В ОДНОМ»
// ═══════════════════════════════════════════════════════════════════════════════

function openPlayer(lecture, container) {
  clearInterval(playerState.timerInterval);
  playerState = {
    lecture, currentTime: 0, isPlaying: false,
    shownBlocks: new Set(), pendingBlock: null,
    currentSlideIndex: 0, videoEl: null,
    timerInterval: null, completedInteractions: new Set(),
  };
  container.innerHTML = '';
  container.appendChild(buildPlayerDOM(lecture));
  initPlayerLogic(lecture);
}

function buildPlayerDOM(lecture) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lp-player-wrapper';
  wrapper.id = 'lp-player';
  const isYouTube = lecture.videoUrl && lecture.videoUrl.includes('youtube');

  wrapper.innerHTML = `
    <div class="lp-player-topbar">
      <button class="lp-back-btn" id="lpBackBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Назад
      </button>
      <div class="lp-player-title"><span class="lp-player-emoji">${lecture.emoji || '📖'}</span>${esc(lecture.title)}</div>
      <div class="lp-player-meta">
        ${lecture.rating ? `<span class="lp-player-rating">⭐ ${lecture.rating.toFixed(1)}</span>` : ''}
        ${lecture.studentsCount ? `<span class="lp-player-students">👥 ${formatCount(lecture.studentsCount)}</span>` : ''}
      </div>
      <div class="lp-player-progress-wrap">
        <div class="lp-player-progress-bar"><div class="lp-player-progress-fill" id="lpProgressFill" style="width:0%"></div></div>
        <span class="lp-player-time-label" id="lpTimeLabel">0:00</span>
      </div>
    </div>

    <div class="lp-player-body">
      <div class="lp-left-col">
        <div class="lp-media-panel">
          <div class="lp-media-tabs">
            <button class="lp-media-tab active" id="lpTabVideo">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>Видео
            </button>
            <button class="lp-media-tab" id="lpTabSlides">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Слайды
            </button>
          </div>
          <div class="lp-video-container" id="lpVideoContainer">
            ${isYouTube
      ? `<iframe id="lpVideoFrame" src="${lecture.videoUrl}?enablejsapi=1&rel=0" frameborder="0" allowfullscreen></iframe>`
      : `<video id="lpVideoEl" src="${lecture.videoUrl}" controls></video>`
    }
            <div class="lp-pause-overlay" id="lpPauseOverlay" style="display:none">
              <div class="lp-pause-icon">⏸</div>
              <div class="lp-pause-label">Ответьте на вопрос →</div>
            </div>
          </div>
          <div class="lp-slides-container" id="lpSlidesContainer" style="display:none">
            <div class="lp-slide-view">
              <div class="lp-slide-placeholder" id="lpSlidePlaceholder">
                <div class="lp-slide-num" id="lpSlideNum">Слайд 1</div>
                <div class="lp-slide-title-big" id="lpSlideTitleBig">${esc(lecture.slides?.[0]?.title || lecture.title)}</div>
              </div>
            </div>
            <div class="lp-slides-strip" id="lpSlidesStrip">
              ${(lecture.slides || []).map((s, i) => `
                <div class="lp-slide-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <div class="lp-thumb-num">${i + 1}</div>
                  <div class="lp-thumb-title">${esc(s.title)}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="lp-timeline-strip">
            <div class="lp-timeline-track">
              <div class="lp-timeline-cursor" id="lpTimelineCursor" style="left:0%"></div>
              ${buildTimelineMarkers(lecture)}
            </div>
          </div>
          ${isYouTube ? `
          <div class="lp-sim-controls">
            <div class="lp-sim-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Демо-режим: нажмите для симуляции синхронизации конспекта.
            </div>
            <button class="lp-sim-btn" id="lpSimBtn">▶ Симулировать лекцию</button>
            <button class="lp-sim-stop" id="lpSimStop" style="display:none">⏹ Стоп</button>
          </div>` : ''}
        </div>
      </div>
      <div class="lp-right-col">
        <div class="lp-notes-panel">
          <div class="lp-notes-header">
            <span class="lp-notes-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Живой конспект
            </span>
            <div class="lp-notes-counter"><span id="lpCompletedCount">0</span> / ${(lecture.timeline || []).filter(b => ['quiz', 'task'].includes(b.type)).length} заданий</div>
          </div>
          <div class="lp-notes-stream" id="lpNotesStream">
            <div class="lp-notes-waiting">
              <div class="lp-waiting-pulse"></div>
              <p>Запустите лекцию — конспект начнёт обновляться синхронно с видео</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  return wrapper;
}

function buildTimelineMarkers(lecture) {
  const totalSec = (lecture.duration || 20) * 60;
  const COLORS = { quiz: '#58cc02', task: '#ff9600', callout: '#1cb0f6', code: '#a560e8', text: '#4b9fff', checklist: '#ff4b4b' };
  return (lecture.timeline || []).map(b => {
    const pct = Math.min(99, (b.time / totalSec) * 100);
    return `<div class="lp-tl-marker" style="left:${pct}%;background:${COLORS[b.type] || '#999'}" title="${esc(b.title || b.type)}"></div>`;
  }).join('');
}

function initPlayerLogic(lecture) {
  const totalSec = (lecture.duration || 20) * 60;

  document.getElementById('lpBackBtn')?.addEventListener('click', () => {
    clearInterval(playerState.timerInterval);
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (container) renderCatalog(container);
  });

  document.getElementById('lpTabVideo')?.addEventListener('click', () => switchMediaTab('video'));
  document.getElementById('lpTabSlides')?.addEventListener('click', () => switchMediaTab('slides'));

  document.querySelectorAll('.lp-slide-thumb').forEach(t => {
    t.addEventListener('click', () => { activateSlide(lecture, parseInt(t.dataset.index)); switchMediaTab('slides'); });
  });

  const videoEl = document.getElementById('lpVideoEl');
  if (videoEl) {
    playerState.videoEl = videoEl;
    videoEl.addEventListener('timeupdate', () => {
      if (playerState.pendingBlock !== null) return;
      onTick(Math.floor(videoEl.currentTime), totalSec, lecture);
    });
  }

  const simBtn = document.getElementById('lpSimBtn');
  const simStop = document.getElementById('lpSimStop');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      simBtn.style.display = 'none'; simStop.style.display = '';
      startSimulation(lecture, totalSec);
    });
    simStop?.addEventListener('click', () => {
      clearInterval(playerState.timerInterval);
      simBtn.style.display = ''; simStop.style.display = 'none';
      playerState.currentTime = 0; hidePauseOverlay();
    });
  }
}

function startSimulation(lecture, totalSec) {
  clearInterval(playerState.timerInterval);
  playerState.timerInterval = setInterval(() => {
    if (playerState.pendingBlock !== null) return;
    playerState.currentTime += 5;
    if (playerState.currentTime > totalSec) {
      clearInterval(playerState.timerInterval);
      document.getElementById('lpSimBtn').style.display = '';
      document.getElementById('lpSimStop').style.display = 'none';
      return;
    }
    onTick(playerState.currentTime, totalSec, lecture);
  }, 800);
}

function onTick(t, totalSec, lecture) {
  const pct = Math.min(100, (t / totalSec) * 100);
  const fill = document.getElementById('lpProgressFill');
  const cursor = document.getElementById('lpTimelineCursor');
  const label = document.getElementById('lpTimeLabel');
  if (fill) fill.style.width = pct + '%';
  if (cursor) cursor.style.left = pct + '%';
  if (label) label.textContent = formatTime(t);

  // Слайды
  let slideIdx = 0;
  (lecture.slides || []).forEach((s, i) => { if (s.time <= t) slideIdx = i; });
  if (slideIdx !== playerState.currentSlideIndex) {
    playerState.currentSlideIndex = slideIdx;
    activateSlide(lecture, slideIdx);
  }

  // Блоки конспекта
  (lecture.timeline || []).forEach((block, idx) => {
    if (!playerState.shownBlocks.has(idx) && t >= block.time) {
      playerState.shownBlocks.add(idx);
      appendNoteBlock(block, idx);
      if (['quiz', 'task'].includes(block.type)) {
        playerState.pendingBlock = idx;
        showPauseOverlay(); pauseVideo();
      }
    }
  });
}

function appendNoteBlock(block, idx) {
  const stream = document.getElementById('lpNotesStream');
  if (!stream) return;
  stream.querySelector('.lp-notes-waiting')?.remove();

  const el = document.createElement('div');
  el.className = `lp-note-block lp-note-${block.type}`;
  el.id = `lp-block-${idx}`;

  const ICONS = { text: '📝', code: '💻', callout: block.icon || '💡', quiz: '⚡', task: '🔧', checklist: '📋' };
  let inner = '';

  if (block.type === 'text' || block.type === 'callout') {
    inner = `<div class="lp-block-head"><span class="lp-block-icon">${ICONS[block.type]}</span><span class="lp-block-title">${esc(block.title)}</span></div><p class="lp-block-text">${esc(block.content)}</p>`;
  } else if (block.type === 'code') {
    inner = `<div class="lp-block-head"><span class="lp-block-icon">💻</span><span class="lp-block-title">${esc(block.title)}</span><span class="lp-lang-badge">${esc(block.language || 'code')}</span></div><pre class="lp-code-block"><code>${esc(block.content)}</code></pre>`;
  } else if (block.type === 'checklist') {
    inner = `<div class="lp-block-head"><span class="lp-block-icon">📋</span><span class="lp-block-title">${esc(block.title)}</span></div><div class="lp-checklist">${(block.items || []).map((item, i) => `<label class="lp-check-item"><input type="checkbox" class="lp-checkbox"><span class="lp-check-text">${esc(item)}</span></label>`).join('')}</div>`;
  } else if (block.type === 'quiz') {
    inner = `
      <div class="lp-block-head lp-block-head--quiz"><span class="lp-block-icon">⚡</span><span class="lp-block-title">${esc(block.title)}</span><span class="lp-block-badge lp-badge-required">Обязательно</span></div>
      <p class="lp-quiz-question">${esc(block.content)}</p>
      <div class="lp-quiz-options">${(block.options || []).map((opt, i) => `<button class="lp-quiz-opt" data-block="${idx}" data-opt="${i}" data-correct="${block.correct}"><span class="lp-opt-letter">${'ABCD'[i]}</span>${esc(opt)}</button>`).join('')}</div>
      <div class="lp-quiz-explanation" id="lp-exp-${idx}" style="display:none"></div>`;
  } else if (block.type === 'task') {
    inner = `
      <div class="lp-block-head lp-block-head--quiz"><span class="lp-block-icon">🔧</span><span class="lp-block-title">${esc(block.title)}</span><span class="lp-block-badge lp-badge-required">Обязательно</span></div>
      <p class="lp-quiz-question">${esc(block.content)}</p>
      <div class="lp-task-input-wrap"><input type="text" class="lp-task-input" id="lp-task-input-${idx}" placeholder="Введите ответ..."><button class="lp-task-submit" data-block="${idx}">Проверить</button></div>
      ${block.hint ? `<div class="lp-task-hint" id="lp-hint-${idx}" style="display:none">💬 ${esc(block.hint)}</div>` : ''}
      <div class="lp-quiz-explanation" id="lp-exp-${idx}" style="display:none"></div>`;
  }

  el.innerHTML = inner;
  stream.appendChild(el);
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  attachBlockHandlers(el, block, idx);
}

function attachBlockHandlers(el, block, idx) {
  el.querySelectorAll('.lp-quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (playerState.completedInteractions.has(idx)) return;
      const chosen = parseInt(btn.dataset.opt);
      const correct = parseInt(btn.dataset.correct);
      const expEl = document.getElementById(`lp-exp-${idx}`);
      el.querySelectorAll('.lp-quiz-opt').forEach(b => {
        b.disabled = true;
        if (parseInt(b.dataset.opt) === correct) b.classList.add('lp-opt-correct');
        else if (parseInt(b.dataset.opt) === chosen) b.classList.add('lp-opt-wrong');
      });
      if (chosen === correct) {
        if (expEl) { expEl.textContent = '✅ ' + (block.explanation || 'Верно!'); expEl.style.display = ''; expEl.className = 'lp-quiz-explanation lp-exp-correct'; }
        completeInteraction(idx);
      } else {
        if (expEl) { expEl.textContent = '❌ ' + (block.explanation || 'Попробуйте ещё раз.'); expEl.style.display = ''; expEl.className = 'lp-quiz-explanation lp-exp-wrong'; }
        setTimeout(() => {
          el.querySelectorAll('.lp-quiz-opt').forEach(b => { b.disabled = false; b.classList.remove('lp-opt-wrong'); });
          if (expEl) expEl.style.display = 'none';
        }, 2200);
      }
    });
  });

  el.querySelector('.lp-task-submit')?.addEventListener('click', () => {
    if (playerState.completedInteractions.has(idx)) return;
    const input = document.getElementById(`lp-task-input-${idx}`);
    const answer = (input?.value || '').trim().toLowerCase();
    const expected = (block.expected || '').toLowerCase();
    const expEl = document.getElementById(`lp-exp-${idx}`);
    const hintEl = document.getElementById(`lp-hint-${idx}`);
    if (answer === expected || answer.includes(expected)) {
      if (expEl) { expEl.textContent = '✅ Правильно! Продолжаем лекцию.'; expEl.style.display = ''; expEl.className = 'lp-quiz-explanation lp-exp-correct'; }
      if (input) input.disabled = true;
      el.querySelector('.lp-task-submit').disabled = true;
      completeInteraction(idx);
    } else {
      if (hintEl) hintEl.style.display = '';
      if (expEl) { expEl.textContent = '❌ Не совсем. Попробуйте ещё раз.'; expEl.style.display = ''; expEl.className = 'lp-quiz-explanation lp-exp-wrong'; }
      input?.classList.add('lp-input-shake');
      setTimeout(() => input?.classList.remove('lp-input-shake'), 500);
    }
  });
}

function completeInteraction(idx) {
  playerState.completedInteractions.add(idx);
  const counter = document.getElementById('lpCompletedCount');
  if (counter) counter.textContent = playerState.completedInteractions.size;
  if (playerState.pendingBlock === idx) {
    playerState.pendingBlock = null;
    hidePauseOverlay();
    const blockEl = document.getElementById(`lp-block-${idx}`);
    if (blockEl) { const b = document.createElement('div'); b.className = 'lp-completed-badge'; b.textContent = '✓ Завершено — видео продолжается'; blockEl.appendChild(b); }
    resumeVideo();
  }
}

function showPauseOverlay() { const o = document.getElementById('lpPauseOverlay'); if (o) o.style.display = 'flex'; }
function hidePauseOverlay() { const o = document.getElementById('lpPauseOverlay'); if (o) o.style.display = 'none'; }
function pauseVideo() { playerState.videoEl?.pause(); }
function resumeVideo() { playerState.videoEl?.play(); }

function activateSlide(lecture, idx) {
  const slides = lecture.slides || [];
  const slide = slides[idx];
  if (!slide) return;
  document.getElementById('lpSlideNum').textContent = `Слайд ${idx + 1} из ${slides.length}`;
  document.getElementById('lpSlideTitleBig').textContent = slide.title || '';
  document.querySelectorAll('.lp-slide-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

function switchMediaTab(mode) {
  const v = document.getElementById('lpVideoContainer');
  const s = document.getElementById('lpSlidesContainer');
  const tv = document.getElementById('lpTabVideo');
  const ts = document.getElementById('lpTabSlides');
  if (mode === 'video') { v.style.display = ''; s.style.display = 'none'; tv.classList.add('active'); ts.classList.remove('active'); }
  else { v.style.display = 'none'; s.style.display = ''; tv.classList.remove('active'); ts.classList.add('active'); }
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────
function esc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function formatTime(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function formatCount(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); }

// ═══════════════════════════════════════════════════════════════════════════════
// СТИЛИ
// ═══════════════════════════════════════════════════════════════════════════════
// ... (весь предыдущий код остаётся без изменений до injectPlayerStyles)

function injectPlayerStyles() {
  if (document.getElementById('lp-styles')) return;
  const s = document.createElement('style');
  s.id = 'lp-styles';
  s.textContent = `
    .lp-loading { text-align:center; padding:60px; color:var(--text3); font-family:var(--mono); font-size:14px; }

    /* ── Каталог ── */
    .lp-catalog-header { padding: 24px 28px 0; }
    .lp-header-top { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:12px; flex-wrap:wrap; }
    .lp-catalog-title { font-size:26px; font-weight:900; color:#fff; margin:0 0 5px; line-height:1.1; }
    .lp-title-accent { color:var(--duo-green); margin-right:6px; }
    .lp-catalog-desc { color:var(--text3); font-size:13px; font-family:var(--mono); margin:0; }
    .lp-feature-pills { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .lp-feature-pill { display:flex; align-items:center; gap:6px; background:var(--bg2); border:1px solid var(--border2); border-radius:20px; padding:5px 11px; font-size:11px; font-family:var(--mono); color:var(--text2); font-weight:600; }
    .lp-feature-pill svg { width:12px; height:12px; color:var(--duo-green); }

    /* AI-кнопка */
    .lp-ai-gen-btn { display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#7c3aed,#4f46e5); border:none; border-radius:var(--r); padding:10px 18px; color:#fff; font-family:var(--font); font-size:13px; font-weight:800; cursor:pointer; white-space:nowrap; transition:opacity 0.15s,transform 0.15s; flex-shrink:0; }
    .lp-ai-gen-btn:hover { opacity:.9; transform:translateY(-1px); }
    .lp-ai-gen-btn svg { width:14px; height:14px; }

    /* ── Фильтры ── */
    .lp-catalog-filters { padding:16px 28px; display:flex; flex-direction:column; gap:12px; border-bottom:1px solid var(--border); }
    .lp-search-box { display:flex; align-items:center; gap:10px; background:var(--bg2); border:1.5px solid var(--border2); border-radius:var(--r2); padding:0 14px; transition:border-color 0.15s; }
    .lp-search-box:focus-within { border-color:var(--duo-blue); }
    .lp-search-box svg { width:16px; height:16px; color:var(--text3); flex-shrink:0; }
    .lp-search-box input { flex:1; background:transparent; border:none; outline:none; color:#fff; font-family:var(--mono); font-size:13px; padding:11px 0; }
    .lp-search-box input::placeholder { color:var(--text3); }
    .lp-search-clear { background:transparent; border:none; color:var(--text3); font-size:12px; cursor:pointer; padding:4px; border-radius:4px; }
    .lp-search-clear:hover { color:#fff; background:var(--bg3); }

    .lp-filter-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .lp-subject-tabs { display:flex; gap:6px; flex-wrap:wrap; flex:1; }
    .lp-subject-tab { background:var(--bg2); border:1.5px solid var(--border2); border-radius:20px; padding:6px 14px; font-family:var(--font); font-size:12px; font-weight:700; color:var(--text3); cursor:pointer; transition:all 0.15s; white-space:nowrap; }
    .lp-subject-tab:hover { color:var(--text2); border-color:var(--border3); }
    .lp-subject-tab.active { background:var(--duo-blue); border-color:var(--duo-blue); color:#fff; }

    .lp-filter-selects { display:flex; gap:8px; flex-shrink:0; }
    .lp-select { background:var(--bg2); border:1.5px solid var(--border2); border-radius:var(--r); color:var(--text2); font-family:var(--font); font-size:12px; font-weight:600; padding:7px 10px; cursor:pointer; outline:none; transition:border-color 0.15s; }
    .lp-select:focus { border-color:var(--duo-blue); color:#fff; }

    /* Счётчик */
    .lp-results-bar { padding:8px 28px 0; display:flex; align-items:center; gap:8px; }
    .lp-results-count { font-family:var(--mono); font-size:12px; color:var(--duo-green); font-weight:700; }
    .lp-results-query { font-family:var(--mono); font-size:12px; color:var(--text3); }

    /* ── Карточки ── */
    .lp-catalog-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; padding:20px 28px 28px; width:100%; box-sizing:border-box; }
    .lp-lecture-card { background:var(--bg2); border:2px solid var(--border2); border-bottom:5px solid var(--border2); border-radius:var(--r2); padding:18px; cursor:pointer; display:flex; flex-direction:column; gap:12px; opacity:0; transform:translateY(12px); transition:transform 0.15s,border-color 0.2s,opacity 0.3s,box-shadow 0.15s; }
    .lp-lecture-card.lp-card-visible { opacity:1; transform:none; }
    .lp-lecture-card:hover { transform:translateY(-4px); border-color:var(--duo-green); box-shadow:0 8px 24px rgba(88,204,2,.12); }
    .lp-card-top { display:flex; justify-content:space-between; align-items:center; }
    .lp-card-subject { font-family:var(--mono); font-size:10px; color:var(--duo-blue); text-transform:uppercase; letter-spacing:.06em; font-weight:700; }
    .lp-card-level { font-size:11px; font-weight:800; }
    .lp-card-body { display:flex; gap:12px; align-items:flex-start; }
    .lp-card-emoji { font-size:28px; background:var(--bg3); width:48px; height:48px; border-radius:var(--r); display:flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid var(--border); }
    .lp-card-text { flex:1; min-width:0; }
    .lp-card-title { font-size:14px; font-weight:800; color:#fff; line-height:1.3; margin:0 0 4px; }
    .lp-card-desc { font-size:12px; color:var(--text3); line-height:1.4; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .lp-card-tags { display:flex; gap:6px; flex-wrap:wrap; }
    .lp-tag { font-family:var(--mono); font-size:10px; color:var(--duo-blue); background:rgba(28,176,246,.1); border:1px solid rgba(28,176,246,.2); border-radius:10px; padding:2px 8px; font-weight:600; }
    .lp-card-stats { display:flex; gap:10px; flex-wrap:wrap; border-top:1px solid var(--border); padding-top:10px; }
    .lp-stat { display:flex; align-items:center; gap:4px; font-family:var(--mono); font-size:11px; color:var(--text3); }
    .lp-stat svg { width:12px; height:12px; }
    .lp-stat-rating { color:var(--duo-orange); }
    .lp-card-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:auto; }
    .lp-interact-badge { display:flex; align-items:center; gap:5px; font-family:var(--mono); font-size:11px; color:var(--duo-purple,#a560e8); font-weight:700; }
    .lp-interact-badge svg { width:12px; height:12px; fill:var(--duo-orange); stroke:none; }
    .lp-start-btn { 
      display:flex; align-items:center; gap:7px; 
      background:var(--duo-green); color:#000; 
      border:none; border-radius:9999px; padding:10px 20px; 
      font-weight:800; font-size:13px; cursor:pointer; 
      transition:all 0.2s;
    }
    .lp-start-btn:hover { background:#7cf96d; transform:scale(1.05); }

    /* ── Плеер ── */
    .lp-player-wrapper { height:100%; display:flex; flex-direction:column; background:var(--bg); font-family:var(--font); }
    .lp-player-topbar { 
      padding:16px 24px; background:var(--bg2); border-bottom:1px solid var(--border); 
      display:flex; align-items:center; gap:16px; flex-wrap:wrap;
    }
    .lp-back-btn { 
      background:var(--bg3); border:1px solid var(--border2); color:var(--text2);
      padding:8px 16px; border-radius:9999px; font-weight:600; display:flex; align-items:center; gap:6px; cursor:pointer;
    }
    .lp-player-title { font-size:18px; font-weight:800; flex:1; min-width:200px; }
    .lp-player-emoji { margin-right:8px; }

    .lp-player-body { display:flex; flex:1; min-height:0; overflow:hidden; }
    .lp-left-col { flex:1; display:flex; flex-direction:column; min-width:0; }
    .lp-right-col { width:380px; border-left:1px solid var(--border); background:var(--bg2); display:flex; flex-direction:column; }

    /* Медиа панель */
    .lp-media-panel { flex:1; display:flex; flex-direction:column; padding:16px; gap:12px; }
    .lp-media-tabs { display:flex; background:var(--bg3); border-radius:12px; padding:4px; width:fit-content; }
    .lp-media-tab { 
      padding:8px 20px; border-radius:10px; font-weight:700; font-size:13px; 
      display:flex; align-items:center; gap:6px; cursor:pointer;
    }
    .lp-media-tab.active { background:var(--bg); box-shadow:0 2px 8px rgba(0,0,0,0.2); }

    .lp-video-container, .lp-slides-container { flex:1; background:#000; border-radius:16px; overflow:hidden; position:relative; }
    iframe, video { width:100%; height:100%; border:none; }

    .lp-pause-overlay {
      position:absolute; inset:0; background:rgba(0,0,0,0.85);
      display:none; align-items:center; justify-content:center; flex-direction:column;
      color:#fff; z-index:10; gap:12px;
    }
    .lp-pause-icon { font-size:48px; }

    /* Слайды */
    .lp-slide-view { height:420px; background:var(--bg3); border-radius:12px; display:flex; align-items:center; justify-content:center; text-align:center; padding:20px; }
    .lp-slide-title-big { font-size:22px; font-weight:800; }

    .lp-slides-strip { display:flex; gap:8px; overflow-x:auto; padding:12px 0; }
    .lp-slide-thumb { 
      min-width:180px; background:var(--bg3); border-radius:10px; padding:8px; 
      cursor:pointer; transition:all 0.2s;
    }
    .lp-slide-thumb.active { border:2px solid var(--duo-green); }

    /* Таймлайн */
    .lp-timeline-strip { padding:12px 0; }
    .lp-timeline-track { 
      height:6px; background:var(--bg3); border-radius:9999px; position:relative;
    }
    .lp-timeline-cursor { 
      position:absolute; top:-4px; width:12px; height:12px; background:var(--duo-green);
      border-radius:50%; box-shadow:0 0 0 4px rgba(88,204,2,0.3); transition:left 0.1s linear;
    }
    .lp-tl-marker { 
      position:absolute; top:50%; transform:translate(-50%, -50%);
      width:10px; height:10px; border-radius:50%; z-index:2;
    }

    /* Конспект */
    .lp-notes-panel { flex:1; display:flex; flex-direction:column; }
    .lp-notes-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .lp-notes-stream { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:20px; }
    .lp-note-block { background:var(--bg3); border-radius:16px; padding:16px; animation:notePop 0.4s ease; }
    .lp-note-block h3, .lp-block-title { font-weight:800; margin:0 0 8px 0; }

    @keyframes notePop { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }

    .lp-quiz-options { display:grid; gap:8px; margin:12px 0; }
    .lp-quiz-opt { 
      padding:12px 16px; border:2px solid var(--border); border-radius:12px; 
      text-align:left; background:var(--bg); cursor:pointer; transition:all 0.2s;
    }
    .lp-quiz-opt:hover { border-color:var(--duo-blue); }
    .lp-opt-correct { border-color:#58cc02 !important; background:rgba(88,204,2,0.1); }
    .lp-opt-wrong { border-color:#ff4b4b !important; background:rgba(255,75,75,0.1); }

    .lp-task-input-wrap { display:flex; gap:8px; margin:12px 0; }
    .lp-task-input { flex:1; padding:12px; border-radius:12px; border:2px solid var(--border); background:var(--bg); color:#fff; }
    .lp-input-shake { animation:shake 0.4s; }

    @keyframes shake {
      0%,100% { transform:translateX(0); }
      25% { transform:translateX(-6px); }
      75% { transform:translateX(6px); }
    }

    /* Модальное окно */
    .lp-modal-overlay { 
      position:fixed; inset:0; background:rgba(0,0,0,0.8); 
      display:none; align-items:center; justify-content:center; z-index:1000;
    }
    .lp-modal-overlay.active { display:flex; }
    .lp-modal-box { 
      background:var(--bg2); width:90%; max-width:680px; border-radius:20px; 
      max-height:92vh; overflow:hidden; display:flex; flex-direction:column;
    }
    .lp-modal-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .lp-gen-textarea { width:100%; background:var(--bg3); border:1px solid var(--border); border-radius:12px; color:#fff; font-family:var(--mono); }
  `;
  document.head.appendChild(s);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector(CONTAINER_SELECTOR);
  if (!container) return;
  injectPlayerStyles();
  renderCatalog(container);
});