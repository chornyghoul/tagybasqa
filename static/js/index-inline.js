// ═══════ Inline script block 1 ═══════
const canvas = document.getElementById("particle-field");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (canvas && !prefersReducedMotion) {
      const ctx = canvas.getContext("2d");
      let width = 0, height = 0, particles = [];
      class Particle {
        constructor() { this.reset(); }
        reset() { this.x = Math.random(); this.y = Math.random(); this.vx = (Math.random() - 0.5) * 0.0008; this.vy = (Math.random() - 0.5) * 0.0008; this.radius = Math.random() * 1.8 + 0.6; this.alpha = Math.random() * 0.6 + 0.4; }
        update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > 1) this.vx *= -1; if (this.y < 0 || this.y > 1) this.vy *= -1; }
      }
      function resize() { const dpr = window.devicePixelRatio || 1; width = window.innerWidth; height = window.innerHeight; canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function draw() { ctx.clearRect(0, 0, width, height); const ax = [], ay = []; particles.forEach((p, i) => { p.update(); const px = p.x * width; const py = p.y * height; ax[i] = px; ay[i] = py; ctx.beginPath(); ctx.fillStyle = `rgba(28,176,246,${p.alpha * 0.6})`; ctx.arc(px, py, p.radius, 0, Math.PI * 2); ctx.fill(); }); for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) { const dist = Math.hypot(ax[i] - ax[j], ay[i] - ay[j]); if (dist < 160) { ctx.beginPath(); ctx.strokeStyle = `rgba(28,176,246,${0.07 * (1 - dist / 160)})`; ctx.lineWidth = 0.7; ctx.moveTo(ax[i], ay[i]); ctx.lineTo(ax[j], ay[j]); ctx.stroke(); } } requestAnimationFrame(draw); }
      window.addEventListener("resize", resize);
      resize(); particles = Array.from({ length: 50 }, () => new Particle()); draw();
      setTimeout(() => { canvas.style.transition = "opacity 5s ease"; canvas.style.opacity = "0.4"; }, 800);
    }
    window.addEventListener('load', () => {
      setTimeout(() => { document.getElementById('global-preloader').classList.add('hidden'); }, 700);
    });

    // Закрытие модала профиля
    document.getElementById('closeProfileModal')?.addEventListener('click', () => {
      document.getElementById('editProfileModal').classList.remove('active');
    });
    document.getElementById('editProfileModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('editProfileModal')) document.getElementById('editProfileModal').classList.remove('active');
    });

    // ═══ ТАБЫ ИНТЕРАКТИВНЫХ УРОКОВ ═══
    document.querySelectorAll('.sl-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.slTab;
        document.querySelectorAll('.sl-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sl-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`sl-panel-${target}`)?.classList.add('active');
      });
    });

    // Быстрый переключатель вкладок из сайдбара
    window.switchToTab = function(viewId, tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
      const viewEl = document.getElementById(viewId);
      if (viewEl) viewEl.classList.add('active');
      const navBtn = document.querySelector(`[data-target="${viewId}"]`);
      if (navBtn) navBtn.classList.add('active');
      if (tabId) {
        setTimeout(() => {
          // Support both story-tab and sl-tab selectors
          document.querySelectorAll('.story-tab, .sl-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.story-panel, .sl-panel').forEach(p => p.classList.remove('active'));
          const targetTab = document.querySelector(`[data-story-tab="${tabId}"], [data-sl-tab="${tabId}"]`);
          if (targetTab) targetTab.classList.add('active');
          const panel = document.getElementById(`story-tab-${tabId}`) || document.getElementById(`sl-panel-${tabId}`);
          if (panel) panel.classList.add('active');
        }, 50);
      }
    };

    // Открытие Python Зертхана из режима урока
    window.switchToLab = function() {
      document.querySelectorAll('.sl-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sl-panel').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-sl-tab="lab"]')?.classList.add('active');
      document.getElementById('sl-panel-lab')?.classList.add('active');
    };

    // ═══ МОНОПОЛИЯ ═══
    window.openMonopoly = function() {
      window.open('./monopoly-classroom.html', '_blank');
    };

    // ═══ БЫСТРЫЙ ЗАПУСК СЕССИИ ═══
    window.quickStartSession = function() {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      const hub = document.getElementById('runningHub');
      if (!hub) return;
      hub.innerHTML = `
        <div style="background:var(--bg2);border:1.5px solid rgba(87,204,2,.25);border-radius:18px;padding:24px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
            <div style="width:10px;height:10px;border-radius:50%;background:var(--green);animation:livePulse 1.2s infinite"></div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--green);font-weight:700;text-transform:uppercase;letter-spacing:.12em">Сессия активна</div>
          </div>
          <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            <div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.15em;margin-bottom:8px">PIN для входа</div>
              <div style="font-family:var(--mono);font-size:48px;font-weight:700;color:var(--blue);letter-spacing:.2em;line-height:1">${pin}</div>
              <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:6px">tagybasqa.netlify.app/join</div>
            </div>
            <div style="flex:1;min-width:200px">
              <div style="font-size:13px;font-weight:800;margin-bottom:8px">Ожидание участников...</div>
              <div id="quickSessionPlayers" style="display:flex;flex-wrap:wrap;gap:8px;min-height:40px">
                <span style="font-family:var(--mono);font-size:11px;color:var(--text3)">Никто ещё не подключился</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0">
              <button onclick="openHostFromQuickSession('${pin}')" style="background:var(--blue);color:#fff;border:none;border-bottom:3px solid var(--blue2);padding:10px 20px;border-radius:var(--r3);font-family:var(--font);font-size:13px;font-weight:800;cursor:pointer">▶ Начать урок</button>
              <button onclick="navigator.clipboard.writeText('${pin}').then(()=>showToast('📋 PIN скопирован: ${pin}'))" style="background:transparent;border:1.5px solid var(--border2);color:var(--text2);padding:8px 20px;border-radius:var(--r3);font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer">📋 Скопировать PIN</button>
              <button onclick="endQuickSession()" style="background:transparent;border:1.5px solid rgba(255,75,75,.3);color:var(--red);padding:8px 20px;border-radius:var(--r3);font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer">⏹ Завершить</button>
            </div>
          </div>
        </div>`;

      // Simulate players joining
      const names = ['Алия','Дамир','Нурлан','Айгерим','Арман','Жанар','Берік','Мадина'];
      const emojis = ['😊','🦊','🐼','🦁','🐸','🦄','🐧','🦋'];
      let joined = 0;
      const interval = setInterval(() => {
        if (joined >= 4) { clearInterval(interval); return; }
        const playersEl = document.getElementById('quickSessionPlayers');
        if (!playersEl) { clearInterval(interval); return; }
        const name = names[Math.floor(Math.random() * names.length)];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        playersEl.innerHTML += `<div style="display:inline-flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--border2);border-radius:99px;padding:5px 12px;font-size:12px;font-weight:700;animation:chipIn .3s ease">${emoji} ${name}</div>`;
        joined++;
        if (joined === 1) playersEl.querySelector('span')?.remove();
      }, 2200);
    };

    window.openHostFromQuickSession = function(pin) {
      window.open('./live-lesson.html?pin=' + pin, '_blank');
    };

    window.endQuickSession = function() {
      const hub = document.getElementById('runningHub');
      if (hub) hub.innerHTML = `<div style="text-align:center;padding:40px;border:2px dashed var(--border2);border-radius:16px"><div style="font-size:48px;margin-bottom:14px">📡</div><div style="font-size:16px;font-weight:800;margin-bottom:6px">Белсенді сессиялар жоқ</div><div style="font-size:12px;color:var(--text3);font-family:var(--mono);line-height:1.6;max-width:340px;margin:0 auto 20px">Создайте быструю сессию выше или запустите открытый урок из карточки в «Менің сабақтарым»</div></div>`;
    };

    // Функция запуска открытого урока из карточки
    window.launchOpenLesson = function(lessonId) {
      window.open('./live-lesson.html?id=' + lessonId, '_blank');
    };

    // Анимация
    const style = document.createElement('style');
    style.textContent = `
      @keyframes livePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.6} }
      @keyframes chipIn { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    `;
    document.head.appendChild(style);

    // ═══ УПРАЖНЕНИЯ — РАСКРЫТИЕ ═══
    window.toggleExercise = function(el) {
      const wasExpanded = el.classList.contains('expanded');
      document.querySelectorAll('.sl-exercise').forEach(e => e.classList.remove('expanded'));
      if (!wasExpanded) el.classList.add('expanded');
    };

    // ═══ ЗАПУСК КОДА (симуляция Pyodide) ═══
    window.runCode = function(btn) {
      const editor = btn.closest('.sl-code-editor');
      const textarea = editor.querySelector('.sl-editor-area');
      const exercise = editor.closest('.sl-exercise');
      const outId = textarea.closest('.sl-exercise').querySelector('.sl-output')?.id;

      btn.textContent = '⏳';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '▶ Запустить';
        btn.disabled = false;

        const code = textarea.value;
        const output = simulatePython(code);
        const outEl = exercise.querySelector('.sl-output');
        if (outEl) {
          outEl.innerHTML = output;
          exercise.classList.add('has-output');
        }
      }, 600);
    };

    // Упрощённая симуляция вывода Python для демо
    function simulatePython(code) {
      const lines = [];
      const prints = [...code.matchAll(/print\(([^)]+)\)/g)];

      if (prints.length === 0) return '<span style="color:var(--text3);">// Нет вывода — добавьте print()</span>';

      // Извлекаем f-строки и простые строки
      for (const match of prints) {
        let arg = match[1].trim();
        // f-string
        if (arg.startsWith('f"') || arg.startsWith("f'")) {
          arg = arg.replace(/^f["']|["']$/g, '');
          // Заменяем {name} → значение переменной из кода
          arg = arg.replace(/\{([^}]+)\}/g, (_, expr) => {
            // Простая замена переменных
            const varMatch = code.match(new RegExp(`${expr}\\s*=\\s*["']?([^"'\n]+)["']?`));
            return varMatch ? varMatch[1].replace(/["']/g,'') : expr;
          });
          lines.push(arg);
        } else if (arg.startsWith('"') || arg.startsWith("'")) {
          lines.push(arg.replace(/^["']|["']$/g, ''));
        } else {
          lines.push(`→ ${arg}`);
        }
      }

      return lines.map(l => `<div>${l}</div>`).join('') || '<span style="color:var(--text3);">Запуск завершён</span>';
    }

    window.resetCode = function(btn) {
      const textarea = btn.closest('.sl-code-editor').querySelector('.sl-editor-area');
      textarea.value = textarea.dataset.default || '';
      const exercise = btn.closest('.sl-exercise');
      const outEl = exercise.querySelector('.sl-output');
      if (outEl) { outEl.innerHTML = ''; exercise.classList.remove('has-output'); }
    };

    // ═══ ФИЛЬТРЫ КАТЕГОРИЙ LAB ═══
    document.querySelectorAll('[data-lab-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lab-cat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.labCat;
        document.querySelectorAll('.sl-exercise').forEach(ex => {
          ex.style.display = (cat === 'all' || ex.dataset.cat === cat) ? '' : 'none';
        });
      });
    });

    // Drag & Drop для материалов
    const dropZone = document.getElementById('docsDropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    }

// ═══════ Inline script block 2 ═══════
// Перехватываем lessonHubCard после загрузки main.js
  window.addEventListener('load', () => {
    // Добавляем кнопку "Ашық сабақ" в каждую карточку через делегирование
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lesson-hub-open-btn');
      if (btn) {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (id) window.open('./live-lesson.html?id=' + id, '_blank');
      }
    });

    // Патчим lessonHubCard чтобы добавить кнопку открытого урока
    // Ждём пока main.js экспортирует глобальный lessonHubCard
    const origRender = window.renderLessonsGrid;
    if (typeof origRender === 'function') return; // уже пропатчено

    // Следим за появлением карточек и патчим кнопку в footer
    const obs = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          const cards = node.matches?.('.lesson-hub-card')
            ? [node]
            : [...(node.querySelectorAll?.('.lesson-hub-card') || [])];
          cards.forEach(card => {
            if (card.dataset.patched) return;
            card.dataset.patched = '1';
            const footer = card.querySelector('.lesson-hub-footer');
            const runBtn = card.querySelector('.lesson-hub-run-btn');
            if (!footer || !runBtn) return;

            // Получаем ID из onclick кнопки запуска
            const onclick = runBtn.getAttribute('onclick') || '';
            const match = onclick.match(/viewLesson\('([^']+)'\)/);
            const lessonId = match?.[1];
            if (!lessonId) return;

            // Добавляем кнопку открытого урока
            const openBtn = document.createElement('button');
            openBtn.className = 'lesson-hub-open-btn';
            openBtn.dataset.id = lessonId;
            openBtn.title = 'Провести открытый урок';
            openBtn.innerHTML = '📡';
            openBtn.style.cssText = `
              display:inline-flex;align-items:center;justify-content:center;
              width:32px;height:32px;background:rgba(87,204,2,.1);
              border:1.5px solid rgba(87,204,2,.25);border-radius:8px;
              font-size:14px;cursor:pointer;transition:all .15s;flex-shrink:0;
            `;
            openBtn.onmouseover = () => { openBtn.style.background='var(--green)'; };
            openBtn.onmouseout  = () => { openBtn.style.background='rgba(87,204,2,.1)'; };

            const btns = card.querySelector('.lesson-hub-btns');
            if (btns) btns.insertBefore(openBtn, btns.firstChild);
          });
        });
      });
    });

    obs.observe(document.body, { childList: true, subtree: true });
  });