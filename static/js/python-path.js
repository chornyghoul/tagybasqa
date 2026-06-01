/**
 * TAGYBASQA — python-path.js
 * Duolingo-style Python Путь: читает шаги из Firestore, рендерит roadmap.
 */

import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc,
         orderBy, query, serverTimestamp, arrayUnion } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export async function initPythonPath(user, db) {
  const roadmapEl   = document.getElementById('pythonRoadmap');
  const statsEl     = document.getElementById('pythonPathStats');
  const descEl      = document.getElementById('pathDescription');
  if (!roadmapEl) return;

  roadmapEl.innerHTML = `<div class="path-loading"><div class="path-spinner"></div><span>Загрузка пути...</span></div>`;

  try {
    // 1. Загрузить шаги пути
    const stepsSnap = await getDocs(query(collection(db, 'pythonPath'), orderBy('order', 'asc')));
    const steps = stepsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Загрузить прогресс пользователя
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    const completedSteps = new Set(userData.completedPathSteps || []);
    const userXP = userData.pathXP || 0;
    const userLevel = Math.floor(userXP / 500) + 1;

    // 3. Определить разблокированные шаги
    const unlockedSteps = new Set(['step-1']);
    steps.forEach((step, i) => {
      if (completedSteps.has(step.id) && i + 1 < steps.length) {
        unlockedSteps.add(steps[i + 1].id);
      }
    });

    // 4. Статистика
    const totalXP = steps.reduce((s, st) => completedSteps.has(st.id) ? s + st.xp : s, 0);
    const pct = steps.length ? Math.round(completedSteps.size / steps.length * 100) : 0;

    if (descEl) descEl.textContent = 'Пройди все этапы от новичка до Python-разработчика. Каждый шаг открывает следующий.';

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="path-stat-card">
          <span class="path-stat-num" style="color:var(--duo-yellow);">${userXP}</span>
          <span class="path-stat-lbl">XP</span>
        </div>
        <div class="path-stat-card">
          <span class="path-stat-num" style="color:var(--duo-green);">${completedSteps.size}/${steps.length}</span>
          <span class="path-stat-lbl">Пройдено</span>
        </div>
        <div class="path-stat-card">
          <span class="path-stat-num" style="color:var(--duo-blue);">${pct}%</span>
          <span class="path-stat-lbl">Прогресс</span>
        </div>
        <div class="path-stat-card">
          <span class="path-stat-num" style="color:var(--duo-purple);">LV.${userLevel}</span>
          <span class="path-stat-lbl">Уровень</span>
        </div>`;
    }

    // 5. Рендер роадмапа
    const categories = [...new Set(steps.map(s => s.category))];
    let html = '';
    let globalIdx = 0;

    // Группировка по категориям
    const grouped = {};
    steps.forEach(s => { if (!grouped[s.category]) grouped[s.category] = []; grouped[s.category].push(s); });

    Object.entries(grouped).forEach(([cat, catSteps]) => {
      html += `<div class="roadmap-section">
        <div class="roadmap-section-label">${getCatEmoji(cat)} ${cat}</div>
        <div class="roadmap-steps-col">`;

      catSteps.forEach((step, localIdx) => {
        const isDone = completedSteps.has(step.id);
        const isUnlocked = unlockedSteps.has(step.id) || step.unlocked;
        const isCurrent = isUnlocked && !isDone;
        const isLocked = !isUnlocked && !isDone;
        const offset = getOffset(globalIdx);

        html += `
        <div class="roadmap-step-wrap" style="margin-left:${offset}px;">
          <div class="roadmap-step ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-current' : ''} ${isLocked ? 'step-locked' : ''} step-type-${step.type}"
               data-step-id="${step.id}" data-unlocked="${isUnlocked}" data-done="${isDone}">
            <div class="step-circle">
              <span class="step-emoji">${isDone ? '✓' : step.emoji}</span>
            </div>
            <div class="step-info">
              <div class="step-title">${escHtml(step.title)}</div>
              <div class="step-desc">${escHtml(step.description)}</div>
              <div class="step-meta">
                <span class="step-type-badge step-badge-${step.type}">${getTypeLabel(step.type)}</span>
                <span class="step-xp">⚡ ${step.xp} XP</span>
                ${isDone ? '<span class="step-done-badge">✓ Пройдено</span>' : ''}
              </div>
            </div>
          </div>
          ${localIdx < catSteps.length - 1 ? '<div class="roadmap-connector ' + (isDone ? 'connector-done' : '') + '"></div>' : ''}
        </div>`;
        globalIdx++;
      });

      html += `</div></div>`;
    });

    roadmapEl.innerHTML = html;

    // 6. Клики по шагам
    roadmapEl.querySelectorAll('.roadmap-step').forEach(el => {
      el.addEventListener('click', () => {
        const stepId = el.dataset.stepId;
        const isUnlocked = el.dataset.unlocked === 'true';
        const isDone = el.dataset.done === 'true';
        const step = steps.find(s => s.id === stepId);
        if (!step) return;

        if (isLocked && !isDone) {
          showPathToast('🔒 Сначала пройди предыдущий шаг!');
          el.style.animation = 'path-shake .3s';
          setTimeout(() => el.style.animation = '', 300);
          return;
        }

        openStepModal(step, isDone, user, db, completedSteps, steps, roadmapEl, statsEl);
      });
    });

  } catch (e) {
    roadmapEl.innerHTML = `<div class="path-error">⚠️ Ошибка загрузки пути: ${e.message}<br><small>Убедитесь что контент загружен через seed-content.html</small></div>`;
    console.error('Python Path error:', e);
  }
}

// ── Модал шага ──────────────────────────────────────────────────────
function openStepModal(step, isDone, user, db, completedSteps, steps, roadmapEl, statsEl) {
  // Удалить старый модал
  document.getElementById('pathStepModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'pathStepModal';
  modal.className = 'path-modal-overlay';
  modal.innerHTML = `
    <div class="path-modal">
      <button class="path-modal-close" id="pathModalClose">✕</button>
      <div class="path-modal-emoji">${step.emoji}</div>
      <div class="path-modal-type">${getTypeLabel(step.type)}</div>
      <h2 class="path-modal-title">${escHtml(step.title)}</h2>
      <p class="path-modal-desc">${escHtml(step.description)}</p>
      <div class="path-modal-xp">⚡ ${step.xp} XP за прохождение</div>
      ${isDone ? `
        <div class="path-modal-done">✓ Уже пройдено!</div>
        <button class="path-modal-btn path-btn-secondary" id="pathRepeat">🔄 Повторить</button>
      ` : `
        <button class="path-modal-btn path-btn-primary" id="pathStart">
          ${getStartLabel(step.type)} →
        </button>
      `}
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.add('active');

  modal.querySelector('#pathModalClose')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  const startBtn = modal.querySelector('#pathStart') || modal.querySelector('#pathRepeat');
  startBtn?.addEventListener('click', async () => {
    modal.remove();

    // Отметить шаг выполненным
    if (!isDone) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          completedPathSteps: arrayUnion(step.id),
          pathXP: (user.pathXP || 0) + step.xp
        });
        completedSteps.add(step.id);
        showPathToast(`+${step.xp} XP за "${step.title}"! 🎉`);

        // Перерендерить путь
        setTimeout(() => initPythonPath(user, db), 500);
      } catch(e) { console.error(e); }
    }

    // Редирект в зависимости от типа
    if (step.type === 'quiz') {
      document.querySelector('.nav-item.tab-btn[data-target="view-quizzes"]')?.click();
    } else if (step.type === 'boss') {
      document.querySelector('.nav-item.tab-btn[data-target="view-quizzes"]')?.click();
      setTimeout(() => document.querySelector('.quiz-action-tab[data-quiz-panel="qp-bosses"]')?.click(), 300);
    } else {
      document.querySelector('.nav-item.tab-btn[data-target="view-story"]')?.click();
    }
  });
}

