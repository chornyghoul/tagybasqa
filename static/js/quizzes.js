// ════════════════════════════════════════════════════════
// quizzes.js — полноценный модуль раздела "Испытания"
// Подключить: <script src="./static/js/quizzes.js" type="module"></script>
// ════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, getDocs,
  serverTimestamp, increment, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAywbSZkiReHjTq4oc46Kbw9iZ0iDHVTpY",
  authDomain: "pystart-dd2db.firebaseapp.com",
  projectId: "pystart-dd2db",
  storageBucket: "pystart-dd2db.firebasestorage.app",
  messagingSenderId: "9188811255",
  appId: "1:9188811255:web:6f7280f1f7f67b80d90ef2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db   = getFirestore(app);

// ── State ──────────────────────────────────────────────
let _user = null;
let _allMyQuizzes = [];
let _quizFilterTag = 'all';
let _quizSearch = '';
let _selectedModel = 'gemini-2.5-flash';
let _currentAIQuiz = null;

// ══════════════════════════════════════════════════════
// INIT — когда авторизован
// ══════════════════════════════════════════════════════
onAuthStateChanged(auth, async user => {
  if (!user) return;
  _user = user;
  initQuizzesSection();
});

function initQuizzesSection() {
  setupQuizTabSwitching();
  setupFilterTags();
  setupSearch();
  setupSortSelect();
  loadBossesTab();
  loadMyQuizzes();
  loadLaunchTab();
  loadAnalytics();
  setupAIModal();
}

// ══════════════════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════════════════
function setupQuizTabSwitching() {
  document.querySelectorAll('.quiz-action-tab[data-quiz-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-action-tab[data-quiz-panel]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.quiz-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.quizPanel);
      if (panel) panel.classList.add('active');
    });
  });
}

// ══════════════════════════════════════════════════════
// УТИЛИТЫ
// ══════════════════════════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - ts.seconds * 1000) / 1000;
  if (diff < 60)   return 'только что';
  if (diff < 3600) return Math.floor(diff/60) + ' мин. назад';
  if (diff < 86400)return Math.floor(diff/3600) + ' ч. назад';
  return new Date(ts.seconds*1000).toLocaleDateString('ru',{day:'numeric',month:'short'});
}

