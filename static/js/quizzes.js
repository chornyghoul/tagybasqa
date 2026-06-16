// ═══════════════════════════════════════════════════════════════════
// quizzes.js — Тапсырмалар модулі · Tagybasqa Platform
// Board Games · AI Quiz Generator · Session Manager · Analytics
// ═══════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, getDocs,
  serverTimestamp, increment, arrayUnion, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ─── Firebase init ────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAywbSZkiReHjTq4oc46Kbw9iZ0iDHVTpY",
  authDomain:        "pystart-dd2db.firebaseapp.com",
  projectId:         "pystart-dd2db",
  storageBucket:     "pystart-dd2db.firebasestorage.app",
  messagingSenderId: "9188811255",
  appId:             "1:9188811255:web:6f7280f1f7f67b80d90ef2"
};
const app  = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── Gemini config (ключ проксируется через переменную окружения) ──
// В продакшене замените на fetch('/api/ai', {...}) с серверной функцией
const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${window.__GEMINI_KEY__ || 'AIzaSyC8cQujMxuqebmvvaArU23N3xdbzfGYZfU'}`;

// ─── State ────────────────────────────────────────────────────────
const STATE = {
  user:          null,
  myQuizzes:     [],
  filterTag:     'all',
  search:        '',
  sortBy:        'date',
  selectedModel: 'gemini-2.5-flash',
  currentAIQuiz: null,
  boardGameSession: null,
  activeTab:     'qp-board-games',
  sessionsUnsub: null,     // Firestore realtime listener
  myCourses:     [],
};

// ─── Entry point ──────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  STATE.user = user || null;
  if (user) {
    initQuizzesModule();
  } else {
    // Показываем заглушку "войдите в аккаунт" вместо данных
    renderAuthRequired();
  }
});

function initQuizzesModule() {
  injectStyles();
  setupTabSwitching();
  setupFilterTags();
  setupSearch();
  setupSortSelect();
  loadBoardGamesTab();
  loadMyCourses();
  loadMyQuizzes();
  loadLaunchTab();
  loadAnalytics();
  setupAIModal();
}

// ═══════════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════════

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function timeAgo(ts) {
  if (!ts) return '';
  const secs = (Date.now() - (ts.seconds || ts / 1000) * 1000) / 1000;
  if (secs < 60)    return 'дәл қазір';
  if (secs < 3600)  return `${Math.floor(secs / 60)} мин. бұрын`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} сағ. бұрын`;
  const d = new Date((ts.seconds || ts / 1000) * 1000);
  return d.toLocaleDateString('kk', { day: 'numeric', month: 'short' });
}
function el(id) { return document.getElementById(id); }
function setText(id, val) { const e = el(id); if (e) e.textContent = val; }
function showToast(msg, isErr = false) {
  let t = el('tbq-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tbq-toast';
    t.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'background:var(--duo-green,#57cc02)', 'color:#000',
      'font-weight:900', 'font-family:var(--mono,monospace)', 'font-size:13px',
      'padding:10px 24px', 'border-radius:99px', 'z-index:9999',
      'opacity:0', 'transition:all .3s', 'pointer-events:none', 'white-space:nowrap'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = isErr ? '#ff4b4b' : 'var(--duo-green,#57cc02)';
  t.style.color = isErr ? '#fff' : '#000';
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3200);
}
window.showToast = window.showToast || showToast;

function getQuizGradient(title) {
  const ramps = [
    ['#1a2634','#2563eb'],['#4c1d95','#7c3aed'],['#7c1d44','#ec4899'],
    ['#064e3b','#059669'],['#78350f','#d97706'],['#1e3a5f','#0891b2'],
  ];
  return `linear-gradient(135deg,${ramps[(title || '').charCodeAt(0) % ramps.length].join(',')})`;
}
function getQuizCover(quiz) {
  if (quiz.cover?.startsWith('http'))
    return `<img src="${quiz.cover}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`;
  const letter = (quiz.title || 'К').charAt(0).toUpperCase();
  return `<div style="width:100%;height:100%;background:${getQuizGradient(quiz.title)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:900">${letter}</div>`;
}

function renderAuthRequired() {
  const panels = document.querySelectorAll('.quiz-panel');
  panels.forEach(p => { p.innerHTML = `<div class="qz-auth-wall"><div class="qz-auth-icon">🔐</div><div class="qz-auth-title">Кіруді қажет</div><div class="qz-auth-sub">Тапсырмаларды қолдану үшін аккаунтқа кіріңіз</div><a href="./auth.html" class="qz-auth-btn">Кіру →</a></div>`; });
}

// ═══════════════════════════════════════════════════════════════════
// ТАБ НАВИГАЦИЯ
// ═══════════════════════════════════════════════════════════════════