// ── Утилиты ──────────────────────────────────────────────────────
function getOffset(idx) {
  const offsets = [0, 40, 80, 80, 40, 0, -40, -80, -80, -40];
  return offsets[idx % offsets.length];
}

function getCatEmoji(cat) {
  const map = { 'Основы':'🌱','Управление':'🔀','Функции':'⚙️','Данные':'📋','ООП':'🏛️','Продвинутый':'🚀','Проверка':'⚡','Испытание':'🐉' };
  return map[cat] || '📌';
}

function getTypeLabel(type) {
  return { lesson:'Урок', quiz:'Квиз', boss:'Босс', task:'Задание' }[type] || type;
}

function getStartLabel(type) {
  return { lesson:'Начать урок', quiz:'Пройти квиз', boss:'Сразиться с боссом', task:'Выполнить задание' }[type] || 'Начать';
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showPathToast(msg) {
  let t = document.getElementById('path-toast');
  if (!t) { t = document.createElement('div'); t.id = 'path-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'path-toast show';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Стили ─────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
.path-loading { display:flex;align-items:center;gap:12px;padding:40px;color:var(--text3);font-family:var(--mono);font-size:13px; }
.path-spinner { width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--duo-blue);border-radius:50%;animation:path-spin .7s linear infinite; }
@keyframes path-spin { to { transform:rotate(360deg) } }
.path-error { padding:32px;text-align:center;color:var(--duo-red);font-family:var(--mono);font-size:13px;line-height:1.8; }

/* Статистика пути */
.path-stats { display:flex;gap:10px;flex-wrap:wrap; }
.path-stat-card { background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 16px;text-align:center;min-width:70px; }
.path-stat-num { display:block;font-size:20px;font-weight:900;line-height:1; }
.path-stat-lbl { display:block;font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase;margin-top:3px; }

/* Роадмап */
.duolingo-roadmap { display:flex;flex-direction:column;gap:0; }
.roadmap-section { margin-bottom:32px; }
.roadmap-section-label { font-family:var(--mono);font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.12em;font-weight:700;padding:8px 0;margin-bottom:8px;border-bottom:1px solid var(--border); }
.roadmap-steps-col { display:flex;flex-direction:column;align-items:flex-start;gap:0; }
.roadmap-step-wrap { display:flex;flex-direction:column;align-items:center;width:100%;transition:margin .3s; }

/* Карточка шага */
.roadmap-step {
  display:flex;align-items:center;gap:16px;
  background:var(--bg2);border:2px solid var(--border);
  border-radius:16px;padding:14px 18px;cursor:pointer;
  width:min(100%,520px);transition:all .2s;position:relative;
}
.roadmap-step:hover:not(.step-locked) { border-color:var(--duo-blue);transform:translateX(4px); }
.step-done { border-color:rgba(87,204,2,.4) !important;background:rgba(87,204,2,.06); }
.step-current { border-color:var(--duo-blue);box-shadow:0 0 0 3px rgba(28,176,246,.15);animation:path-pulse 2s ease-in-out infinite; }
@keyframes path-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(28,176,246,.15)} 50%{box-shadow:0 0 0 6px rgba(28,176,246,.08)} }
.step-locked { opacity:.4;cursor:not-allowed;filter:grayscale(.6); }
.step-type-boss { border-color:rgba(255,75,75,.3);background:rgba(255,75,75,.04); }
.step-type-boss.step-current { border-color:var(--duo-red);box-shadow:0 0 0 3px rgba(255,75,75,.15); }
.step-type-quiz { border-color:rgba(255,217,0,.25);background:rgba(255,217,0,.03); }