function getQuizGradient(title) {
  const colors = [
    ['#1a1a1a','#3b3b3b'],['#1e3a5f','#2563eb'],['#4c1d95','#7c3aed'],
    ['#7c1d44','#ec4899'],['#064e3b','#059669'],['#78350f','#d97706']
  ];
  const idx = (title || '').charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

function getQuizCover(quiz) {
  if (quiz.cover && quiz.cover.startsWith('http'))
    return `<img src="${quiz.cover}" style="width:100%;height:100%;object-fit:cover;">`;
  const letter = (quiz.title || 'К').charAt(0).toUpperCase();
  return `<div style="width:100%;height:100%;background:${getQuizGradient(quiz.title)};display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:900;">${letter}</div>`;
}

window.showToast = window.showToast || function(msg) {
  let t = document.getElementById('tbq-toast');
  if (!t) { t = document.createElement('div'); t.id = 'tbq-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
};

// ══════════════════════════════════════════════════════
// ════════ ВКЛАДКА: БОССЫ ════════
// ══════════════════════════════════════════════════════
async function loadBossesTab() {
  await Promise.all([loadBossCards(), loadQuickChallenges(), loadBossGlobalStats()]);
}

async function loadBossGlobalStats() {
  try {
    const [bossSnap, userSnap] = await Promise.all([
      getDocs(query(collection(db, 'bosses'), limit(50))),
      _user ? getDoc(doc(db, 'users', _user.uid)) : null
    ]);
    const total = bossSnap.size;
    const userData = userSnap?.data() || {};
    const defeated = (userData.defeatedBosses || []).length;
    const xp = userData.bossXP || 0;
    let totalPlayers = 0;
    bossSnap.forEach(d => { totalPlayers += d.data().participants || 0; });

    setEl('bgsTotal', total);
    setEl('bgsDefeated', defeated);
    setEl('bgsXP', xp);
    setEl('bgsPlayers', totalPlayers);
  } catch(e) {
    // Если коллекция пуста — покажем дефолт
    setEl('bgsTotal', 4);
    setEl('bgsXP', 0);
  }
}

async function loadBossCards() {
  const container = document.getElementById('bossCardsContainer');
  if (!container) return;

  try {
    const snap = await getDocs(query(collection(db, 'bosses'), orderBy('order', 'asc')));
    const userData = _user ? (await getDoc(doc(db, 'users', _user.uid))).data() || {} : {};
    const defeatedIds = userData.defeatedBosses || [];

    if (snap.empty) {
      // Показываем дефолтных боссов если коллекция пуста
      container.innerHTML = renderDefaultBosses(defeatedIds, userData);
      return;
    }

    let html = '';
    snap.forEach((d, idx) => {
      const boss = { id: d.id, ...d.data() };
      const isDefeated = defeatedIds.includes(boss.id);
      const isLocked = boss.requiredLevel > (userData.level || 1);
      html += renderBossCard(boss, isDefeated, isLocked, idx);
    });
    container.innerHTML = html;
  } catch(e) {
    // Дефолтные боссы
    container.innerHTML = renderDefaultBosses([], {});
  }
}

function renderDefaultBosses(defeatedIds, userData) {
  const defaults = [
    {
      id:'boss-vars', order:1, emoji:'🐉', name:'Дракон Переменных',
      subtitle:'Глава I', topics:'Типы данных, операторы',
      questions:20, participants:1240, xp:200, trophyLabel:'Трофей',
      hpPercent:100, color:['#7f1d1d','#dc2626'], requiredLevel:1
    },
    {
      id:'boss-loops', order:2, emoji:'🤖', name:'Кибер-Циклоид',
      subtitle:'Глава II', topics:'Циклы, условия, break/continue',
      questions:15, participants:860, xp:300, trophyLabel:'Трофей',
      hpPercent:60, color:['#1e3a5f','#3b82f6'], requiredLevel:3
    },
    {
      id:'boss-funcs', order:3, emoji:'🧙', name:'Архимаг Функций',
      subtitle:'Глава III', topics:'Функции, lambda, декораторы',
      questions:25, participants:430, xp:500, trophyLabel:'Легендарный трофей',
      hpPercent:30, color:['#4c1d95','#7c3aed'], requiredLevel:7
    },
    {
      id:'boss-oop', order:4, emoji:'🔒', name:'Повелитель ООП',
      subtitle:'Глава IV', topics:'Классы, наследование, полиморфизм',
      questions:30, participants:0, xp:750, trophyLabel:'Мифический трофей',
      hpPercent:100, color:['#1c1c1c','#333'], requiredLevel:15
    }
  ];
  const userLevel = userData.level || 1;
  return defaults.map((boss, idx) => {
    const isDefeated = defeatedIds.includes(boss.id);
    const isLocked = boss.requiredLevel > userLevel;
    return renderBossCard(boss, isDefeated, isLocked, idx);
  }).join('');
}

function renderBossCard(boss, isDefeated, isLocked, idx) {
  const hpW = isDefeated ? 0 : (boss.hpPercent ?? 100);
  const hpColor = hpW > 60 ? '#ef4444' : hpW > 30 ? '#f59e0b' : '#22c55e';
  const statusLabel = isDefeated ? '✓ Побеждён' : isLocked ? `🔒 Нужен LV.${boss.requiredLevel}` : 'Открыт';
  const statusColor = isDefeated ? 'var(--green)' : isLocked ? 'var(--text3)' : '#8b5cf6';

  return `
    <div class="boss-card ${isLocked && !isDefeated ? 'boss-locked' : ''}" data-boss-id="${boss.id}">
      <div class="boss-header">
        <div class="boss-avatar" style="background:${boss.color ? `linear-gradient(135deg,${boss.color[0]},${boss.color[1]})` : 'var(--bg3)'};">
          ${boss.emoji || '👹'}
        </div>
        <div class="boss-info">
          <div class="boss-label">${esc(boss.subtitle || `Босс ${idx+1}`)}</div>
          <div class="boss-name">${esc(boss.name)}</div>
          <div class="boss-sub">${esc(boss.topics || '')}</div>
        </div>
        <div style="margin-left:auto;text-align:right;">
          <div style="font-family:var(--mono);font-size:10px;color:${statusColor};font-weight:700;">${statusLabel}</div>
          ${isDefeated ? `<div style="font-family:var(--mono);font-size:9px;color:var(--text3);">+${boss.xp || 0} XP</div>` : ''}
        </div>
      </div>
      <div class="boss-hp-track">
        <div class="boss-hp-fill" style="width:${hpW}%;background:${isDefeated ? 'var(--green)' : `linear-gradient(90deg,${hpColor},${hpColor}88)`};"></div>
      </div>
      <div class="boss-meta">
        <span style="font-family:var(--mono);font-size:10px;color:var(--text3);">❓ ${boss.questions || 0} вопросов</span>
        <span style="font-family:var(--mono);font-size:10px;color:var(--text3);">👥 ${(boss.participants || 0).toLocaleString('ru')}</span>
      </div>
      <div class="boss-footer">
        <div class="boss-reward">⚡ +${boss.xp || 0} XP · 🏆 ${esc(boss.trophyLabel || 'Трофей')}</div>
        <button
          class="boss-btn ${isLocked && !isDefeated ? 'boss-btn-locked' : isDefeated ? 'boss-btn-repeat' : 'boss-btn-fight'}"
          onclick="startBoss('${boss.id}', '${boss.quizId || ''}', ${isLocked && !isDefeated})">
          ${isDefeated ? '🔁 Повторить' : isLocked ? '🔒 Закрыто' : '⚔️ Сразиться'}
        </button>
      </div>
    </div>`;
}

async function loadQuickChallenges() {
  const container = document.getElementById('quickChallengesContainer');
  if (!container) return;

  try {
    const snap = await getDocs(query(collection(db, 'challenges'), orderBy('order','asc'), limit(10)));
    if (snap.empty) {
      container.innerHTML = renderDefaultChallenges();
      return;
    }
    let html = '';
    snap.forEach(d => { html += renderChallengeRow({ id: d.id, ...d.data() }); });
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = renderDefaultChallenges();
  }
}

function renderDefaultChallenges() {
  const defaults = [
    { id:'c1', title:'🐍 Python синтаксис — разогрев', questions:10, duration:'5 мин', level:'Начальный', quizId:'' },
    { id:'c2', title:'📋 Структуры данных — глубокое погружение', questions:20, duration:'12 мин', level:'Средний', quizId:'', badge:'HOT' },
    { id:'c3', title:'🧠 Алгоритмы — на скорость', questions:15, duration:'8 мин', level:'Продвинутый', quizId:'' },
    { id:'c4', title:'⚡ Функции и замыкания', questions:12, duration:'7 мин', level:'Средний', quizId:'' },
    { id:'c5', title:'🗄️ SQL основы — быстрый тест', questions:10, duration:'5 мин', level:'Начальный', quizId:'' }
  ];
  return defaults.map(c => renderChallengeRow(c)).join('');
}

function renderChallengeRow(c) {
  return `
    <div class="challenge-row" onclick="startChallenge('${c.id}','${c.quizId||''}')">
      <div>
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;">
          ${esc(c.title)}
          ${c.badge ? `<span class="challenge-badge">${esc(c.badge)}</span>` : ''}
        </div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);">
          ${c.questions || '?'} вопросов · ${esc(c.duration||'—')} · ${esc(c.level||'—')}
        </div>
      </div>
      <button class="challenge-btn" onclick="event.stopPropagation();startChallenge('${c.id}','${c.quizId||''}')">Начать →</button>
    </div>`;
}

// ── Старт босса / испытания ──────────────────────────
window.startBoss = async function(bossId, quizId, isLocked) {
  if (isLocked) { showToast('🔒 Нужен более высокий уровень!'); return; }
  if (quizId) {
    window.location.href = `./quiz-play.html?quiz=${quizId}&boss=${bossId}`;
  } else {
    showToast('⚔️ Режим битвы с боссом — скоро!');
  }
};

window.startChallenge = async function(challengeId, quizId) {
  if (quizId) {
    window.location.href = `./quiz-play.html?quiz=${quizId}&challenge=${challengeId}`;
  } else {
    showToast('🎮 Испытание запускается...');
  }
};

// ══════════════════════════════════════════════════════
// ════════ МОИ КВИЗЫ ════════
// ══════════════════════════════════════════════════════
async function loadMyQuizzes() {
  if (!_user) return;
  const grid = document.getElementById('myQuizzesGrid');
  const recentContainer = document.getElementById('recentQuizzesCreate');
  const launchList = document.getElementById('launchMyQuizList');

  try {
    const q = query(collection(db, 'quizzes'), where('uid', '==', _user.uid));
    const snap = await getDocs(q);

    _allMyQuizzes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _allMyQuizzes.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

    // Обновляем счётчики
    const total = _allMyQuizzes.length;
    const pub   = _allMyQuizzes.filter(q => q.visibility === 'public').length;
    const draft = _allMyQuizzes.filter(q => q.visibility !== 'public').length;
    const ai    = _allMyQuizzes.filter(q => q.generatedByAI).length;
    const totalQ= _allMyQuizzes.reduce((s,q) => s+(q.questions?.length||0), 0);

    setEl('qs-total', total);    setEl('qs-pub', pub);
    setEl('qs-ai', ai);          setEl('qs-total-q', totalQ);
    setEl('qs-total-my', total); setEl('qs-pub-my', pub);
    setEl('qs-draft-my', draft); setEl('qs-ai-my', ai);

    renderMyQuizzesGrid();

    // Последние 3 в "Создать"
    if (recentContainer) renderRecentQuizzes(recentContainer, _allMyQuizzes.slice(0,3));

    // Список для запуска
    if (launchList) renderLaunchList(launchList, _allMyQuizzes);

    // Аналитика
    loadAnalytics();

  } catch(e) {
    console.error(e);
    if (grid) grid.innerHTML = '<div class="qz-loading" style="grid-column:1/-1;">Ошибка загрузки квизов</div>';
  }
}

function renderMyQuizzesGrid() {
  const grid = document.getElementById('myQuizzesGrid');
  if (!grid) return;

  const sort = document.getElementById('myQuizSort')?.value || 'date';
  let list = [..._allMyQuizzes];

  // Фильтр по тегу
  if (_quizFilterTag === 'public') list = list.filter(q => q.visibility === 'public');
  else if (_quizFilterTag === 'draft') list = list.filter(q => q.visibility !== 'public');
  else if (_quizFilterTag === 'ai') list = list.filter(q => q.generatedByAI);

  // Поиск
  if (_quizSearch) {
    const s = _quizSearch.toLowerCase();
    list = list.filter(q => (q.title||'').toLowerCase().includes(s) || (q.category||'').toLowerCase().includes(s));
  }

  // Сортировка
  if (sort === 'name') list.sort((a,b) => (a.title||'').localeCompare(b.title||''));
  else if (sort === 'questions') list.sort((a,b) => (b.questions?.length||0)-(a.questions?.length||0));
  else list.sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;" class="empty-state-rich">
      <div class="empty-icon">🎯</div>
      <div class="empty-title">
        ${_quizSearch || _quizFilterTag !== 'all' ? 'Ничего не найдено' : 'У вас ещё нет квизов'}
      </div>
      ${!_quizSearch && _quizFilterTag === 'all' ? `<button class="empty-action-btn" onclick="window.location.href='./create-quiz.html'">Создать первый квиз →</button>` : ''}
    </div>`;
    return;
  }

  grid.innerHTML = list.map(quiz => {
    const count = quiz.questions?.length || 0;
    const isPub = quiz.visibility === 'public';
    const isAI  = quiz.generatedByAI === true;
    const modelLabel = quiz.aiModel ? quiz.aiModel.replace('gemini-2.5-','') : '';
    const created = timeAgo(quiz.createdAt);

    return `
      <div class="course-card modern qz-card"
           data-quiz-id="${quiz.id}"
           data-visibility="${quiz.visibility||'draft'}"
           data-ai="${isAI}">
        <div class="card-header" style="margin-bottom:10px;">
          <span class="course-category">${esc(quiz.category||'Квиз')}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            ${isAI ? `<span class="qz-ai-badge">✨ ${modelLabel}</span>` : ''}
            <span class="status-dot ${isPub?'published':'draft'}" title="${isPub?'Публичный':'Черновик'}"></span>
            <button class="delete-course-btn" title="Удалить"
                    onclick="event.stopImmediatePropagation();deleteMyQuiz('${quiz.id}')">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="quiz-card-content" style="cursor:pointer;" onclick="window.location.href='./create-quiz.html?edit=${quiz.id}'">
          <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;margin:0 auto 12px;flex-shrink:0;">
            ${getQuizCover(quiz)}
          </div>
          <h3 class="course-title-modern" style="text-align:center;font-size:14px;">${esc(quiz.title||'Без названия')}</h3>
          <p class="course-description-modern" style="text-align:center;font-size:12px;">
            ${count} вопрос${count===1?'':count<5?'а':'ов'} ·
            <span style="color:${isPub?'var(--green)':'var(--text3)'};">${isPub?'публичный':'черновик'}</span>
          </p>
          ${created ? `<div style="font-family:var(--mono);font-size:9px;color:var(--text3);text-align:center;">${created}</div>` : ''}
        </div>

        <div class="card-footer-modern" style="display:flex;gap:6px;margin-top:12px;">
          <button class="btn-secondary-modern" style="flex:1;font-size:11px;padding:8px;"
                  onclick="event.stopImmediatePropagation();window.location.href='./create-quiz.html?edit=${quiz.id}'">
            ✏️ Изменить
          </button>
          <button class="btn-primary-modern" style="flex:1;font-size:11px;padding:8px;background:var(--green);border:none;color:#fff;"
                  onclick="event.stopImmediatePropagation();launchMyQuiz('${quiz.id}','${esc(quiz.title||'')}')">
            🚀 Запустить
          </button>
        </div>
      </div>`;
  }).join('');
}

function renderRecentQuizzes(container, quizzes) {
  if (!quizzes.length) {
    container.innerHTML = '<div class="qz-loading">Нет недавних квизов</div>';
    return;
  }
  container.innerHTML = quizzes.map(q => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0;">${getQuizCover(q)}</div>
        <div>
          <div style="font-size:13px;font-weight:600;">${esc(q.title||'Без названия')}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);">${q.questions?.length||0} вопр. · ${esc(q.category||'Квиз')}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-secondary-modern" style="padding:5px 10px;font-size:11px;"
                onclick="window.location.href='./create-quiz.html?edit=${q.id}'">✏️</button>
        <button class="btn-primary-modern" style="padding:5px 10px;font-size:11px;background:var(--green);border:none;color:#fff;"
                onclick="launchMyQuiz('${q.id}','${esc(q.title||'')}')">🚀</button>
      </div>
    </div>`).join('');
}

function renderLaunchList(container, quizzes) {
  if (!quizzes.length) {
    container.innerHTML = '<div class="empty-state-rich" style="margin:0;"><div class="empty-title">Нет квизов для запуска</div></div>';
    return;
  }
  container.innerHTML = quizzes.slice(0,8).map(q => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);margin-bottom:8px;border-radius:var(--r);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;flex-shrink:0;">${getQuizCover(q)}</div>
        <div>
          <div style="font-size:13px;font-weight:600;">${esc(q.title||'Без названия')}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);">${q.questions?.length||0} вопросов</div>
        </div>
      </div>
      <button class="btn-primary-modern" style="flex:none;padding:8px 16px;font-size:12px;background:var(--green);border:none;color:#fff;"
              onclick="launchMyQuiz('${q.id}','${esc(q.title||'')}')">🚀 Запустить</button>
    </div>`).join('');
}

// ── Фильтры / поиск ──────────────────────────────────
function setupFilterTags() {
  document.querySelectorAll('.qz-filter-tag[data-qf]').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.qz-filter-tag[data-qf]').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      _quizFilterTag = tag.dataset.qf;
      renderMyQuizzesGrid();
    });
  });
}

function setupSearch() {
  const inp = document.getElementById('myQuizSearch');
  if (!inp) return;
  let timer;
  inp.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { _quizSearch = inp.value.trim(); renderMyQuizzesGrid(); }, 300);
  });
}

function setupSortSelect() {
  const sel = document.getElementById('myQuizSort');
  if (sel) sel.addEventListener('change', () => renderMyQuizzesGrid());
}

// ── Действия ─────────────────────────────────────────
window.deleteMyQuiz = async function(quizId) {
  if (!confirm('Удалить этот квиз навсегда?')) return;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    showToast('Квиз удалён');
    _allMyQuizzes = _allMyQuizzes.filter(q => q.id !== quizId);
    renderMyQuizzesGrid();
  } catch(e) { showToast('❌ Ошибка удаления'); }
};

window.launchMyQuiz = async function(quizId, title) {
  if (!_user) { showToast('Войдите в аккаунт'); return; }
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      quizId, quizTitle: title || 'Квиз',
      hostId: _user.uid,
      status: 'waiting',
      currentQuestion: -1,
      players: {},
      createdAt: serverTimestamp()
    });
    window.location.href = `./host-game.html?session=${sessionRef.id}`;
  } catch(e) { console.error(e); showToast('❌ Не удалось запустить квиз'); }
};

// ══════════════════════════════════════════════════════
// ════════ PIN-ЗАПУСК ════════
// ══════════════════════════════════════════════════════
window.onPinInput = function(val) {
  const clean = val.replace(/\D/g,'').slice(0,6);
  const inp = document.getElementById('quizPinInput');
  if (inp) inp.value = clean;
  for (let i = 0; i < 6; i++) {
    const d = document.getElementById('pd'+i);
    if (!d) continue;
    d.textContent = clean[i] || '_';
    d.classList.toggle('qz-pin-digit-active', i < clean.length);
  }
  const hint = document.getElementById('pinHint');
  if (!hint) return;
  if (!clean) { hint.textContent = ''; return; }
  if (clean.length < 6) {
    const need = 6 - clean.length;
    hint.textContent = `Ещё ${need} цифр${need===1?'у':need<5?'ы':''}`;
    return;
  }
  hint.textContent = 'Подключаемся...';
  setTimeout(() => joinByPin(), 300);
};

window.joinByPin = function() {
  const pin = document.getElementById('quizPinInput')?.value?.trim();
  if (!pin || pin.length < 4) { showToast('Введите корректный PIN'); return; }
  window.location.href = `./quiz-play.html?pin=${pin}`;
};

async function loadLaunchTab() {
  if (!_user) return;
  await loadActiveSessions();
}

async function loadActiveSessions() {
  const container = document.getElementById('activeSessionsList');
  if (!container) return;

  try {
    const q = query(
      collection(db, 'sessions'),
      where('hostId', '==', _user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="empty-state-rich" style="margin:0;border:1px dashed var(--border);padding:24px;">
        <div class="empty-icon" style="font-size:24px;">🎮</div>
        <div class="empty-title">Нет активных сессий</div>
        <div class="empty-sub">Запустите квиз чтобы начать игру</div>
      </div>`;
      return;
    }

    container.innerHTML = snap.docs.map(d => {
      const s = d.data();
      const isLive = s.status === 'waiting' || s.status === 'playing';
      const playerCount = Object.keys(s.players||{}).length;
      const created = timeAgo(s.createdAt);

      return `
        <div style="background:var(--bg2);border:1px solid ${isLive?'var(--green)':'var(--border)'};padding:16px;margin-bottom:8px;border-radius:var(--r);display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              ${isLive ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;animation:pulse-dot 1.2s infinite;"></span>' : ''}
              <span style="font-size:13px;font-weight:700;">${esc(s.quizTitle||'Квиз')}</span>
            </div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text3);">${playerCount} игроков · ${created}</div>
            <div style="font-family:var(--mono);font-size:9px;color:${isLive?'var(--green)':'var(--text3)'};margin-top:4px;text-transform:uppercase;letter-spacing:.08em;">
              ${isLive ? '● LIVE' : 'Завершена'}
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            ${isLive ? `<button class="btn-primary-modern" style="padding:7px 14px;font-size:11px;background:var(--green);border:none;color:#fff;" onclick="window.location.href='./host-game.html?session=${d.id}'">Управлять →</button>` : ''}
            <button class="btn-secondary-modern" style="padding:7px 12px;font-size:11px;" onclick="showToast('📊 Результаты — скоро!')">Итоги</button>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    console.error(e);
    container.innerHTML = '<div class="qz-loading">Ошибка загрузки сессий</div>';
  }
}

// ══════════════════════════════════════════════════════
// ════════ АНАЛИТИКА ════════
// ══════════════════════════════════════════════════════
async function loadAnalytics() {
  if (!_user) return;

  const quizzes = _allMyQuizzes.length ? _allMyQuizzes : (await (async () => {
    const snap = await getDocs(query(collection(db, 'quizzes'), where('uid','==',_user.uid)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  })());

  // Сессии
  let sessionsCount = 0, totalPlayers = 0;
  try {
    const sessSnap = await getDocs(query(collection(db,'sessions'), where('hostId','==',_user.uid), limit(100)));
    sessionsCount = sessSnap.size;
    sessSnap.forEach(d => { totalPlayers += Object.keys(d.data().players||{}).length; });
  } catch(e) {}

  const totalQ = quizzes.reduce((s,q) => s + (q.questions?.length||0), 0);
  const aiCount = quizzes.filter(q => q.generatedByAI).length;
  const manualCount = quizzes.length - aiCount;

  setEl('an-quizzes', quizzes.length);
  setEl('an-questions', totalQ);
  setEl('an-sessions', sessionsCount);
  setEl('an-players', totalPlayers);

  // Топ квизов
  const topEl = document.getElementById('analyticsTopQuizzes');
  if (topEl) {
    const sorted = [...quizzes].sort((a,b) => (b.questions?.length||0)-(a.questions?.length||0)).slice(0,6);
    const maxQ = Math.max(...sorted.map(q => q.questions?.length||0), 1);
    const barColors = ['var(--green)','#8b5cf6','var(--gold)','#ec4899','#3b82f6','#10b981'];

    topEl.innerHTML = sorted.length ? sorted.map((q, i) => {
      const pct = Math.round(((q.questions?.length||0) / maxQ) * 100);
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-family:var(--mono);font-size:11px;color:var(--text3);width:22px;">${String(i+1).padStart(2,'0')}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;margin-bottom:5px;">${esc(q.title||'Без названия')}${q.generatedByAI?'<span class="qz-ai-badge" style="margin-left:6px;">ИИ</span>':''}</div>
            <div style="height:5px;background:var(--border);overflow:hidden;border-radius:2px;">
              <div style="height:100%;width:${pct}%;background:${barColors[i]};transition:width .6s;"></div>
            </div>
          </div>
          <span style="font-family:var(--mono);font-size:11px;font-weight:700;">${q.questions?.length||0} вопр.</span>
        </div>`;
    }).join('') : '<div class="qz-loading">Нет данных</div>';
  }

  // ИИ vs вручную
  const aiChartEl = document.getElementById('analyticsAIChart');
  if (aiChartEl) {
    const total = quizzes.length || 1;
    aiChartEl.innerHTML = `
      <div style="flex:1;background:var(--bg2);border:1px solid var(--border);padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:900;background:linear-gradient(90deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${aiCount}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;">ИИ-квизов</div>
        <div style="margin-top:8px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(aiCount/total*100)}%;background:linear-gradient(90deg,#8b5cf6,#ec4899);"></div>
        </div>
      </div>
      <div style="flex:1;background:var(--bg2);border:1px solid var(--border);padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:var(--text);">${manualCount}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;">Вручную</div>
        <div style="margin-top:8px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(manualCount/total*100)}%;background:var(--text);"></div>
        </div>
      </div>
      <div style="flex:1;background:var(--bg2);border:1px solid var(--border);padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:var(--green);">${sessionsCount}</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;">Сессий проведено</div>
        <div style="margin-top:8px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${Math.min(100,sessionsCount*5)}%;background:var(--green);"></div>
        </div>
      </div>`;
  }

  // История сессий
  const histEl = document.getElementById('analyticsSessionHistory');
  if (histEl) {
    try {
      const sessSnap = await getDocs(query(collection(db,'sessions'),where('hostId','==',_user.uid),orderBy('createdAt','desc'),limit(8)));
      if (sessSnap.empty) {
        histEl.innerHTML = '<div class="qz-loading">Нет истории сессий</div>';
      } else {
        histEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;">` +
          sessSnap.docs.map(d => {
            const s = d.data();
            const isLive = s.status === 'waiting' || s.status === 'playing';
            const players = Object.keys(s.players||{}).length;
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg2);border:1px solid ${isLive?'var(--green)':'var(--border)'};border-radius:var(--r);">
                <div>
                  <span style="font-size:13px;font-weight:600;">${esc(s.quizTitle||'Квиз')}</span>
                  <span style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-left:10px;">${players} игроков · ${timeAgo(s.createdAt)}</span>
                </div>
                <span style="font-family:var(--mono);font-size:9px;text-transform:uppercase;color:${isLive?'var(--green)':'var(--text3)'};">
                  ${isLive ? '● LIVE' : 'Завершена'}
                </span>
              </div>`;
          }).join('') + `</div>`;
      }
    } catch(e) { histEl.innerHTML = '<div class="qz-loading">Ошибка загрузки истории</div>'; }
  }
}

// ══════════════════════════════════════════════════════
// ════════ ИИ-КВИЗ ════════
// ══════════════════════════════════════════════════════
function setupAIModal() {
  // Переключатель моделей
  document.querySelectorAll('.model-btn[data-model]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-btn[data-model]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _selectedModel = btn.dataset.model;
    });
  });

  // Клик вне модала
  document.getElementById('aiQuizModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('aiQuizModal')) closeAIQuizModal();
  });
}

window.openAIQuizModal = async function() {
  const modal = document.getElementById('aiQuizModal');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
  document.getElementById('aiFormStep').style.display = 'block';
  document.getElementById('aiPreviewStep').style.display = 'none';
  document.getElementById('aiTopicInput')?.focus();
  await updateDailyLimitInfo();
};

window.closeAIQuizModal = function() {
  const modal = document.getElementById('aiQuizModal');
  if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
};

window.backToAIForm = function() {
  document.getElementById('aiFormStep').style.display = 'block';
  document.getElementById('aiPreviewStep').style.display = 'none';
};

async function updateDailyLimitInfo() {
  const el = document.getElementById('dailyLimitInfo');
  if (!el || !_user) return;
  try {
    const ref = doc(db, 'aiDailyLimits', _user.uid);
    const snap = await getDoc(ref);
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    if (snap.exists() && snap.data().date === today) count = snap.data().count || 0;
    const rem = 10 - count;
    el.innerHTML = rem > 0
      ? `Осталось <strong>${rem}</strong> из 10 генераций сегодня`
      : `<span style="color:var(--red);">Лимит 10/10 исчерпан на сегодня</span>`;
  } catch(e) { el.textContent = 'Лимит: 10 генераций в день'; }
}

window.generateQuizWithAI = async function() {
  const topic = document.getElementById('aiTopicInput')?.value.trim();
  if (!topic) { showToast('Введите тему квиза!'); return; }
  if (!_user)  { showToast('Войдите в аккаунт'); return; }

  // Проверка лимита
  const limitRef = doc(db, 'aiDailyLimits', _user.uid);
  const snap = await getDoc(limitRef);
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  if (snap.exists() && snap.data().date === today) count = snap.data().count || 0;
  if (count >= 10) { showToast('❌ Лимит 10 генераций/день исчерпан'); return; }

  const countQ = document.getElementById('aiQuestionCount')?.value || '8';
  const diff   = document.getElementById('aiDifficulty')?.value || 'intermediate';
  const diffLabel = { beginner:'для начинающих', intermediate:'средняя', advanced:'продвинутая' }[diff];

  closeAIQuizModal();
  showToast(`🤖 ${_selectedModel.replace('gemini-2.5-','')} генерирует квиз...`);

  const prompt = `Создай образовательный квиз на русском языке по теме: "${topic}".
Количество вопросов: ${countQ}. Сложность: ${diffLabel}.
Каждый вопрос: ровно 4 варианта ответа, один правильный.
Верни ТОЛЬКО валидный JSON без markdown-разметки:
{"title":"...","category":"...","questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"краткое пояснение"}]}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${_selectedModel}:generateContent?key=AIzaSyC8cQujMxuqebmvvaArU23N3xdbzfGYZfU`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: 'application/json', temperature: 0.7 }
        })
      }
    );
    const data = await resp.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/```json\s*/g,'').replace(/```\s*$/g,'').trim();

    if (!jsonText) throw new Error('Пустой ответ от ИИ');
    _currentAIQuiz = JSON.parse(jsonText);
    showAIPreview(_currentAIQuiz);

    // Обновляем лимит
    if (!snap.exists() || snap.data().date !== today) {
      await setDoc(limitRef, { count:1, date:today });
    } else {
      await updateDoc(limitRef, { count: increment(1) });
    }
  } catch(e) {
    console.error(e);
    showToast('❌ Ошибка генерации. Попробуйте ещё раз.');
    openAIQuizModal();
  }
};