function setupTabSwitching() {
  document.querySelectorAll('.quiz-action-tab[data-quiz-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.quizPanel;
      document.querySelectorAll('.quiz-action-tab[data-quiz-panel]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.quiz-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      el(panelId)?.classList.add('active');
      STATE.activeTab = panelId;
      if (panelId === 'qp-analytics')    loadAnalytics();
      if (panelId === 'qp-launch')        loadLaunchTab();
      if (panelId === 'qp-board-games')   loadBoardGamesTab();
  loadMyCourses();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// ██  BOARD GAMES SYSTEM  ██
// Ойындар тізімі — тақтада және телефонсыз
// ═══════════════════════════════════════════════════════════════════

const BOARD_GAMES = [
  {
    id: 'bg-tictactoe',
    name: 'Ақылды Крестик-Нөлік',
    emoji: '❌',
    category: '🎲 Тақтадағы ойындар',
    players: '2 команда',
    duration: '15–25 мин',
    color: ['#1e3a5f', '#3b82f6'],
    desc: 'Тақтаға 3×3 (немесе 4×4 үлкен сыныптар үшін) тор сызыңыз. Сыныпты «Крестиктер» және «Нөлдіктер» командаларына бөліңіз. Клетқа белгі қою үшін сұраққа дұрыс жауап беру керек. Ең алдымен бір сызықты жинаған жеңеді.',
    rules: [
      'Тақтаға 3×3 тор сызыңыз (4×4 үлкен сынып үшін)',
      'Сыныпты 2 командаға бөліңіз: Крестиктер vs Нөлдіктер',
      'Команда кезегімен клетка таңдайды',
      'Сұраққа дұрыс жауап берген команда белгісін қояды',
      'Қате жауап кезінде клетка бос қалады, кезек ауысады',
      'Бір сызықты (тік, көлденең, диагональ) бірінші жинаған жеңеді',
    ],
    tips: 'Бастауыш сыныпқа 3×3, жоғары сыныпқа 4×4 тор қолданыңыз. Сұрақтарды алдын ала карточкаларға дайындаңыз.',
  },
  {
    id: 'bg-four-corners',
    name: 'Төрт Бұрыш (Рас/Жалған)',
    emoji: '🏃',
    category: '🎲 Тақтадағы ойындар',
    players: 'Бүкіл сынып',
    duration: '10–20 мин',
    color: ['#064e3b', '#10b981'],
    desc: 'Тамаша қозғалыс тәсілі! Мұғалім бір тұжырым оқиды. Оқушылар «Рас» деп санаса — сол бұрышқа, «Жалған» деп санаса — оң бұрышқа жүреді. Қате жауап берген оқушылар раундтан шығады.',
    rules: [
      'Сынып мұғалімнің алдында тұрады',
      'Мұғалім тұжырым оқиды',
      'Рас → Сол бұрышқа жүру',
      'Жалған → Оң бұрышқа жүру',
      '(Нұсқа: Рас → тұру, Жалған → отыру)',
      'Қате жауап → раундтан шығу, орынға отыру',
      'Ең соңында қалған оқушы жеңеді',
    ],
    tips: 'Болмаса «тұру/отыру» нұсқасын қолданыңыз — жылдамырақ. Жауап бергенде бір-бірін көргізбеу үшін көздерін жұмдырыңыз.',
  },
  {
    id: 'bg-hot-potato',
    name: 'Ыстық Картоп (Сұрақ Добы)',
    emoji: '🏐',
    category: '🎲 Тақтадағы ойындар',
    players: 'Бүкіл сынып',
    duration: '10–15 мин',
    color: ['#78350f', '#d97706'],
    desc: 'Жұмсақ доп немесе кез-келген қауіпсіз зат алыңыз. Кездейсоқ оқушыға допты лақтырыңыз және жылдам сұрақ қойыңыз. Жауап беруге 3–5 секунд. Дұрыс жауап — допты келесіге лақтырып, өз сұрағын қояды.',
    rules: [
      'Жұмсақ доп немесе кез-келген қауіпсіз зат дайындаңыз',
      'Мұғалім допты кездейсоқ оқушыға лақтырады',
      'Сұрақ қояды — жауап беруге 3–5 секунд',
      'Дұрыс жауап → доп келесіге лақтырылады (оқушы сұрақ қояды немесе мұғалімге қайтарады)',
      'Дұрыс жауап бермесе → «жанып кетті» (орынға отырады немесе шартты айыппұл алады)',
      'Ойынды тездету үшін таймер қолданыңыз',
    ],
    tips: 'Нашар доп орнына мягкий плюшевый зат қолданыңыз. Сұрақтарды тақырыптың түйінді сөздеріне негіздеңіз.',
  },
  {
    id: 'bg-alias',
    name: 'Алиас (Сөзді Түсіндір)',
    emoji: '🗣️',
    category: '🧩 Үстел ойындары адаптациясы',
    players: '2+ топ',
    duration: '20–35 мин',
    color: ['#4c1d95', '#7c3aed'],
    desc: 'Карточкаларға тақырып бойынша негізгі терминдерді, формулаларды немесе есімдерді жазыңыз. Оқушы тақтаға шығады, карточка алады және 1 минут ішінде бір тамырлас сөзді қолданбай сыныпқа түсіндіруі керек.',
    rules: [
      'Карточкаларға өтілген тақырыпты терминдер/есімдер/ұғымдарды жазыңыз',
      'Оқушы тақтаға шығып, карточка тартады',
      '1 минут ішінде сөзді түсіндіруі керек',
      'Тақырыптың бір тамырлас сөзін айтуға тыйым',
      'Сынып дұрыс тапса — команда ұпай алады',
      'Командалар кезектесіп ойнайды',
    ],
    tips: 'Қиын терминдерге «мысал» арқылы түсіндіруге рұқсат беріңіз. Бастауыш сынып үшін суретпен де болады.',
  },
  {
    id: 'bg-bingo',
    name: 'Терминологиялық Бинго',
    emoji: '🎯',
    category: '🧩 Үстел ойындары адаптациясы',
    players: 'Бүкіл сынып',
    duration: '15–25 мин',
    color: ['#7c1d44', '#ec4899'],
    desc: 'Оқушылар дәптерге 3×3 квадрат сызады және тақтадан 9 терминді кездейсоқ ретпен жазады. Мұғалім анықтамаларды оқиды (сөздің өзін айтпай). Оқушылар дұрыс жауаптарды өшіреді. Бір сызықты бірінші өшірген «Бинго!» деп айқайлайды.',
    rules: [
      'Оқушылар дәптерге 3×3 квадрат сызады',
      'Мұғалім тақтаға 12–15 терминді жазады',
      'Оқушылар кез-келген 9-ын ӨЗДЕРІ таңдап, кестеге жазады',
      'Мұғалім анықтамаларды оқиды (сөзді айтпай)',
      'Оқушы термині сәйкес келсе — шаршыны белгілейді',
      '3 шаршы бір сызықта → «БИНГО!»',
      'Жеңімпазды сынып бірге тексереді',
    ],
    tips: 'Ойын алдында барлық терминдер тақтада тұруы керек. Оқушылар кестені ӨЗДЕРІ толтырады — бұл да оқу!',
  },
  {
    id: 'bg-associations',
    name: 'Ассоциациялар (4 Сурет, 1 Ұғым)',
    emoji: '🖼️',
    category: '🧩 Үстел ойындары адаптациясы',
    players: 'Бүкіл сынып / командалар',
    duration: '15–30 мин',
    color: ['#1e3a5f', '#0891b2'],
    desc: 'Экранда немесе тақтада 3–4 суретті (немесе қарапайым символдарды) көрсетіңіз, олар бір жасырын ұғыммен логикалық байланысты. Оқушылар не біріктіретінін табуы керек.',
    rules: [
      'Мұғалім тақтаға 3–4 сурет/символ сызады немесе экранда көрсетеді',
      'Барлық суреттер бір ұғыммен байланысты',
      'Оқушылар жазбаша немесе ауызша жауап береді',
      'Командалар нұсқасы: бірінші дұрыс жауап берген команда ұпай алады',
      'Жауапты тақтаға ашыңыз және байланысты түсіндіріңіз',
      'Оқушылар өздері де карточка дайындай алады!',
    ],
    tips: 'Суреттер орнына қарапайым сөздер немесе белгілер де жарайды. Оқушылар өздері ассоциация жасаса — тереңірек түсінеді.',
  },
];

// ── Загрузка вкладки настольных игр ───────────────────────────────
function loadBoardGamesTab() {
  renderBoardGameStats();
  renderBoardGameCards();
}

function renderBoardGameStats() {
  const boardGames = BOARD_GAMES.filter(g => g.category.includes('Тақтадағы'));
  const tableGames = BOARD_GAMES.filter(g => g.category.includes('Үстел'));
  setText('bgs-board-count',  boardGames.length);
  setText('bgs-table-count',  tableGames.length);
  setText('bgs-total-count',  BOARD_GAMES.length);
}

function renderBoardGameCards() {
  const container = el('boardGamesContainer');
  if (!container) return;

  // Group by category
  const categories = [...new Set(BOARD_GAMES.map(g => g.category))];
  container.innerHTML = categories.map(cat => {
    const games = BOARD_GAMES.filter(g => g.category === cat);
    return `
      <div class="bg-category-section">
        <div class="bg-category-header">${cat}</div>
        <div class="bg-cards-grid">
          ${games.map(game => `
            <div class="bg-card" role="article">
              <div class="bg-card-header" style="background:linear-gradient(135deg,${game.color[0]},${game.color[1]})">
                <span class="bg-emoji">${game.emoji}</span>
                <div class="bg-badges">
                  <span class="bg-badge">👥 ${esc(game.players)}</span>
                  <span class="bg-badge">⏱ ${esc(game.duration)}</span>
                </div>
              </div>
              <div class="bg-card-body">
                <div class="bg-card-title">${esc(game.name)}</div>
                <div class="bg-card-desc">${esc(game.desc)}</div>
              </div>
              <div class="bg-card-footer">
                <button class="bg-btn-rules" onclick="openBoardGameModal('${game.id}')">📋 Ережелер мен нұсқаулар</button>
                <button class="bg-btn-generate" onclick="openBoardGameGenModal('${game.id}')">✨ ЖИ сұрақтар жасау</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── Модал: Ережелер ────────────────────────────────────────────────
window.openBoardGameModal = function(gameId) {
  const game = BOARD_GAMES.find(g => g.id === gameId);
  if (!game) return;

  el('bg-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bg-modal-overlay';
  overlay.className = 'bg-modal-overlay';
  overlay.innerHTML = `
    <div class="bg-modal" role="dialog" aria-modal="true">
      <div class="bg-modal-header" style="background:linear-gradient(135deg,${game.color[0]},${game.color[1]})">
        <div style="display:flex;align-items:center;gap:14px">
          <span style="font-size:36px">${game.emoji}</span>
          <div>
            <div class="bg-modal-title">${esc(game.name)}</div>
            <div class="bg-modal-sub">${esc(game.category)} · ${esc(game.players)} · ${esc(game.duration)}</div>
          </div>
        </div>
        <button class="bg-modal-close" onclick="closeBoardGameModal()" aria-label="Жабу">✕</button>
      </div>
      <div class="bg-modal-body">
        <div class="bg-modal-section">
          <div class="bg-section-title">📖 Ойын сипаттамасы</div>
          <p class="bg-section-text">${esc(game.desc)}</p>
        </div>
        <div class="bg-modal-section">
          <div class="bg-section-title">📋 Ережелер</div>
          <ol class="bg-rules-list">
            ${game.rules.map(r => `<li>${esc(r)}</li>`).join('')}
          </ol>
        </div>
        <div class="bg-modal-section bg-tips-box">
          <div class="bg-section-title">💡 Мұғалімге кеңес</div>
          <p class="bg-section-text">${esc(game.tips)}</p>
        </div>
        <div class="bg-modal-actions">
          <button class="bg-action-btn bg-action-primary" onclick="closeBoardGameModal();openBoardGameGenModal('${game.id}')">
            ✨ Осы ойынға ЖИ сұрақтар жасау
          </button>
          <button class="bg-action-btn bg-action-secondary" onclick="closeBoardGameModal()">
            Жабу
          </button>
        </div>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeBoardGameModal(); });
  document.body.appendChild(overlay);
};

window.closeBoardGameModal = function() {
  el('bg-modal-overlay')?.remove();
};

// ── Модал: ЖИ сұрақ генераторы үшін ойын ──────────────────────────
window.openBoardGameGenModal = function(gameId) {
  const game = BOARD_GAMES.find(g => g.id === gameId);
  if (!game) return;
  closeBoardGameModal();

  el('bg-gen-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bg-gen-modal-overlay';
  overlay.className = 'bg-modal-overlay';
  overlay.innerHTML = `
    <div class="bg-modal" role="dialog" aria-modal="true">
      <div class="bg-modal-header" style="background:linear-gradient(135deg,${game.color[0]},${game.color[1]})">
        <div style="display:flex;align-items:center;gap:14px">
          <span style="font-size:36px">${game.emoji}</span>
          <div>
            <div class="bg-modal-title">✨ ${esc(game.name)} үшін сұрақтар</div>
            <div class="bg-modal-sub">ЖИ арқылы ойынға лайықталған сұрақтар жасаңыз</div>
          </div>
        </div>
        <button class="bg-modal-close" onclick="closeBoardGameGenModal()" aria-label="Жабу">✕</button>
      </div>
      <div class="bg-modal-body">
        <div id="bg-gen-form">
          <div class="bg-form-group">
            <label class="bg-form-label">📚 Тақырып</label>
            <input id="bg-gen-topic" class="bg-form-input" type="text"
              placeholder="Мысалы: Фотосинтез, Пифагор теоремасы, Сөз таптары..." />
          </div>
          <div class="bg-form-row">
            <div class="bg-form-group" style="flex:1">
              <label class="bg-form-label">📊 Деңгей</label>
              <select id="bg-gen-difficulty" class="bg-form-input">
                <option value="beginner">🟢 Бастауыш</option>
                <option value="intermediate" selected>🟡 Орташа</option>
                <option value="advanced">🔴 Жоғары</option>
              </select>
            </div>
            <div class="bg-form-group" style="flex:1">
              <label class="bg-form-label">🔢 Сұрақ саны</label>
              <select id="bg-gen-count" class="bg-form-input">
                <option value="6">6 сұрақ</option>
                <option value="10" selected>10 сұрақ</option>
                <option value="15">15 сұрақ</option>
                <option value="20">20 сұрақ</option>
              </select>
            </div>
          </div>
          <div class="bg-modal-actions">
            <button class="bg-action-btn bg-action-primary" onclick="generateBoardGameQuestions('${game.id}')">
              🚀 Сұрақтар жасау
            </button>
            <button class="bg-action-btn bg-action-secondary" onclick="closeBoardGameGenModal()">Болдырмау</button>
          </div>
        </div>
        <div id="bg-gen-loading" style="display:none;text-align:center;padding:40px 20px">
          <div class="bg-spinner"></div>
          <div style="margin-top:16px;font-family:var(--mono);font-size:13px;color:var(--text3)">ЖИ сұрақтар жасауда...</div>
        </div>
        <div id="bg-gen-result" style="display:none"></div>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeBoardGameGenModal(); });
  document.body.appendChild(overlay);
  el('bg-gen-topic')?.focus();
};

window.closeBoardGameGenModal = function() {
  el('bg-gen-modal-overlay')?.remove();
  STATE.boardGameSession = null;
};

// ── ЖИ сұрақ генерациясы ──────────────────────────────────────────
window.generateBoardGameQuestions = async function(gameId) {
  const game  = BOARD_GAMES.find(g => g.id === gameId);
  const topic = el('bg-gen-topic')?.value.trim();
  if (!topic) { showToast('Тақырыпты енгізіңіз!', true); return; }

  const diff  = el('bg-gen-difficulty')?.value || 'intermediate';
  const count = el('bg-gen-count')?.value || '10';
  const diffLabel = { beginner: 'бастауыш', intermediate: 'орташа', advanced: 'жоғары' }[diff];

  el('bg-gen-form').style.display    = 'none';
  el('bg-gen-loading').style.display = 'block';
  el('bg-gen-result').style.display  = 'none';

  // Тип сұрақтар: ойынға байланысты
  const questionType = (game.id === 'bg-four-corners')
    ? 'Рас/Жалған тұжырымдар (true/false statements)'
    : (game.id === 'bg-bingo')
      ? 'Анықтамалар (оқушы термин тауып, кестесін белгілейді)'
      : 'Ашық немесе тест сұрақтар';

  const prompt = `«${topic}» тақырыбы бойынша "${game.name}" ойынына арналған сұрақтар жаса.
Деңгей: ${diffLabel}. Сұрақ саны: ${count}. Тіл: қазақша.
Сұрақ типі: ${questionType}.

ТЕК JSON қайтар (markdown жоқ):
{"topic":"${topic}","gameName":"${game.name}","questions":[{"question":"...","answer":"...","hint":"..."}]}

Маңызды: 
- «question» — сұрақ немесе тұжырым мәтіні
- «answer» — дұрыс жауап (Рас/Жалған немесе нақты жауап)
- «hint» — 1 сөйлем кеңес (мұғалімге)`;

  try {
    const resp = await fetch(GEMINI_ENDPOINT(STATE.selectedModel), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.7 },
      }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error?.message || 'Gemini error');
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    if (!jsonText) throw new Error('Бос жауап');

    const result = JSON.parse(jsonText);
    STATE.boardGameSession = { game, result };
    showBoardGameQuestions(game, result);

  } catch (e) {
    console.error('Board game gen error:', e);
    el('bg-gen-loading').style.display = 'none';
    el('bg-gen-form').style.display    = 'block';
    showToast('❌ Генерация қатесі. Қайталап көр.', true);
  }
};

function showBoardGameQuestions(game, data) {
  el('bg-gen-loading').style.display = 'none';
  const resultEl = el('bg-gen-result');
  resultEl.style.display = 'block';

  const isTrueFalse = game.id === 'bg-four-corners';
  const isBingo     = game.id === 'bg-bingo';

  resultEl.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:15px;font-weight:800">${esc(data.topic)} — ${esc(data.gameName)}</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text3)">${(data.questions||[]).length} сұрақ дайын</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="bg-action-btn bg-action-secondary" onclick="printBoardGameQuestions()" style="padding:8px 16px;font-size:12px">🖨️ Басып шығару</button>
        <button class="bg-action-btn bg-action-primary" style="padding:8px 16px;font-size:12px" onclick="saveBoardGameAsQuiz()">💾 Квиз ретінде сақтау</button>
      </div>
    </div>

    ${isBingo ? `
    <div class="bg-tips-box" style="margin-bottom:14px">
      <strong>📋 Бинго үшін:</strong> Осы терминдерді тақтаға жазыңыз. Оқушылар кез-келген 9-ын кестеге өздері жазсын. Содан кейін анықтамаларды (жауаптарды) оқыңыз!
    </div>` : ''}

    <div style="display:flex;flex-direction:column;gap:8px;max-height:420px;overflow-y:auto;padding-right:4px">
      ${(data.questions || []).map((q, i) => `
        <div class="bg-question-card">
          <div class="bg-q-num">${i + 1}</div>
          <div style="flex:1">
            <div class="bg-q-text">${esc(q.question)}</div>
            <div class="bg-q-answer">
              ${isTrueFalse
                ? `<span class="bg-answer-badge ${q.answer.toLowerCase().includes('рас') || q.answer.toLowerCase().includes('true') ? 'bg-ans-true' : 'bg-ans-false'}">
                    ${q.answer.toLowerCase().includes('рас') || q.answer.toLowerCase().includes('true') ? '✅ РАС' : '❌ ЖАЛҒАН'}
                   </span>`
                : `<span class="bg-answer-label">Жауап:</span> ${esc(q.answer)}`}
            </div>
            ${q.hint ? `<div class="bg-q-hint">💡 ${esc(q.hint)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`;
}

window.printBoardGameQuestions = function() {
  if (!STATE.boardGameSession) return;
  const { game, result } = STATE.boardGameSession;
  const isTrueFalse = game.id === 'bg-four-corners';

  const rows = (result.questions || []).map((q, i) =>
    `<tr><td style="padding:10px;border:1px solid #ddd;font-size:14px;vertical-align:top">${i+1}. ${q.question}</td>
     <td style="padding:10px;border:1px solid #ddd;font-size:14px;color:#1a6a2a;font-weight:bold;vertical-align:top;white-space:nowrap">${q.answer}</td>
     <td style="padding:10px;border:1px solid #ddd;font-size:12px;color:#666;vertical-align:top">${q.hint||''}</td></tr>`
  ).join('');

  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>${result.topic} — ${result.gameName}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:900px;margin:0 auto}
    h2{color:#1a1a1a}table{width:100%;border-collapse:collapse}th{background:#f0f0f0;padding:10px;border:1px solid #ddd;text-align:left}
    @media print{button{display:none}}</style></head><body>
    <h2>${esc(result.gameName)}: ${esc(result.topic)}</h2>
    <p style="color:#666">Деңгей · ${(result.questions||[]).length} сұрақ</p>
    <button onclick="window.print()" style="margin-bottom:16px;padding:8px 20px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Басып шығару</button>
    <table><thead><tr><th style="width:55%">Сұрақ${isTrueFalse?' / Тұжырым':''}</th><th style="width:20%">Жауап</th><th style="width:25%">Кеңес</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
};

window.saveBoardGameAsQuiz = async function() {
  if (!STATE.boardGameSession || !STATE.user) { showToast('Аккаунтқа кіріңіз', true); return; }
  const { game, result } = STATE.boardGameSession;
  try {
    await addDoc(collection(db, 'quizzes'), {
      uid:       STATE.user.uid,
      title:     `${result.topic} — ${result.gameName}`,
      category:  game.category,
      questions: (result.questions || []).map(q => ({
        type:        'open',
        text:         q.question,
        question:     q.question,
        options:      [],
        correctIndex: -1,
        answer:       q.answer,
        hint:         q.hint || '',
        explanation:  q.hint || '',
        timeLimit:    20,
        points:       100,
      })),
      visibility:    'draft',
      generatedByAI: true,
      boardGameId:   game.id,
      aiModel:       STATE.selectedModel,
      createdAt:     serverTimestamp(),
    });
    showToast(`✅ «${result.topic}» квизі сақталды!`);
    closeBoardGameGenModal();
    await loadMyQuizzes();
  } catch (e) {
    console.error(e);
    showToast('❌ Сақтау қатесі', true);
  }
};

// ── Gemini API (general) ─────────────────────────────────────────
async function callGemini(history, systemPrompt, model = 'gemini-2.5-flash') {
  try {
    const resp = await fetch(GEMINI_ENDPOINT(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: history,
        generationConfig: { temperature: 0.9, maxOutputTokens: 600 },
      }),
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      console.error('Gemini error:', data.error);
      return `❌ API қатесі: ${data.error?.message || 'Белгісіз қате'}`;
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '...';
  } catch (e) {
    console.error('Gemini fetch error:', e);
    return '⚠️ Желі қатесі. Қайталап көр!';
  }
}

window.autoResizeTA = function(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
};

// ═══════════════════════════════════════════════════════════════════
// МОИ КВИЗЫ
// ═══════════════════════════════════════════════════════════════════

async function loadMyQuizzes() {
  if (!STATE.user) return;
  const grid = el('myQuizzesGrid');
  if (grid) grid.innerHTML = `<div class="qz-loading" style="grid-column:1/-1">Квиздер жүктелуде...</div>`;

  try {
    const snap = await getDocs(
      query(collection(db, 'quizzes'), where('uid', '==', STATE.user.uid))
    );
    STATE.myQuizzes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    STATE.myQuizzes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    updateQuizStats();
    renderMyQuizzesGrid();
    renderRecentQuizzes();
    renderLaunchList();
  } catch (e) {
    console.error('loadMyQuizzes error:', e);
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--text3)">Квиздер жүктелмеді. Қайталап көр.</div>`;
  }
}

function updateQuizStats() {
  const total  = STATE.myQuizzes.length;
  const pub    = STATE.myQuizzes.filter(q => q.visibility === 'public').length;
  const draft  = total - pub;
  const ai     = STATE.myQuizzes.filter(q => q.generatedByAI).length;
  const totalQ = STATE.myQuizzes.reduce((s, q) => s + (q.questions?.length || 0), 0);

  ['qs-total','qs-total-my'].forEach(id => setText(id, total));
  ['qs-pub','qs-pub-my'].forEach(id => setText(id, pub));
  setText('qs-draft-my', draft);
  ['qs-ai','qs-ai-my'].forEach(id => setText(id, ai));
  setText('qs-total-q', totalQ);
}

function getFilteredQuizzes() {
  let list = [...STATE.myQuizzes];
  if (STATE.filterTag === 'public') list = list.filter(q => q.visibility === 'public');
  else if (STATE.filterTag === 'draft') list = list.filter(q => q.visibility !== 'public');
  else if (STATE.filterTag === 'ai') list = list.filter(q => q.generatedByAI);

  if (STATE.search) {
    const s = STATE.search.toLowerCase();
    list = list.filter(q => (q.title || '').toLowerCase().includes(s) || (q.category || '').toLowerCase().includes(s));
  }
  if (STATE.sortBy === 'name') list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  else if (STATE.sortBy === 'questions') list.sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
  else list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return list;
}

function renderMyQuizzesGrid() {
  const grid = el('myQuizzesGrid');
  if (!grid) return;
  const list = getFilteredQuizzes();

  if (!list.length) {
    const isEmpty = !STATE.search && STATE.filterTag === 'all';
    grid.innerHTML = `
      <div style="grid-column:1/-1" class="empty-state-rich">
        <div class="empty-icon">${isEmpty ? '🎯' : '🔍'}</div>
        <div class="empty-title">${isEmpty ? 'Квиздер жоқ' : 'Ештеңе табылмады'}</div>
        <div class="empty-sub">${isEmpty ? 'Бірінші квизді жасаңыз' : 'Іздеу параметрлерін өзгертіп көріңіз'}</div>
        ${isEmpty ? `<button class="empty-action-btn" onclick="window.location.href='./create-quiz.html'">Квиз жасау →</button>` : ''}
      </div>`;
    return;
  }

  grid.innerHTML = list.map(quiz => {
    const count = quiz.questions?.length || 0;
    const isPub = quiz.visibility === 'public';
    const isAI  = !!quiz.generatedByAI;
    const ago   = timeAgo(quiz.createdAt);
    return `
      <div class="course-card modern qz-card" data-quiz-id="${quiz.id}">
        <div class="qz-card-top">
          <div class="qz-card-cover" onclick="window.location.href='./create-quiz.html?edit=${quiz.id}'">${getQuizCover(quiz)}</div>
          <div class="qz-card-badges">
            <span class="qz-badge ${isPub ? 'qz-badge-pub' : 'qz-badge-draft'}">${isPub ? '● Жалпыға' : '○ Жоба'}</span>
            ${isAI ? '<span class="qz-ai-badge">✨ ЖИ</span>' : ''}
          </div>
          <button class="qz-delete-btn" onclick="event.stopPropagation();deleteMyQuiz('${quiz.id}')" aria-label="Жою" title="Жою">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="qz-card-body" onclick="window.location.href='./create-quiz.html?edit=${quiz.id}'">
          <div class="qz-card-title">${esc(quiz.title || 'Атаусыз')}</div>
          <div class="qz-card-meta">${count} сұрақ · ${ago}</div>
        </div>
        <div class="qz-card-actions">
          <button class="qz-btn-edit" onclick="event.stopPropagation();window.location.href='./create-quiz.html?edit=${quiz.id}'">✏️ Өңдеу</button>
          <button class="qz-btn-launch" onclick="event.stopPropagation();launchMyQuiz('${quiz.id}','${esc(quiz.title || '')}')">🚀 Іске қос</button>
        </div>
      </div>`;
  }).join('');
}

function renderRecentQuizzes() {
  const container = el('recentQuizzesCreate');
  if (!container) return;
  const recent = STATE.myQuizzes.slice(0, 4);
  if (!recent.length) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">Жаңа квиздер жоқ</div>`;
    return;
  }
  container.innerHTML = recent.map(q => `
    <div class="qz-recent-row">
      <div class="qz-recent-cover">${getQuizCover(q)}</div>
      <div class="qz-recent-info">
        <div class="qz-recent-title">${esc(q.title || 'Атаусыз')}</div>
        <div class="qz-recent-meta">${q.questions?.length || 0} сұрақ · ${timeAgo(q.createdAt)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="qz-btn-sm qz-btn-edit" onclick="window.location.href='./create-quiz.html?edit=${q.id}'">✏️</button>
        <button class="qz-btn-sm qz-btn-launch" onclick="launchMyQuiz('${q.id}','${esc(q.title || '')}')">🚀</button>
      </div>
    </div>`).join('');
}

function renderLaunchList() {
  const container = el('launchMyQuizList');
  if (!container) return;
  const list = STATE.myQuizzes.slice(0, 8);
  if (!list.length) {
    container.innerHTML = `<div class="empty-state-rich" style="margin:0;padding:24px;border:1px dashed rgba(255,255,255,.1);border-radius:12px"><div class="empty-icon" style="font-size:24px">🎮</div><div class="empty-title" style="font-size:14px">Квиздер жоқ</div></div>`;
    return;
  }
  container.innerHTML = list.map(q => `
    <div class="qz-launch-row">
      <div class="qz-recent-cover">${getQuizCover(q)}</div>
      <div class="qz-recent-info">
        <div class="qz-recent-title">${esc(q.title || 'Атаусыз')}</div>
        <div class="qz-recent-meta">${q.questions?.length || 0} сұрақ</div>
      </div>
      <button class="qz-btn-launch" style="flex-shrink:0" onclick="launchMyQuiz('${q.id}','${esc(q.title || '')}')">🚀 Іске қос</button>
    </div>`).join('');
}

// ── Фильтры и поиск ───────────────────────────────────────────────
function setupFilterTags() {
  document.querySelectorAll('.qz-filter-tag[data-qf]').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.qz-filter-tag[data-qf]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      STATE.filterTag = tag.dataset.qf;
      renderMyQuizzesGrid();
    });
  });
}
function setupSearch() {
  const inp = el('myQuizSearch');
  if (!inp) return;
  let timer;
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { STATE.search = inp.value.trim(); renderMyQuizzesGrid(); }, 280);
  });
}
function setupSortSelect() {
  el('myQuizSort')?.addEventListener('change', e => { STATE.sortBy = e.target.value; renderMyQuizzesGrid(); });
}

