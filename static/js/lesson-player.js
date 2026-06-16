// ═══════════════════════════════════════════════════════════════
//  lesson-player.js — Tagybasqa Lesson Player
//  Этап 2–4: UI + Pyodide + Firestore прогресс
// ═══════════════════════════════════════════════════════════════

import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, updateDoc, arrayUnion, increment
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// ── Firebase config (скопируй из своего main.js) ──────────────
const firebaseConfig = {
    apiKey: "AIzaSyAywbSZkiReHjTq4oc46Kbw9iZ0iDHVTpY",
    authDomain: "pystart-dd2db.firebaseapp.com",
    projectId: "pystart-dd2db",
    storageBucket: "pystart-dd2db.firebasestorage.app",
    messagingSenderId: "9188811255",
    appId: "1:9188811255:web:6f7280f1f7f67b80d90ef2"
};  

// ─── ИНИЦИАЛИЗАЦИЯ ────────────────────────────────────────────
const app  = initializeApp(firebaseConfig, 'lesson-player');
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── СОСТОЯНИЕ ────────────────────────────────────────────────
let currentUser  = null;
let lessonData   = null;
let currentStep  = 0;
let pyodide      = null;
let pyodideReady = false;
let editors      = {};          // stepIndex → CodeMirror instance
let taskDone     = {};          // stepIndex → boolean
let lessonId     = null;

// ─── ТОЧКА ВХОДА ──────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  currentUser = user;
  // не блокируем — гость тоже может читать, прогресс не сохраняется
  loadLesson();
});

// ─── ПОЛУЧИТЬ ID ИЗ URL ───────────────────────────────────────
function getLessonId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('lessonId');
}

// ─── ЗАГРУЗКА УРОКА ───────────────────────────────────────────
async function loadLesson() {
  lessonId = getLessonId();

  if (!lessonId) {
    // Демо-урок если нет ID (для теста без Firestore)
    lessonData = getDemoLesson();
    renderLesson();
    return;
  }

  try {
    const snap = await getDoc(doc(db, 'interactiveLessons', lessonId));
    if (!snap.exists()) {
      showError('Сабақ табылмады (ID: ' + lessonId + ')');
      return;
    }
    lessonData = { id: snap.id, ...snap.data() };
    renderLesson();
  } catch (e) {
    console.error('Lesson load error:', e);
    showError('Жүктеу қатесі: ' + e.message);
  }
}

// ─── РЕНДЕР УРОКА ────────────────────────────────────────────
function renderLesson() {
  document.getElementById('lpLoading').style.display = 'none';
  document.getElementById('lpStepWrap').style.display = 'block';
  document.getElementById('lpBottomNav').style.display = 'flex';

  document.getElementById('lpTitle').textContent = lessonData.title || 'Сабақ';
  document.getElementById('lpXpBadge').textContent = `⚡ ${lessonData.xp || 0} XP`;

  renderStep(0);
  renderDots();
}

// ─── РЕНДЕР ШАГА ─────────────────────────────────────────────
function renderStep(index) {
  currentStep = index;
  const steps  = lessonData.steps || [];
  const step   = steps[index];
  const total  = steps.length;

  if (!step) return;

  // Прогресс-бар
  const pct = Math.round(((index) / total) * 100);
  document.getElementById('lpProgressFill').style.width = pct + '%';
  document.getElementById('lpStepCounter').textContent = `${index + 1} / ${total}`;

  // Кнопки навигации
  const prevBtn = document.getElementById('lpPrev');
  const nextBtn = document.getElementById('lpNext');
  prevBtn.disabled = index === 0;

  if (index === total - 1) {
    nextBtn.textContent = 'Аяқтау ✓';
    nextBtn.classList.add('lp-btn-finish');
    nextBtn.onclick = () => finishLesson();
  } else {
    nextBtn.innerHTML = 'Келесі <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.classList.remove('lp-btn-finish');
    nextBtn.onclick = () => goNext();
  }

  prevBtn.onclick = () => goPrev();

  // Обновить точки
  updateDots(index);

  // Анимация смены
  const wrap = document.getElementById('lpStepWrap');
  wrap.style.animation = 'none';
  wrap.offsetHeight; // reflow
  wrap.style.animation = '';

  // Рендер контента
  if (step.type === 'theory')  renderTheory(wrap, step, index);
  if (step.type === 'example') renderExample(wrap, step, index);
  if (step.type === 'task')    renderTask(wrap, step, index);

  // Если шаг задания — загрузить Pyodide
  if (step.type === 'task' && !pyodideReady) {
    loadPyodide();
  }
}