function showAIPreview(quiz) {
  const html = `
    <div style="margin-bottom:14px;">
      <h3 style="margin:0 0 8px;">${esc(quiz.title)}</h3>
      <span style="background:var(--bg3);color:var(--text3);padding:2px 10px;border-radius:9999px;font-family:var(--mono);font-size:11px;">${esc(quiz.category||'ИИ-квиз')}</span>
      <span style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-left:8px;">${quiz.questions?.length||0} вопросов</span>
    </div>
    <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
      ${(quiz.questions||[]).map((q,i) => `
        <div style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);">
          <div style="font-weight:600;margin-bottom:8px;font-size:13px;">${i+1}. ${esc(q.question)}</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${(q.options||[]).map((opt,idx) => `
              <div style="padding:7px 10px;border:1px solid ${idx===q.correctIndex?'var(--green)':'var(--border)'};background:${idx===q.correctIndex?'rgba(22,163,74,.07)':'transparent'};border-radius:3px;font-size:12px;display:flex;align-items:center;gap:6px;">
                ${idx===q.correctIndex?`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--green)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`:''}
                ${esc(opt)}
              </div>`).join('')}
          </div>
          ${q.explanation ? `<div style="margin-top:8px;font-size:11px;color:var(--text3);font-family:var(--mono);padding:6px;background:var(--bg3);border-radius:3px;">💡 ${esc(q.explanation)}</div>` : ''}
        </div>`).join('')}
    </div>`;

  document.getElementById('aiPreviewContent').innerHTML = html;
  const modal = document.getElementById('aiQuizModal');
  modal.style.display = 'flex';
  modal.classList.add('active');
  document.getElementById('aiFormStep').style.display = 'none';
  document.getElementById('aiPreviewStep').style.display = 'block';
}