// ── CRUD ──────────────────────────────────────────────────────────
window.deleteMyQuiz = async function(quizId) {
  if (!confirm('Квизді мәңгілік жою?')) return;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    STATE.myQuizzes = STATE.myQuizzes.filter(q => q.id !== quizId);
    updateQuizStats();
    renderMyQuizzesGrid();
    renderRecentQuizzes();
    renderLaunchList();
    showToast('✅ Квиз жойылды');
  } catch (e) { showToast('❌ Жою қатесі', true); }
};

window.launchMyQuiz = async function(quizId, title) {
  if (!STATE.user) { showToast('Аккаунтқа кіріңіз', true); return; }
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      quizId,
      quizTitle: title || 'Квиз',
      hostId:    STATE.user.uid,
      status:    'waiting',
      currentQuestion: -1,
      players:   {},
      createdAt: serverTimestamp(),
    });
    window.location.href = `./host-game.html?session=${sessionRef.id}`;
  } catch (e) {
    console.error(e);
    showToast('❌ Іске қосу мүмкін болмады', true);
  }
};

// ═══════════════════════════════════════════════════════════════════
// PIN СЕССИЯЛАРЫ — реальный Firestore listener
// ═══════════════════════════════════════════════════════════════════

async function loadLaunchTab() {
  if (!STATE.user) return;
  const container = el('activeSessionsList');
  if (!container) return;

  // Отписываемся от предыдущего слушателя
  if (STATE.sessionsUnsub) { STATE.sessionsUnsub(); STATE.sessionsUnsub = null; }

  container.innerHTML = `<div class="qz-loading">Сессиялар жүктелуде...</div>`;

  try {
    const q = query(
      collection(db, 'sessions'),
      where('hostId', '==', STATE.user.uid),
      orderBy('createdAt', 'desc'),
      limit(8)
    );

    // Реальный realtime listener
    STATE.sessionsUnsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        container.innerHTML = `
          <div class="empty-state-rich" style="margin:0;border:1px dashed rgba(255,255,255,.1);padding:24px;border-radius:12px">
            <div class="empty-icon" style="font-size:24px">📡</div>
            <div class="empty-title" style="font-size:14px">Белсенді сессиялар жоқ</div>
            <div class="empty-sub" style="font-size:12px">Квиз іске қосып, PIN арқылы студенттерді шақырыңыз</div>
          </div>`;
        return;
      }

      container.innerHTML = snap.docs.map(d => {
        const s = d.data();
        const isLive    = s.status === 'waiting' || s.status === 'playing';
        const players   = Object.keys(s.players || {}).length;
        const totalQ    = s.totalQuestions || '?';
        const currentQ  = s.currentQuestion >= 0 ? s.currentQuestion + 1 : 0;
        const pin       = s.pin || d.id.slice(-6).toUpperCase();

        return `
          <div class="qz-session-row ${isLive ? 'qz-session-live' : ''}">
            <div class="qz-session-indicator ${isLive ? 'live' : ''}"></div>
            <div class="qz-session-info">
              <div class="qz-session-title">${esc(s.quizTitle || 'Квиз')}</div>
              <div class="qz-session-meta">
                ${isLive ? `<span class="qz-session-pin">PIN: ${pin}</span> · ` : ''}
                ${players} ойыншы
                ${s.status === 'playing' ? ` · ${currentQ}/${totalQ} сұрақ` : ''}
                · ${timeAgo(s.createdAt)}
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
              <span class="qz-session-status ${isLive ? 'live' : ''}">${isLive ? '● LIVE' : 'Аяқталды'}</span>
              ${isLive ? `<button class="qz-btn-launch" style="padding:7px 14px;font-size:12px" onclick="window.location.href='./host-game.html?session=${d.id}'">Басқару →</button>` : ''}
            </div>
          </div>`;
      }).join('');
    }, (err) => {
      console.error('Sessions listener error:', err);
      container.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">Жүктеу қатесі</div>`;
    });

  } catch (e) { console.error(e); }

  renderLaunchList();
}