// ── THEORY ────────────────────────────────────────────────────
function renderTheory(wrap, step) {
  wrap.innerHTML = `
    <div class="lp-step-theory">
      <div class="lp-step-badge">📖 Теория</div>
      <h1 class="lp-step-title">${esc(step.title || '')}</h1>
      <div class="lp-step-content">${formatContent(step.content || '')}</div>
    </div>`;
}

// ── EXAMPLE ───────────────────────────────────────────────────
function renderExample(wrap, step) {
  const highlighted = highlightPython(step.code || '');
  const outputHtml  = step.output
    ? `<div class="lp-example-output">
         <div class="lp-output-label">▶ Нәтиже</div>
         <div class="lp-output-text">${esc(step.output)}</div>
       </div>`
    : '';

  wrap.innerHTML = `
    <div class="lp-step-example">
      <div class="lp-step-badge lp-step-badge-example">💡 Код мысалы</div>
      <h1 class="lp-step-title">${esc(step.title || '')}</h1>
      <div class="lp-step-content">${formatContent(step.description || '')}</div>
      <div class="lp-code-block">
        <div class="lp-code-header">
          <span class="lp-code-lang">python</span>
          <button class="lp-code-copy" onclick="copyCode(this)">Көшіру</button>
        </div>
        <pre class="lp-code-body" id="exCode">${highlighted}</pre>
      </div>
      ${outputHtml}
    </div>`;

  wrap.querySelector('.lp-code-copy').dataset.code = step.code || '';
}

// ── TASK ──────────────────────────────────────────────────────
function renderTask(wrap, step, index) {
  const isDone = !!taskDone[index];
  const hintsHtml = (step.hints || []).map((h, i) => `
    <button class="lp-hint-btn" onclick="showHint(this, '${esc(h)}')">
      💡 ${i + 1}-кеңес
    </button>`).join('');

  wrap.innerHTML = `
    <div class="lp-step-task">
      <div class="lp-task-card">
        <div class="lp-step-badge lp-step-badge-task">⚡ Тапсырма</div>
        <h1 class="lp-step-title">${esc(step.title || '')}</h1>
        <p class="lp-task-instruction">${formatContent(step.instruction || '')}</p>
      </div>

      <div class="lp-editor-card">
        <div class="lp-editor-header">
          <span class="lp-editor-title">main.py</span>
          <div class="lp-editor-actions">
            <div class="lp-pyodide-status">
              <div class="lp-pyodide-dot ${pyodideReady ? 'ready' : 'loading'}" id="pyDot"></div>
              <span id="pyStatus">${pyodideReady ? 'Дайын' : 'Жүктелуде...'}</span>
            </div>
            <button class="lp-run-btn" id="runBtn" onclick="runCode(${index})" ${!pyodideReady ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Іске қосу
            </button>
          </div>
        </div>

        <textarea id="editor-${index}">${esc(step.starterCode || '# Осында жаз\n')}</textarea>

        <div class="lp-output-panel lp-out-idle" id="output-${index}">
          ▶ Кодты іске қос...
        </div>
      </div>

      <div id="taskResult-${index}">
        ${isDone ? '<div class="lp-task-result success">✅ Тапсырма орындалды! Келесі қадамға өтуге болады.</div>' : ''}
      </div>

      ${hintsHtml ? `<div class="lp-hints-wrap">${hintsHtml}</div>` : ''}
    </div>`;

  // Инициализировать CodeMirror
  requestAnimationFrame(() => {
    const ta = document.getElementById(`editor-${index}`);
    if (ta && !editors[index]) {
      editors[index] = CodeMirror.fromTextArea(ta, {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: false,
        extraKeys: {
          'Tab': cm => cm.replaceSelection('    '),
          'Ctrl-Enter': () => runCode(index),
          'Cmd-Enter':  () => runCode(index),
        },
      });
      editors[index].setSize('100%', null);
    }
  });
}