window.saveGeneratedQuizDirect = async function() {
  if (!_currentAIQuiz || !_user) return;
  try {
    const ref = await addDoc(collection(db, 'quizzes'), {
      uid: _user.uid,
      title: _currentAIQuiz.title,
      category: _currentAIQuiz.category || 'ИИ-квиз',
      questions: (_currentAIQuiz.questions||[]).map(q => ({
        type: 'multiple',
        text: q.question,
        question: q.question,
        options: (q.options||[]).map((o,i) => ({ text: o, correct: i === q.correctIndex })),
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        timeLimit: 20,
        points: 100
      })),
      visibility: 'draft',
      generatedByAI: true,
      aiModel: _selectedModel,
      createdAt: serverTimestamp()
    });
    showToast(`✅ Квиз «${_currentAIQuiz.title}» сохранён!`);
    closeAIQuizModal();
    _currentAIQuiz = null;
    await loadMyQuizzes();
  } catch(e) { console.error(e); showToast('❌ Ошибка сохранения'); }
};

window.openInConstructor = function() {
  if (!_currentAIQuiz) return;
  sessionStorage.setItem('aiQuizDraft', JSON.stringify(_currentAIQuiz));
  closeAIQuizModal();
  window.location.href = './create-quiz.html';
};

// ══════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}