// PIN ввод
window.onPinInput = function(val) {
  const clean = val.replace(/\D/g, '').slice(0, 6);
  const inp = el('quizPinInput');
  if (inp) inp.value = clean;
  for (let i = 0; i < 6; i++) {
    const d = el('pd' + i);
    if (d) {
      d.textContent = clean[i] || '_';
      d.classList.toggle('qz-pin-digit-active', i < clean.length);
      d.classList.toggle('qz-pin-digit-filled', !!clean[i]);
    }
  }
  const hint = el('pinHint');
  if (!hint) return;
  const need = 6 - clean.length;
  hint.textContent = need > 0 ? `Тағы ${need} сан` : 'Қосылуда...';
  if (need === 0) setTimeout(joinByPin, 300);
};

window.joinByPin = function() {
  const pin = el('quizPinInput')?.value?.trim();
  if (!pin || pin.length < 4) { showToast('PIN-ді дұрыс енгізіңіз', true); return; }
  window.location.href = `./quiz-play.html?pin=${pin}`;
};

// ═══════════════════════════════════════════════════════════════════
// АНАЛИТИКА
// ═══════════════════════════════════════════════════════════════════

async function loadAnalytics() {
  if (!STATE.user || STATE.activeTab !== 'qp-analytics') return;

  const quizzes = STATE.myQuizzes.length
    ? STATE.myQuizzes
    : await getDocs(query(collection(db, 'quizzes'), where('uid', '==', STATE.user.uid)))
        .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
        .catch(() => []);

  let sessionsCount = 0, totalPlayers = 0;
  try {
    const sessSnap = await getDocs(
      query(collection(db, 'sessions'), where('hostId', '==', STATE.user.uid), limit(100))
    );
    sessionsCount = sessSnap.size;
    sessSnap.forEach(d => { totalPlayers += Object.keys(d.data().players || {}).length; });
  } catch (_) {}

  const totalQ   = quizzes.reduce((s, q) => s + (q.questions?.length || 0), 0);
  const aiCount  = quizzes.filter(q => q.generatedByAI).length;
  const manualCount = quizzes.length - aiCount;

  setText('an-quizzes',  quizzes.length);
  setText('an-questions', totalQ);
  setText('an-sessions', sessionsCount);
  setText('an-players',  totalPlayers);

  // Топ квизов по количеству вопросов
  const topEl = el('analyticsTopQuizzes');
  if (topEl) {
    const sorted = [...quizzes].sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0)).slice(0, 6);
    const maxQ   = Math.max(...sorted.map(q => q.questions?.length || 0), 1);
    const colors = ['#57cc02', '#8b5cf6', '#ffd900', '#ec4899', '#3b82f6', '#10b981'];
    topEl.innerHTML = sorted.length ? sorted.map((q, i) => {
      const pct = Math.round(((q.questions?.length || 0) / maxQ) * 100);
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <span style="font-family:var(--mono);font-size:11px;color:var(--text3);width:22px">${String(i + 1).padStart(2, '0')}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${esc(q.title || 'Атаусыз')}${q.generatedByAI ? '<span class="qz-ai-badge" style="margin-left:6px">ЖИ</span>' : ''}
            </div>
            <div style="height:5px;background:rgba(255,255,255,.07);overflow:hidden;border-radius:2px">
              <div style="height:100%;width:${pct}%;background:${colors[i]};transition:width .6s .${i}s both"></div>
            </div>
          </div>
          <span style="font-family:var(--mono);font-size:11px;font-weight:700;flex-shrink:0">${q.questions?.length || 0}</span>
        </div>`;
    }).join('') : `<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px">Деректер жоқ</div>`;
  }

  // AI vs manual chart
  const aiEl = el('analyticsAIChart');
  if (aiEl) {
    const total = quizzes.length || 1;
    aiEl.innerHTML = [
      { label: 'ЖИ-квиздер',       val: aiCount,     color: 'linear-gradient(90deg,#8b5cf6,#ec4899)', pct: Math.round(aiCount / total * 100) },
      { label: 'Қолмен жасалған',   val: manualCount, color: 'rgba(255,255,255,.6)',                    pct: Math.round(manualCount / total * 100) },
      { label: 'Сессиялар өткізілді', val: sessionsCount, color: '#57cc02',                              pct: Math.min(100, sessionsCount * 10) },
    ].map(item => `
      <div style="flex:1;background:var(--bg2);border:1px solid rgba(255,255,255,.07);padding:16px;text-align:center;border-radius:12px">
        <div style="font-size:28px;font-weight:900;background:${item.color};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${item.val}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:4px">${item.label}</div>
        <div style="margin-top:8px;height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${item.pct}%;background:${item.color};transition:width .6s ease"></div>
        </div>
      </div>`).join('');
  }

  // История сессий
  const histEl = el('analyticsSessionHistory');
  if (histEl && sessionsCount > 0) {
    try {
      const snap = await getDocs(
        query(collection(db, 'sessions'), where('hostId', '==', STATE.user.uid), orderBy('createdAt', 'desc'), limit(10))
      );
      histEl.innerHTML = snap.docs.map(d => {
        const s = d.data();
        const pCount = Object.keys(s.players || {}).length;
        const isLive = s.status === 'waiting' || s.status === 'playing';
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)">
            <div>
              <div style="font-size:13px;font-weight:600">${esc(s.quizTitle || 'Квиз')}</div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${pCount} ойыншы · ${timeAgo(s.createdAt)}</div>
            </div>
            <span style="font-family:var(--mono);font-size:10px;font-weight:700;color:${isLive ? '#57cc02' : 'rgba(255,255,255,.3)'}">
              ${isLive ? '● LIVE' : 'Аяқталды'}
            </span>
          </div>`;
      }).join('');
    } catch (_) {}
  } else if (histEl) {
    histEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px">Сессия тарихы жоқ</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// AI QUIZ GENERATOR
// ═══════════════════════════════════════════════════════════════════

function setupAIModal() {
  document.querySelectorAll('.model-btn[data-model]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-btn[data-model]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.selectedModel = btn.dataset.model;
    });
  });
  el('aiQuizModal')?.addEventListener('click', e => {
    if (e.target === el('aiQuizModal')) closeAIQuizModal();
  });
}

window.openAIQuizModal = async function() {
  const modal = el('aiQuizModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
  el('aiFormStep').style.display    = 'block';
  el('aiPreviewStep').style.display = 'none';
  el('aiTopicInput')?.focus();
  await updateDailyLimit();
};
window.closeAIQuizModal = function() {
  const m = el('aiQuizModal');
  if (m) { m.style.display = 'none'; m.classList.remove('active'); }
};
window.backToAIForm = function() {
  el('aiFormStep').style.display    = 'block';
  el('aiPreviewStep').style.display = 'none';
};

async function updateDailyLimit() {
  const limitEl = el('dailyLimitInfo');
  if (!limitEl || !STATE.user) return;
  try {
    const snap  = await getDoc(doc(db, 'aiDailyLimits', STATE.user.uid));
    const today = new Date().toISOString().split('T')[0];
    const count = (snap.exists() && snap.data().date === today) ? (snap.data().count || 0) : 0;
    const rem   = 10 - count;
    limitEl.innerHTML = rem > 0
      ? `Бүгін <strong>${rem}</strong> / 10 генерация қалды`
      : `<span style="color:var(--duo-red,#ff4b4b)">Күндік лимит таусылды (10/10)</span>`;
  } catch (_) { limitEl.textContent = 'Лимит: күніне 10 генерация'; }
}

window.generateQuizWithAI = async function() {
  const topic = el('aiTopicInput')?.value.trim();
  if (!topic) { showToast('Тақырыпты енгізіңіз!', true); return; }
  if (!STATE.user) { showToast('Аккаунтқа кіріңіз', true); return; }

  // Проверяем лимит
  const limitRef = doc(db, 'aiDailyLimits', STATE.user.uid);
  const snap     = await getDoc(limitRef);
  const today    = new Date().toISOString().split('T')[0];
  const count    = (snap.exists() && snap.data().date === today) ? (snap.data().count || 0) : 0;
  if (count >= 10) { showToast('❌ Күндік лимит таусылды (10/10)', true); return; }

  const countQ    = el('aiQuestionCount')?.value || '8';
  const diff      = el('aiDifficulty')?.value || 'intermediate';
  const diffLabel = { beginner: 'бастауыш', intermediate: 'орташа', advanced: 'жоғары' }[diff];

  closeAIQuizModal();
  showToast('🤖 Квиз генерациялануда...');

  const prompt = `Python платформасы үшін "${topic}" тақырыбы бойынша квиз жаса.
Тіл: қазақша. Сұрақтар саны: ${countQ}. Деңгей: ${diffLabel}.
Әр сұрақта 4 нұсқа, бір дұрыс жауап.
ТЕК JSON қайтар (markdown жоқ, code block жоқ):
{"title":"...","category":"...","questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}`;

  try {
    const resp = await fetch(GEMINI_ENDPOINT(STATE.selectedModel), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.7 },
      }),
    });
    const data     = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error?.message || 'Gemini error');
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    if (!jsonText) throw new Error('Бос жауап');

    STATE.currentAIQuiz = JSON.parse(jsonText);
    showAIPreview(STATE.currentAIQuiz);

    // Обновляем счётчик лимита
    if (!snap.exists() || snap.data().date !== today)
      await setDoc(limitRef, { count: 1, date: today });
    else
      await updateDoc(limitRef, { count: increment(1) });

  } catch (e) {
    console.error('AI quiz gen error:', e);
    showToast('❌ Генерация қатесі. Қайталап көр.', true);
    openAIQuizModal();
  }
};

