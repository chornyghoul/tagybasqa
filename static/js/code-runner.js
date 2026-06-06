/**
 * TAGYBASQA — code-runner.js
 * ═══════════════════════════════════════════════════════
 * Встроенная среда выполнения кода прямо в уроках.
 *
 * Возможности:
 *  — Python через Pyodide (WebAssembly, реальный CPython)
 *  — JavaScript через iframe sandbox
 *  — Автодополнение ключевых слов
 *  — Подсветка синтаксиса (highlight.js)
 *  — Запуск по Ctrl+Enter
 *  — История вывода
 *  — Сохранение кода в localStorage
 *
 * Подключение в index.html перед </body>:
 *   <script src="./static/js/code-runner.js"></script>
 *
 * Автоматически активируется для всех элементов с классом:
 *   .code-editor-inp  (textarea с атрибутом data-lang="python"|"javascript")
 *   .run-code-btn     (кнопка рядом с textarea)
 * ═══════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── Состояние Pyodide ──────────────────────────────────────────
  let _pyodide = null;
  let _pyodideLoading = false;
  let _pyodideCallbacks = [];

  // ── Загрузка Pyodide (один раз лениво) ────────────────────────
  async function getPyodide() {
    if (_pyodide) return _pyodide;
    if (_pyodideLoading) {
      return new Promise(res => _pyodideCallbacks.push(res));
    }
    _pyodideLoading = true;

    // Загружаем скрипт Pyodide
    if (!window.loadPyodide) {
      await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
    }

    try {
      _pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
        stdout: () => {},
        stderr: () => {},
      });
      // Перехват stdout/stderr
      await _pyodide.runPythonAsync(`
import sys, io
class _Capture(io.StringIO):
    pass
sys.stdout = _Capture()
sys.stderr = _Capture()
      `);
    } catch (e) {
      console.warn('Pyodide load error:', e);
    }

    _pyodideCallbacks.forEach(cb => cb(_pyodide));
    _pyodideCallbacks = [];
    return _pyodide;
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // ── Запуск Python ──────────────────────────────────────────────
  async function runPython(code) {
    let py;
    try {
      py = await getPyodide();
    } catch (e) {
      return { output: '', error: 'Не удалось загрузить Python. Проверьте соединение.' };
    }
    if (!py) return { output: '', error: 'Pyodide недоступен.' };

    try {
      // Сброс буферов
      await py.runPythonAsync(`
import sys
sys.stdout.truncate(0); sys.stdout.seek(0)
sys.stderr.truncate(0); sys.stderr.seek(0)
      `);

      await py.runPythonAsync(code);

      const stdout = await py.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await py.runPythonAsync('sys.stderr.getvalue()');
      return { output: stdout || '', error: stderr || '' };
    } catch (e) {
      return { output: '', error: e.message || String(e) };
    }
  }

  // ── Запуск JavaScript ─────────────────────────────────────────
  function runJavaScript(code) {
    return new Promise(resolve => {
      const logs = [];
      const errors = [];

      const sandbox = document.createElement('iframe');
      sandbox.style.display = 'none';
      sandbox.sandbox = 'allow-scripts';
      document.body.appendChild(sandbox);

      const timeout = setTimeout(() => {
        sandbox.remove();
        resolve({ output: logs.join('\n'), error: '⏱ Превышено время выполнения (5с)' });
      }, 5000);

      window._jsRunnerCb = (type, args) => {
        if (type === 'log')   logs.push(args.join(' '));
        if (type === 'error') errors.push(args.join(' '));
        if (type === 'done') {
          clearTimeout(timeout);
          sandbox.remove();
          delete window._jsRunnerCb;
          resolve({ output: logs.join('\n'), error: errors.join('\n') });
        }
      };

      const escaped = code.replace(/`/g, '\\`').replace(/\\/g, '\\\\');
      sandbox.srcdoc = `
<script>
const _log = console.log.bind(console);
const _err = console.error.bind(console);
console.log = (...a) => { parent._jsRunnerCb && parent._jsRunnerCb('log', a.map(String)); _log(...a); };
console.error = (...a) => { parent._jsRunnerCb && parent._jsRunnerCb('error', a.map(String)); _err(...a); };
window.onerror = (msg) => { parent._jsRunnerCb && parent._jsRunnerCb('error', [msg]); parent._jsRunnerCb && parent._jsRunnerCb('done',[]); return true; };
try {
  eval(\`${escaped}\`);
} catch(e) {
  console.error(e.message);
}
parent._jsRunnerCb && parent._jsRunnerCb('done', []);
<\/script>`;
    });
  }

  // ── Главная функция запуска ────────────────────────────────────
  async function executeCode(lang, code, outputEl, runBtn) {
    if (!code.trim()) return;

    const originalText = runBtn ? runBtn.textContent : '';
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = '⏳ Выполняю...'; }
    if (outputEl) {
      outputEl.style.display = 'block';
      outputEl.innerHTML = `<span style="color:var(--text3,#7a9aaa)">⏳ Запускаю ${lang === 'python' ? 'Python' : 'JavaScript'}...</span>`;
    }

    let result;
    try {
      if (lang === 'python' || lang === 'py') {
        result = await runPython(code);
      } else if (lang === 'javascript' || lang === 'js') {
        result = await runJavaScript(code);
      } else {
        result = { output: '', error: `Язык "${lang}" не поддерживается. Доступно: python, javascript` };
      }
    } catch (e) {
      result = { output: '', error: e.message };
    }

    if (runBtn) { runBtn.disabled = false; runBtn.textContent = originalText; }

    if (outputEl) {
      outputEl.style.display = 'block';
      let html = '';

      if (result.output) {
        html += `<div class="cr-output-ok">${escHtml(result.output)}</div>`;
      }
      if (result.error) {
        html += `<div class="cr-output-err">${escHtml(result.error)}</div>`;
      }
      if (!result.output && !result.error) {
        html = `<span style="color:var(--text3,#7a9aaa)">✓ Выполнено (нет вывода)</span>`;
      }

      outputEl.innerHTML = html;
    }

    return result;
  }

  // ── Подсветка синтаксиса ───────────────────────────────────────
  let _hlReady = false;
  async function ensureHighlight() {
    if (_hlReady || window.hljs) { _hlReady = true; return; }
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js');
    // CSS
    if (!document.getElementById('hljs-css')) {
      const link = document.createElement('link');
      link.id = 'hljs-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
      document.head.appendChild(link);
    }
    _hlReady = true;
  }

  function highlightElement(el) {
    if (window.hljs) window.hljs.highlightElement(el);
  }

  // ── Upgrade: превращает .code-editor-inp + .run-code-btn в IDE ─
  function upgradeCodeBlock(textarea, runBtn, outputEl) {
    const lang = textarea.dataset.lang || textarea.dataset.language || 'python';
    const blockId = 'cr-' + Math.random().toString(36).slice(2, 8);

    // Создаём обёртку
    const wrapper = document.createElement('div');
    wrapper.className = 'cr-wrapper';
    wrapper.setAttribute('data-lang', lang);
    textarea.parentNode.insertBefore(wrapper, textarea);

    // Шапка редактора
    const header = document.createElement('div');
    header.className = 'cr-header';
    header.innerHTML = `
      <div class="cr-lang-badge">${lang === 'python' ? '🐍 Python' : '⚡ JS'}</div>
      <div class="cr-header-actions">
        <button class="cr-copy-btn" title="Копировать код">📋</button>
        <button class="cr-clear-btn" title="Очистить">🗑️</button>
        <button class="cr-run-btn" title="Ctrl+Enter">▶ Запустить</button>
      </div>
    `;

    // Подсвеченный код + textarea поверх него
    const editorWrap = document.createElement('div');
    editorWrap.className = 'cr-editor-wrap';

    const pre = document.createElement('pre');
    pre.className = 'cr-highlight';
    const code = document.createElement('code');
    code.className = `language-${lang}`;
    code.textContent = textarea.value;
    pre.appendChild(code);

    const ta = textarea.cloneNode(true);
    ta.className = 'cr-textarea';
    ta.id = blockId;
    ta.spellcheck = false;
    ta.autocomplete = 'off';
    ta.autocorrect = 'off';
    ta.autocapitalize = 'off';

    editorWrap.appendChild(pre);
    editorWrap.appendChild(ta);

    // Вывод
    const output = document.createElement('div');
    output.className = 'cr-output';
    output.style.display = 'none';

    wrapper.appendChild(header);
    wrapper.appendChild(editorWrap);
    wrapper.appendChild(output);

    // Убрать оригиналы
    textarea.remove();
    runBtn?.remove();
    outputEl?.remove();

    // Подсветка при вводе
    async function syncHighlight() {
      await ensureHighlight();
      code.textContent = ta.value;
      highlightElement(code);
    }
    syncHighlight();

    ta.addEventListener('input', syncHighlight);
    ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; });

    // Синхронизация скролла
    ta.addEventListener('input', () => {
      // Авторесайз
      ta.style.height = 'auto';
      ta.style.height = Math.max(120, ta.scrollHeight) + 'px';
      pre.style.height = ta.style.height;
    });

    // Ctrl+Enter для запуска
    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeCode(lang, ta.value, output, header.querySelector('.cr-run-btn'));
      }
      // Tab → 4 пробела
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 4;
        syncHighlight();
      }
    });

    // Кнопка запуска
    header.querySelector('.cr-run-btn').addEventListener('click', () => {
      executeCode(lang, ta.value, output, header.querySelector('.cr-run-btn'));
    });

    // Копировать
    header.querySelector('.cr-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(ta.value).then(() => {
        const btn = header.querySelector('.cr-copy-btn');
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '📋', 1500);
      });
    });

    // Очистить
    header.querySelector('.cr-clear-btn').addEventListener('click', () => {
      ta.value = '';
      code.textContent = '';
      output.style.display = 'none';
    });

    return wrapper;
  }

  // ── Глобальная функция запуска для кнопок в lesson.html ────────
  window.runCode = async function (btnEl) {
    const block = btnEl.closest('.block-card, .lesson-block, [data-code-block]');
    if (!block) return;

    const ta = block.querySelector('.code-editor-inp, .cr-textarea');
    let outEl = block.querySelector('.terminal-out, .cr-output');
    if (!outEl) {
      outEl = document.createElement('div');
      outEl.className = 'terminal-out cr-output';
      ta.parentNode.insertBefore(outEl, ta.nextSibling);
    }

    const lang = ta.dataset.lang || ta.dataset.language
      || (ta.closest('[data-lang]')?.dataset.lang)
      || 'python';

    await executeCode(lang, ta.value, outEl, btnEl);
  };

  // ── Автоматический апгрейд всех textarea на странице ────────────
  function upgradeAll() {
    document.querySelectorAll('.code-editor-inp').forEach(ta => {
      if (ta.closest('.cr-wrapper')) return; // уже апгрейдили
      const runBtn = ta.parentElement?.querySelector('.run-code-btn');
      const outEl = ta.parentElement?.querySelector('.terminal-out');
      upgradeCodeBlock(ta, runBtn, outEl);
    });
  }

  // Запустить при загрузке и при изменениях DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeAll);
  } else {
    upgradeAll();
  }

  // MutationObserver для динамически добавленных блоков
  const observer = new MutationObserver(() => upgradeAll());
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Утилиты ──────────────────────────────────────────────────
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Стили ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'code-runner-styles';
  style.textContent = `
  /* ── Обёртка IDE ── */
  .cr-wrapper {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.12);
    background: #0d1b24;
    margin: 10px 0;
    font-size: 0;
  }

  /* ── Шапка ── */
  .cr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #162330;
    border-bottom: 1px solid rgba(255,255,255,.08);
    font-size: 13px;
  }
  .cr-lang-badge {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #7a9aaa;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .cr-header-actions { display: flex; gap: 6px; align-items: center; }

  .cr-run-btn {
    background: #57cc02;
    border: none;
    border-bottom: 2px solid #3a8c01;
    color: #000;
    padding: 6px 14px;
    border-radius: 99px;
    font-family: var(--font, 'Nunito', sans-serif);
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    transition: filter .15s;
  }
  .cr-run-btn:hover { filter: brightness(1.1); }
  .cr-run-btn:disabled { opacity: .5; cursor: default; }

  .cr-copy-btn, .cr-clear-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,.1);
    color: #7a9aaa;
    padding: 5px 9px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all .15s;
  }
  .cr-copy-btn:hover, .cr-clear-btn:hover {
    border-color: rgba(255,255,255,.25);
    color: #fff;
  }

  /* ── Редактор ── */
  .cr-editor-wrap {
    position: relative;
    min-height: 120px;
  }
  .cr-highlight {
    position: absolute;
    inset: 0;
    margin: 0 !important;
    padding: 14px 16px !important;
    background: transparent !important;
    border-radius: 0 !important;
    overflow: auto;
    pointer-events: none;
    font-size: 13px !important;
    line-height: 1.65 !important;
    tab-size: 4;
    font-family: 'DM Mono', 'Fira Code', monospace !important;
  }
  .cr-highlight code {
    font-family: inherit !important;
    background: none !important;
    padding: 0 !important;
    white-space: pre !important;
  }
  .cr-textarea {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 120px;
    background: transparent;
    color: transparent;
    caret-color: #fff;
    border: none;
    outline: none;
    resize: none;
    padding: 14px 16px;
    font-family: 'DM Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.65;
    tab-size: 4;
    overflow: hidden;
  }
  .cr-textarea::selection { background: rgba(28,176,246,.3); color: transparent; }

  /* ── Вывод ── */
  .cr-output {
    background: #050d14;
    border-top: 1px solid rgba(255,255,255,.08);
    padding: 12px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }
  .cr-output-ok { color: #57cc02; }
  .cr-output-err {
    color: #ff4b4b;
    background: rgba(255,75,75,.08);
    border-radius: 6px;
    padding: 6px 10px;
    margin-top: 4px;
  }

  /* ── Исправление для terminal-out ── */
  .terminal-out {
    display: block !important;
    background: #050d14;
    border-top: 1px solid rgba(255,255,255,.08);
    padding: 12px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #57cc02;
    line-height: 1.6;
    white-space: pre-wrap;
    border-radius: 0 0 12px 12px;
  }

  /* ── Кнопка запуска (старый стиль) ── */
  .run-code-btn {
    background: #57cc02 !important;
    border: none !important;
    border-bottom: 2px solid #3a8c01 !important;
    color: #000 !important;
    padding: 8px 18px !important;
    border-radius: 99px !important;
    font-weight: 800 !important;
    cursor: pointer !important;
    font-size: 13px !important;
    transition: filter .15s !important;
    margin-top: 8px !important;
  }
  .run-code-btn:hover { filter: brightness(1.1) !important; }

  /* ── Индикатор загрузки Pyodide ── */
  .cr-pyodide-loading {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1a2d35;
    border: 1px solid rgba(28,176,246,.3);
    border-radius: 10px;
    padding: 10px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #1cb0f6;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: cr-slide-in .3s ease;
  }
  .cr-py-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(28,176,246,.3);
    border-top-color: #1cb0f6;
    border-radius: 50%;
    animation: cr-spin .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes cr-spin { to { transform: rotate(360deg) } }
  @keyframes cr-slide-in { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  `;
  document.head.appendChild(style);

  // ── Показать уведомление при первой загрузке Python ────────────
  const origGetPy = getPyodide;
  let _pyNotified = false;
  async function getPyodideWithNotify() {
    if (_pyodide) return _pyodide;
    if (!_pyNotified) {
      _pyNotified = true;
      const notif = document.createElement('div');
      notif.className = 'cr-pyodide-loading';
      notif.id = 'cr-py-notif';
      notif.innerHTML = '<div class="cr-py-spinner"></div><span>Загружаю Python (≈5 МБ, один раз)...</span>';
      document.body.appendChild(notif);
    }
    const py = await origGetPy();
    document.getElementById('cr-py-notif')?.remove();
    return py;
  }
  // Переопределяем
  window._tgbRunPython = runPython;
  window._tgbRunJS = runJavaScript;
  window._tgbExecute = executeCode;

  console.log('[Tagybasqa] code-runner.js loaded ✓');
})();