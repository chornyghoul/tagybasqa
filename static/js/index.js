// ════════════════════════════════════════════════════════════
//  Tagybasqa — Gemini API Proxy
//  Скрывает ключ Gemini от браузера. Фронтенд стучится сюда,
//  сервер сам прикладывает ключ и шлёт запрос в Google.
// ════════════════════════════════════════════════════════════
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// Ключ читается ТОЛЬКО из переменной окружения. Никогда не хардкодить.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY не задан! Генерация квизов не будет работать.');
  console.warn('    Задайте его в .env или переменных окружения контейнера.');
}

// Разрешённые модели — белый список, чтобы фронтенд не мог попросить что угодно
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
]);

app.use(express.json({ limit: '2mb' }));

// Раздаём статику платформы
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// ── Простой rate-limit на IP (защита от спама генерации) ──────
const hits = new Map();
function rateLimit(req, res, next) {
  const ip  = req.ip;
  const now = Date.now();
  const win = 60_000;     // 1 минута
  const max = 20;         // 20 запросов в минуту на IP
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  if (arr.length >= max) {
    return res.status(429).json({ error: { message: 'Тым жиі сұрау. Күте тұрыңыз.' } });
  }
  arr.push(now);
  hits.set(ip, arr);
  next();
}

// ── Proxy endpoint ──────────────────────────────────────────
// Фронтенд шлёт: POST /api/gemini/:model  { contents, generationConfig }
app.post('/api/gemini/:model', rateLimit, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: { message: 'Сервер ключі орнатылмаған (GEMINI_API_KEY жоқ)' } });
    }

    const model = req.params.model;
    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: { message: 'Бұл модельге рұқсат жоқ' } });
    }

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: { message: 'Proxy қатесі: ' + err.message } });
  }
});

// Health-check для docker-compose / балансировщика
app.get('/healthz', (req, res) => res.json({ ok: true, hasKey: !!GEMINI_API_KEY }));

app.listen(PORT, () => {
  console.log(`✅ Tagybasqa сервер ${PORT} портында іске қосылды`);
  console.log(`   Gemini ключ: ${GEMINI_API_KEY ? 'орнатылған ✓' : 'ЖОҚ ⚠️'}`);
});