.step-circle {
  width:52px;height:52px;border-radius:50%;flex-shrink:0;
  background:var(--bg3);border:2px solid var(--border2);
  display:flex;align-items:center;justify-content:center;font-size:24px;
  transition:all .2s;
}
.step-done .step-circle { background:rgba(87,204,2,.2);border-color:var(--duo-green);color:var(--duo-green);font-size:20px;font-weight:900; }
.step-current .step-circle { background:rgba(28,176,246,.15);border-color:var(--duo-blue); }
.step-type-boss .step-circle { background:rgba(255,75,75,.1);border-color:rgba(255,75,75,.4); }
.step-info { flex:1;min-width:0; }
.step-title { font-size:15px;font-weight:800;margin-bottom:4px; }
.step-desc { font-size:12px;color:var(--text3);margin-bottom:8px;line-height:1.4; }
.step-meta { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
.step-type-badge { font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase; }
.step-badge-lesson { background:rgba(28,176,246,.15);color:var(--duo-blue); }
.step-badge-quiz { background:rgba(255,217,0,.15);color:var(--duo-yellow); }
.step-badge-boss { background:rgba(255,75,75,.15);color:var(--duo-red); }
.step-badge-task { background:rgba(87,204,2,.15);color:var(--duo-green); }
.step-xp { font-family:var(--mono);font-size:10px;color:var(--duo-green);font-weight:700; }
.step-done-badge { font-family:var(--mono);font-size:9px;color:var(--duo-green);background:rgba(87,204,2,.12);padding:2px 8px;border-radius:99px; }

/* Коннектор между шагами */
.roadmap-connector { width:3px;height:32px;background:var(--border);margin:0 auto;border-radius:99px;transition:background .3s; }
.connector-done { background:rgba(87,204,2,.4); }

/* Модал */
.path-modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:2000; }
.path-modal-overlay.active { display:flex; }
.path-modal { background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:32px;max-width:440px;width:90%;text-align:center;position:relative; }
.path-modal-close { position:absolute;top:16px;right:16px;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center; }
.path-modal-emoji { font-size:64px;margin-bottom:12px; }
.path-modal-type { font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px; }
.path-modal-title { font-size:22px;font-weight:900;margin-bottom:8px; }
.path-modal-desc { font-size:14px;color:var(--text3);line-height:1.6;margin-bottom:16px; }
.path-modal-xp { font-family:var(--mono);font-size:16px;font-weight:900;color:var(--duo-green);margin-bottom:20px; }
.path-modal-done { color:var(--duo-green);font-weight:800;margin-bottom:12px;font-size:14px; }
.path-modal-btn { border-radius:99px;padding:14px 32px;font-family:var(--font);font-weight:800;font-size:15px;cursor:pointer;border:none;width:100%;transition:filter .15s; }
.path-btn-primary { background:var(--duo-blue);border-bottom:3px solid var(--duo-blue2);color:#fff; }
.path-btn-primary:hover { filter:brightness(1.1); }
.path-btn-secondary { background:var(--bg3);border:2px solid var(--border2);color:var(--text2); }

/* Toast */
.path-toast { position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--duo-green);color:#000;font-weight:900;font-family:var(--mono);font-size:13px;padding:10px 24px;border-radius:99px;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap; }
.path-toast.show { opacity:1;transform:translateX(-50%) translateY(0); }

@keyframes path-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
`;
document.head.appendChild(style);