// ─── DOTS ─────────────────────────────────────────────────────
function renderDots() {
  const steps  = lessonData.steps || [];
  const dotsEl = document.getElementById('lpDots');
  dotsEl.innerHTML = steps.map((s, i) => `
    <div class="lp-dot ${s.type}" data-index="${i}" onclick="goToStep(${i})" title="${s.type}: ${esc(s.title || '')}"></div>
  `).join('');
}

function updateDots(active) {
  document.querySelectorAll('.lp-dot').forEach((d, i) => {
    d.classList.remove('active', 'done');
    if (i === active) d.classList.add('active');
    else if (i < active || taskDone[i]) d.classList.add('done');
  });
}

// ─── NAVIGATION ───────────────────────────────────────────────
function goNext() {
  const steps = lessonData.steps || [];
  const step  = steps[currentStep];

  // Если текущий шаг — задание, нужно чтобы было выполнено
  if (step?.type === 'task' && !taskDone[currentStep]) {
    showBanner('⚡ Алдымен тапсырманы орында немесе «Іске қос» батырмасын басып, кодыңды тексер!', 'warn');
    return;
  }

  if (currentStep < steps.length - 1) {
    renderStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goPrev() {
  if (currentStep > 0) {
    renderStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.goToStep = function(i) {
  renderStep(i);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── PYODIDE ──────────────────────────────────────────────────
async function loadPyodide() {
  if (pyodideReady || pyodide) return;

  // Показать уведомление
  const notice = document.createElement('div');
  notice.className = 'lp-pyodide-overlay';
  notice.id = 'pyNotice';
  notice.innerHTML = '<div class="lp-pyodide-dot loading"></div> Python жүктелуде (~5 МБ)...';
  document.body.appendChild(notice);

  try {
    pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    });
    pyodideReady = true;

    // Обновить UI всех задач
    document.querySelectorAll('#pyDot').forEach(d => {
      d.className = 'lp-pyodide-dot ready';
    });
    document.querySelectorAll('#pyStatus').forEach(s => {
      s.textContent = 'Дайын';
    });
    document.querySelectorAll('#runBtn').forEach(b => {
      b.disabled = false;
    });

    document.getElementById('pyNotice')?.remove();
  } catch (e) {
    console.error('Pyodide load error:', e);
    document.querySelectorAll('#pyDot').forEach(d => {
      d.className = 'lp-pyodide-dot error';
    });
    document.querySelectorAll('#pyStatus').forEach(s => {
      s.textContent = 'Қате';
    });
    document.getElementById('pyNotice')?.remove();
  }
}

// ─── RUN CODE ─────────────────────────────────────────────────
window.runCode = async function(stepIndex) {
  if (!pyodideReady) {
    showBanner('Python әлі жүктелуде, күте тур...', 'warn');
    return;
  }

  const step    = lessonData.steps[stepIndex];
  const editor  = editors[stepIndex];
  const code    = editor ? editor.getValue() : '';
  const outEl   = document.getElementById(`output-${stepIndex}`);
  const runBtn  = document.getElementById('runBtn');

  if (runBtn) runBtn.disabled = true;
  outEl.className = 'lp-output-panel lp-out-run';
  outEl.textContent = '▶ Орындалуда...';

  try {
    // Перехват stdout
    let output = '';
    pyodide.globals.set('__lp_output__', []);

    await pyodide.runPythonAsync(`
import sys
from io import StringIO
__buf = StringIO()
sys.stdout = __buf
`);

    await pyodide.runPythonAsync(code);

    await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
__lp_out = __buf.getvalue()
`);

    output = pyodide.globals.get('__lp_out') || '';

    // Показать output
    outEl.className = 'lp-output-panel lp-out-ok';
    outEl.textContent = output || '(нәтиже жоқ)';

    // Проверить ожидаемый output
    if (step.expectedOutput !== undefined && step.expectedOutput !== null) {
      checkTaskResult(stepIndex, output.trim(), step.expectedOutput.trim());
    } else {
      // Нет ожидаемого — просто запустили, считаем выполненным
      markTaskDone(stepIndex);
    }

  } catch (e) {
    outEl.className = 'lp-output-panel lp-out-err';
    const errMsg = String(e).replace(/^.*Error:/m, '').trim().split('\n')[0];
    outEl.innerHTML = `<span style="color:var(--red)">⚠ Қате:</span> ${esc(errMsg)}
<div class="lp-output-hint">Кодыңды тексер — синтаксис немесе логика қатесі болуы мүмкін</div>`;
  }

  if (runBtn) runBtn.disabled = false;
};

// ─── CHECK TASK ───────────────────────────────────────────────
function checkTaskResult(stepIndex, actualOutput, expectedOutput) {
  const resultEl = document.getElementById(`taskResult-${stepIndex}`);
  const isCorrect = actualOutput === expectedOutput;

  if (isCorrect) {
    resultEl.innerHTML = '<div class="lp-task-result success">✅ Дұрыс! Тапсырма орындалды!</div>';
    markTaskDone(stepIndex);
    spawnXP();
  } else {
    resultEl.innerHTML = `
      <div class="lp-task-result fail">
        ❌ Дұрыс емес. Күтілген: <code style="font-family:var(--mono);font-size:12px;opacity:.8">${esc(expectedOutput)}</code>
      </div>`;
  }
}

function markTaskDone(stepIndex) {
  taskDone[stepIndex] = true;
  updateDots(currentStep);
}

// ─── HINTS ────────────────────────────────────────────────────
window.showHint = function(btn, text) {
  const wrap = btn.closest('.lp-hints-wrap');
  const existing = wrap.querySelector('.lp-hint-text');
  if (existing) { existing.remove(); btn.style.display = ''; return; }

  const div = document.createElement('div');
  div.className = 'lp-hint-text';
  div.textContent = '💡 ' + text;
  btn.insertAdjacentElement('afterend', div);
  btn.style.display = 'none';
};

// ─── COPY CODE ────────────────────────────────────────────────
window.copyCode = function(btn) {
  const code = btn.dataset.code || document.getElementById('exCode')?.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✓ Көшірілді';
    setTimeout(() => btn.textContent = 'Көшіру', 1500);
  });
};

// ─── FINISH LESSON ────────────────────────────────────────────
async function finishLesson() {
  const steps     = lessonData.steps || [];
  const taskSteps = steps.filter(s => s.type === 'task');
  const tasksDone = taskSteps.filter((_, i) =>
    taskDone[steps.indexOf(taskSteps[i])]
  ).length;

  // Показать модал
  document.getElementById('lpCompleteXp').textContent = `+${lessonData.xp || 0} XP`;
  document.getElementById('lpCompleteMsg').textContent =
    taskSteps.length > 0
      ? `${tasksDone}/${taskSteps.length} тапсырма орындалды · Жақсы жұмыс!`
      : 'Теория мен мысалдарды оқыдың!';

  document.getElementById('lpCompleteModal').style.display = 'flex';

  // Кнопка "Следующий урок"
  document.getElementById('lpNextLesson').onclick = () => {
    window.location.href = './index.html#pythonway';
  };

  // Обновить прогресс в Firestore
  if (currentUser) {
    await saveProgress();
  }
}

async function saveProgress() {
  if (!currentUser || !lessonId) return;
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const xp      = lessonData.xp || 0;

    await updateDoc(userRef, {
      completedInteractiveLessons:  arrayUnion(lessonId),
      completedPathSteps: lessonData.pathStepId
        ? arrayUnion(lessonData.pathStepId)
        : [],
      pathXP: increment(xp),
      totalXP: increment(xp),
      lastActivityAt: new Date().toISOString(),
    });

    // Streak update
    const today     = new Date().toDateString();
    const userSnap  = await getDoc(doc(db, 'users', currentUser.uid));
    const userData  = userSnap.data() || {};
    const lastDay   = userData.lastStreakDay || '';

    if (lastDay !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastDay === yesterday
        ? (userData.streak || 0) + 1
        : 1;
      await updateDoc(doc(db, 'users', currentUser.uid), {
        streak: newStreak,
        lastStreakDay: today,
      });
    }

  } catch (e) {
    console.error('saveProgress error:', e);
  }
}

// ─── XP ANIMATION ─────────────────────────────────────────────
function spawnXP() {
  const el = document.getElementById('lpXpFloat');
  el.textContent = '+XP 🎉';
  el.style.display = 'block';
  el.style.left = (window.innerWidth / 2 - 30) + 'px';
  el.style.top  = (window.innerHeight / 2 - 40) + 'px';
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
  setTimeout(() => { el.style.display = 'none'; }, 1500);
}

// ─── HELPERS ──────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('lpLoading').style.display = 'none';
  document.getElementById('lpError').style.display   = 'flex';
  document.getElementById('lpErrorMsg').textContent  = msg;
}

function showBanner(msg, type = 'info') {
  let b = document.getElementById('lpBanner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'lpBanner';
    b.style.cssText = `
      position:fixed;top:70px;left:50%;transform:translateX(-50%);
      background:var(--bg2);border:1px solid var(--border2);border-radius:10px;
      padding:10px 20px;font-size:13px;z-index:200;white-space:nowrap;
      transition:opacity .3s;
    `;
    document.body.appendChild(b);
  }
  b.textContent = msg;
  b.style.opacity = '1';
  b.style.borderColor = type === 'warn' ? 'var(--orange)' : 'var(--blue)';
  b.style.color = type === 'warn' ? 'var(--orange)' : 'var(--text1)';
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.style.opacity = '0'; }, 2800);
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatContent(text) {
  // Простой форматтер: **bold**, `code`, новые строки → <p>
  return String(text)
    .split('\n\n')
    .map(p => `<p>${
      p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
       .replace(/`(.+?)`/g, '<code>$1</code>')
       .replace(/\n/g, '<br>')
    }</p>`)
    .join('');
}

// Простая подсветка Python без библиотеки (для блоков example)
function highlightPython(code) {
  const keywords = /\b(def|class|return|import|from|as|if|elif|else|for|while|in|not|and|or|is|None|True|False|pass|break|continue|try|except|finally|with|lambda|yield|global|nonlocal|del|raise|assert)\b/g;
  const builtins = /\b(print|input|len|range|str|int|float|list|dict|set|tuple|bool|type|isinstance|enumerate|zip|map|filter|sorted|reversed|sum|min|max|abs|round)\b/g;

  return esc(code)
    .replace(/(#.*)$/gm, '<span class="lp-cm">$1</span>')
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g,
      '<span class="lp-str">$1</span>')
    .replace(keywords, '<span class="lp-kw">$1</span>')
    .replace(builtins, '<span class="lp-builtin">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="lp-num">$1</span>');
}

// ─── DEMO LESSON (если нет Firestore) ─────────────────────────
function getDemoLesson() {
  return {
    id: 'demo',
    title: 'Айнымалылар — Demo',
    xp: 50,
    steps: [
      {
        type: 'theory',
        title: 'Айнымалы дегеніміз не?',
        content: `**Айнымалы** — бұл деректерді сақтайтын контейнер.\n\nPython-да айнымалыға мән беру өте қарапайым:\n\n\`name = "Мирас"\`\n\nМән кез келген типте болуы мүмкін: сан, мәтін, тізім.`,
      },
      {
        type: 'example',
        title: 'Код мысалы',
        description: 'Мынадай код жаздырсаң, экранда аты шығады:',
        code: 'name = "Мирас"\nage = 17\nprint(name)\nprint(age)',
        output: 'Мирас\n17',
      },
      {
        type: 'task',
        title: 'Өз айнымалыңды жаса',
        instruction: '`city` атты айнымалы жасап, `"Алматы"` мәнін бер. Экранға шығар.',
        starterCode: '# Осында жаз\ncity = \nprint(city)',
        expectedOutput: 'Алматы',
        hints: [
          'city = "Алматы" деп жаз',
          'print(city) функциясын қолдан',
        ],
      },
    ],
  };
}