function showAIPreview(quiz) {
  const content = `
    <div style="margin-bottom:16px">
      <h3 style="margin:0 0 8px;font-size:16px">${esc(quiz.title)}</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span style="background:var(--bg3);color:var(--text3);padding:3px 10px;border-radius:99px;font-family:var(--mono);font-size:11px">${esc(quiz.category || 'ЖИ-квиз')}</span>
        <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">${quiz.questions?.length || 0} сұрақ</span>
      </div>
    </div>
    <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px">
      ${(quiz.questions || []).map((q, i) => `
        <div style="padding:14px;background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:12px">
          <div style="font-weight:700;margin-bottom:10px;font-size:13px;line-height:1.4">${i + 1}. ${esc(q.question)}</div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${(q.options || []).map((opt, idx) => `
              <div style="padding:8px 12px;border:1px solid ${idx === q.correctIndex ? '#57cc02' : 'rgba(255,255,255,.08)'};background:${idx === q.correctIndex ? 'rgba(87,204,2,.07)' : 'transparent'};border-radius:8px;font-size:12px;display:flex;gap:6px">
                <span style="opacity:.5">${String.fromCharCode(65 + idx)}.</span>
                <span>${esc(opt)}</span>
                ${idx === q.correctIndex ? '<span style="color:#57cc02;margin-left:auto">✓</span>' : ''}
              </div>`).join('')}
          </div>
          ${q.explanation ? `<div style="margin-top:8px;font-size:11px;color:var(--text3);padding:8px;background:var(--bg3);border-radius:6px;line-height:1.5">💡 ${esc(q.explanation)}</div>` : ''}
        </div>`).join('')}
    </div>`;

  el('aiPreviewContent').innerHTML = content;
  const modal = el('aiQuizModal');
  modal.style.display = 'flex';
  modal.classList.add('active');
  el('aiFormStep').style.display    = 'none';
  el('aiPreviewStep').style.display = 'block';
}

window.saveGeneratedQuizDirect = async function() {
  if (!STATE.currentAIQuiz || !STATE.user) return;
  try {
    await addDoc(collection(db, 'quizzes'), {
      uid:      STATE.user.uid,
      title:    STATE.currentAIQuiz.title,
      category: STATE.currentAIQuiz.category || 'ЖИ-квиз',
      questions: (STATE.currentAIQuiz.questions || []).map(q => ({
        type:         'multiple',
        text:          q.question,
        question:      q.question,
        options:       (q.options || []).map((o, i) => ({ text: o, correct: i === q.correctIndex })),
        correctIndex:  q.correctIndex,
        explanation:   q.explanation || '',
        timeLimit:     20,
        points:        100,
      })),
      visibility:    'draft',
      generatedByAI: true,
      aiModel:       STATE.selectedModel,
      createdAt:     serverTimestamp(),
    });
    showToast(`✅ «${STATE.currentAIQuiz.title}» сақталды!`);
    closeAIQuizModal();
    STATE.currentAIQuiz = null;
    await loadMyQuizzes();
  } catch (e) {
    console.error(e);
    showToast('❌ Сақтау қатесі', true);
  }
};

window.openInConstructor = function() {
  if (!STATE.currentAIQuiz) return;
  sessionStorage.setItem('aiQuizDraft', JSON.stringify(STATE.currentAIQuiz));
  closeAIQuizModal();
  window.location.href = './create-quiz.html';
};

// ═══════════════════════════════════════════════════════════════════
// СТИЛИ
// ═══════════════════════════════════════════════════════════════════

function injectStyles() {
  if (el('qz-module-styles')) return;
  const s = document.createElement('style');
  s.id = 'qz-module-styles';
  s.textContent = `

/* ── Auth wall ── */
.qz-auth-wall{display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 24px;text-align:center}
.qz-auth-icon{font-size:48px}
.qz-auth-title{font-size:18px;font-weight:900}
.qz-auth-sub{font-size:13px;color:var(--text3)}
.qz-auth-btn{display:inline-block;padding:12px 28px;background:var(--duo-blue,#1cb0f6);color:#fff;border-radius:99px;font-weight:800;font-size:14px;text-decoration:none;margin-top:8px}

/* ── Board game cards ── */
.bg-category-section{margin-bottom:28px}
.bg-category-header{font-family:var(--mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);padding:0 16px 12px}
.bg-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;padding:0 16px}
.bg-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;transition:all .2s;display:flex;flex-direction:column}
.bg-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3);border-color:var(--border2)}
.bg-card-header{padding:18px 18px 14px;display:flex;align-items:flex-start;gap:12px;flex-shrink:0}
.bg-emoji{font-size:32px;line-height:1;flex-shrink:0}
.bg-badges{display:flex;flex-direction:column;gap:5px}
.bg-badge{font-family:var(--mono);font-size:10px;color:rgba(255,255,255,.7);background:rgba(0,0,0,.25);padding:3px 8px;border-radius:6px;display:inline-block;width:fit-content}
.bg-card-body{padding:0 18px 12px;flex:1}
.bg-card-title{font-size:14px;font-weight:800;margin-bottom:6px;line-height:1.3}
.bg-card-desc{font-size:12px;color:var(--text3);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.bg-card-footer{padding:0 14px 14px;display:flex;gap:8px;flex-shrink:0}
.bg-btn-rules{flex:1;padding:9px 8px;font-size:11px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:700;transition:all .15s}
.bg-btn-rules:hover{border-color:var(--border3);color:#fff}
.bg-btn-generate{flex:1;padding:9px 8px;font-size:11px;background:linear-gradient(135deg,#7c3aed,#4c1d95);border:none;color:#fff;border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:800;transition:filter .15s}
.bg-btn-generate:hover{filter:brightness(1.15)}

/* ── Board game stats ── */
.bg-stats-row{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.bg-stat{flex:1;padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,.07)}
.bg-stat:last-child{border-right:none}
.bg-stat-num{font-size:26px;font-weight:900;line-height:1;margin-bottom:3px;color:var(--duo-blue,#1cb0f6);font-family:var(--mono)}
.bg-stat-lbl{font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em}

/* ── Board game modal ── */
.bg-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:4000;display:flex;align-items:center;justify-content:center;padding:16px}
.bg-modal{background:var(--bg1,#131f2e);border:1.5px solid var(--border);border-radius:20px;overflow:hidden;max-width:560px;width:100%;max-height:90vh;display:flex;flex-direction:column;animation:bgModalIn .3s cubic-bezier(.175,.885,.32,1.275)}
@keyframes bgModalIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
.bg-modal-header{padding:22px 22px 18px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0}
.bg-modal-title{font-size:17px;font-weight:900;line-height:1.2;color:#fff}
.bg-modal-sub{font-family:var(--mono);font-size:10px;color:rgba(255,255,255,.6);margin-top:5px}
.bg-modal-close{background:rgba(255,255,255,.1);border:none;color:rgba(255,255,255,.6);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.bg-modal-close:hover{background:rgba(255,75,75,.2);color:#ff4b4b}
.bg-modal-body{padding:0 22px 22px;overflow-y:auto;flex:1}
.bg-modal-body::-webkit-scrollbar{width:3px}
.bg-modal-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px}
.bg-modal-section{margin-bottom:20px}
.bg-section-title{font-family:var(--mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:10px}
.bg-section-text{font-size:13px;color:rgba(255,255,255,.8);line-height:1.65;margin:0}
.bg-rules-list{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:7px}
.bg-rules-list li{font-size:13px;color:rgba(255,255,255,.8);line-height:1.5}
.bg-tips-box{background:rgba(255,217,0,.06);border:1px solid rgba(255,217,0,.2);border-radius:12px;padding:14px 16px}
.bg-tips-box .bg-section-title{color:#ffd900}
.bg-modal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.bg-action-btn{padding:12px 20px;border:none;border-radius:99px;font-family:var(--font);font-size:13px;font-weight:800;cursor:pointer;transition:filter .15s;white-space:nowrap}
.bg-action-primary{background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff}
.bg-action-primary:hover{filter:brightness(1.15)}
.bg-action-secondary{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1)}
.bg-action-secondary:hover{background:rgba(255,255,255,.15);color:#fff}

/* ── Board game question gen form ── */
.bg-form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.bg-form-row{display:flex;gap:12px}
.bg-form-label{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em}
.bg-form-input{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;color:#fff;font-family:var(--font);font-size:14px;font-weight:600;outline:none;transition:border-color .15s;width:100%}
.bg-form-input:focus{border-color:var(--duo-blue,#1cb0f6)}
.bg-form-input::placeholder{color:rgba(255,255,255,.25)}
.bg-spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,.1);border-top-color:#7c3aed;border-radius:50%;animation:bgSpin .7s linear infinite;margin:0 auto}
@keyframes bgSpin{to{transform:rotate(360deg)}}

/* ── Board game question cards ── */
.bg-question-card{display:flex;gap:12px;padding:14px;background:var(--bg2);border:1px solid rgba(255,255,255,.08);border-radius:12px;align-items:flex-start}
.bg-q-num{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--text3);min-width:22px;margin-top:2px}
.bg-q-text{font-size:13px;font-weight:600;margin-bottom:7px;line-height:1.45}
.bg-q-answer{font-size:12px;color:rgba(255,255,255,.7);margin-bottom:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bg-answer-label{font-family:var(--mono);font-size:10px;color:var(--text3)}
.bg-answer-badge{font-family:var(--mono);font-size:10px;font-weight:700;padding:3px 10px;border-radius:99px}
.bg-ans-true{background:rgba(87,204,2,.15);color:#57cc02;border:1px solid rgba(87,204,2,.3)}
.bg-ans-false{background:rgba(255,75,75,.12);color:#ff4b4b;border:1px solid rgba(255,75,75,.3)}
.bg-q-hint{font-size:11px;color:var(--text3);padding:6px 10px;background:rgba(255,255,255,.04);border-radius:6px;line-height:1.5}


/* ── Quiz cards ── */
.qz-card{display:flex;flex-direction:column;background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;overflow:hidden;transition:all .18s}
.qz-card:hover{border-color:var(--border2);transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.25)}
.qz-card-top{position:relative;height:80px;overflow:hidden;cursor:pointer}
.qz-card-cover{width:100%;height:100%}
.qz-card-badges{position:absolute;top:8px;left:8px;display:flex;gap:4px}
.qz-badge{font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase}
.qz-badge-pub{background:rgba(87,204,2,.2);color:#57cc02;border:1px solid rgba(87,204,2,.3)}
.qz-badge-draft{background:rgba(255,255,255,.1);color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.1)}
.qz-ai-badge{background:rgba(139,92,246,.15);color:#a78bfa;font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase}
.qz-delete-btn{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.5);border:1px solid rgba(255,75,75,.3);color:rgba(255,75,75,.7);width:26px;height:26px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;opacity:0}
.qz-card:hover .qz-delete-btn{opacity:1}
.qz-delete-btn:hover{background:rgba(255,75,75,.2);color:#ff4b4b}
.qz-card-body{padding:10px 14px 8px;cursor:pointer;flex:1}
.qz-card-title{font-size:13px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qz-card-meta{font-family:var(--mono);font-size:10px;color:var(--text3)}
.qz-card-actions{padding:0 10px 10px;display:flex;gap:6px}
.qz-btn-edit{flex:1;padding:7px;font-size:11px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:700;transition:all .15s;white-space:nowrap}
.qz-btn-edit:hover{border-color:var(--border3)}
.qz-btn-launch{flex:1;padding:7px;font-size:11px;background:var(--duo-green,#57cc02);border:none;color:#000;border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:800;transition:filter .15s;white-space:nowrap}
.qz-btn-launch:hover{filter:brightness(1.1)}
.qz-btn-sm{padding:5px 10px;font-size:11px;border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:700;transition:all .15s}

/* ── Recent & Launch rows ── */
.qz-recent-row,.qz-launch-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.qz-recent-row:last-child,.qz-launch-row:last-child{border-bottom:none}
.qz-launch-row{padding:11px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;margin-bottom:7px}
.qz-recent-cover{width:40px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0}
.qz-recent-info{flex:1;min-width:0}
.qz-recent-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qz-recent-meta{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:2px}

/* ── Sessions ── */
.qz-session-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;transition:border-color .15s}
.qz-session-row.qz-session-live{border-color:rgba(87,204,2,.25)}
.qz-session-indicator{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0}
.qz-session-indicator.live{background:#57cc02;animation:livePulse 1.2s infinite}
@keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.6}}
.qz-session-info{flex:1;min-width:0}
.qz-session-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qz-session-meta{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:3px}
.qz-session-pin{color:var(--duo-blue,#1cb0f6);font-weight:700}
.qz-session-status{font-family:var(--mono);font-size:10px;font-weight:700;color:rgba(255,255,255,.3);flex-shrink:0}
.qz-session-status.live{color:#57cc02}

/* ── PIN ── */
.qz-pin-digit{display:inline-flex;align-items:center;justify-content:center;width:44px;height:56px;background:var(--bg2);border:2px solid var(--border);border-radius:12px;font-family:var(--mono);font-size:24px;font-weight:900;transition:all .15s}
.qz-pin-digit-active{border-color:var(--duo-blue,#1cb0f6)}
.qz-pin-digit-filled{border-color:rgba(87,204,2,.5);color:#57cc02}

/* ── Loading & empty ── */
.qz-loading{padding:32px;text-align:center;color:var(--text3);font-size:13px;font-family:var(--mono)}
.empty-state-rich{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.empty-icon{font-size:36px}
.empty-title{font-size:16px;font-weight:800}
.empty-sub{font-size:13px;color:var(--text3)}
.empty-action-btn{background:var(--duo-blue,#1cb0f6);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-family:var(--font);font-size:14px;font-weight:800;cursor:pointer;margin-top:8px;transition:filter .15s}
.empty-action-btn:hover{filter:brightness(1.1)}

/* ── Misc ── */
.status-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.status-dot.published{background:#57cc02}
.status-dot.draft{background:rgba(255,255,255,.2)}
.qz-stats-strip{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.qz-stat{display:flex;flex-direction:column;gap:3px;flex:1;min-width:80px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 16px}
.qz-stat-num{font-size:22px;font-weight:900;color:var(--duo-blue,#1cb0f6);font-family:var(--mono);line-height:1}
.qz-stat-lbl{font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em}
.quiz-stats-row{display:flex;gap:10px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06)}
.quiz-stat-chip{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;padding:10px;background:var(--bg2);border-radius:10px;border:1px solid var(--border)}
.quiz-stat-num{font-size:18px;font-weight:900;line-height:1}
.quiz-stat-lbl{font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase}
`;
  document.head.appendChild(s);
}