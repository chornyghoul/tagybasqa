/**
 * TAGYBASQA — interactive-lessons.js
 *
 * Полноценный раздел "Интерактивные уроки" для изучения казахского языка.
 *
 * Архитектура модуля:
 *  — Каталог уроков с уровнями (A1 → C1)
 *  — 6 типов упражнений: flashcard, matching, fill-blank, listening, sentence-builder, quiz
 *  — Система XP, стриков и прогресса
 *  — AI-генерация уроков через Claude API
 *  — Полная анимация и gamification
 *
 * Подключение в index.html:
 *   <script type="module" src="./static/js/interactive-lessons.js"></script>
 *
 * В lesson.js замените import "./lecture-player.js" на import "./interactive-lessons.js"
 * (или добавьте рядом).
 */

// ─── Константы ────────────────────────────────────────────────────────────────
const CONTAINER_SEL = '#view-story .lesson-container';

// ─── XP и прогресс (localStorage) ────────────────────────────────────────────
function getProgress() {
  try { return JSON.parse(localStorage.getItem('tagybasqa_progress') || '{}'); }
  catch { return {}; }
}
function saveProgress(data) {
  try { localStorage.setItem('tagybasqa_progress', JSON.stringify(data)); }
  catch {}
}
function addXP(amount) {
  const p = getProgress();
  p.xp = (p.xp || 0) + amount;
  p.streak = p.streak || 0;
  const today = new Date().toDateString();
  if (p.lastActiveDay !== today) {
    p.streak = (p.lastActiveDay === new Date(Date.now() - 86400000).toDateString())
      ? p.streak + 1 : 1;
    p.lastActiveDay = today;
  }
  saveProgress(p);
  return p;
}
function markLessonDone(lessonId, stars) {
  const p = getProgress();
  if (!p.lessons) p.lessons = {};
  const prev = p.lessons[lessonId];
  p.lessons[lessonId] = { stars: Math.max(stars, prev?.stars || 0), done: true };
  saveProgress(p);
}
function getLessonStars(lessonId) {
  return getProgress().lessons?.[lessonId]?.stars || 0;
}

// ─── Данные уроков ────────────────────────────────────────────────────────────
const LESSONS = [
  // ── РАЗДЕЛ 1: ОСНОВЫ ──────────────────────────────────────────────────────
  {
    id: 'l1', section: 'Алфавит и приветствия', sectionOrder: 1,
    title: 'Казахский алфавит', emoji: '🔤', level: 'A1', xp: 15,
    desc: 'Изучи 42 буквы нового казахского алфавита и их произношение',
    exercises: [
      {
        type: 'flashcard',
        title: 'Буквы алфавита',
        cards: [
          { front: 'A a', back: '[а] — как в слове "мама"', example: 'Аqша — деньги' },
          { front: 'Á á', back: '[ä] — мягкое "а"', example: 'Ána — мама' },
          { front: 'B b', back: '[б]', example: 'Bala — ребёнок' },
          { front: 'D d', back: '[д]', example: 'Dos — друг' },
          { front: 'E e', back: '[э/е]', example: 'El — страна/народ' },
          { front: 'F f', back: '[ф] — в заимств. словах', example: 'Film — фильм' },
          { front: 'G g', back: '[г]', example: 'Gúl — цветок' },
          { front: 'Ǵ ǵ', back: '[ğ] — заднеязычное', example: 'Aǵa — старший брат' },
          { front: 'H h', back: '[х/h]', example: 'Hárf — буква' },
          { front: 'I i', back: '[і] — краткое "и"', example: 'Іni — младший брат' },
        ]
      },
      {
        type: 'quiz',
        title: 'Проверь себя: буквы',
        questions: [
          { q: 'Какой звук передаёт буква Á á?', opts: ['[а]', '[ä] мягкое', '[о]', '[у]'], correct: 1, exp: 'Á — мягкий передний звук, похожий на "а" в слове "пять"' },
          { q: 'Как произносится буква Ǵ ǵ?', opts: ['[г]', '[к]', '[ğ] заднеязычный', '[х]'], correct: 2, exp: 'Ǵ — особый казахский заднеязычный согласный' },
          { q: 'Сколько букв в казахском алфавите?', opts: ['26', '33', '42', '38'], correct: 2, exp: 'Латинский казахский алфавит содержит 42 буквы' },
        ]
      }
    ]
  },
  {
    id: 'l2', section: 'Алфавит и приветствия', sectionOrder: 1,
    title: 'Приветствия', emoji: '👋', level: 'A1', xp: 20,
    desc: 'Научись здороваться, прощаться и спрашивать как дела',
    exercises: [
      {
        type: 'flashcard',
        title: 'Базовые приветствия',
        cards: [
          { front: 'Sálem!', back: 'Привет! (неформально)', example: 'Sálem, qalaiсыñ?' },
          { front: 'Assalawmaǵalaiqim!', back: 'Здравствуйте! (исламское)', example: 'Уважительное приветствие' },
          { front: 'Qalaisyñ?', back: 'Как ты? (неформально)', example: 'Sálem! Qalaisyñ?' },
          { front: 'Qalaısyz?', back: 'Как вы? (формально)', example: 'К старшим и незнакомым' },
          { front: 'Jaqsy!', back: 'Хорошо!', example: '— Qalaisyñ? — Jaqsy!' },
          { front: 'Sáu bol!', back: 'Пока! / До свидания!', example: 'При расставании' },
          { front: 'Keşe', back: 'Вечер', example: 'Keşe jaqsy! — Добрый вечер!' },
          { front: 'Tañ', back: 'Утро', example: 'Tañ jaqsy! — Доброе утро!' },
        ]
      },
      {
        type: 'matching',
        title: 'Соедини пары',
        pairs: [
          { kaz: 'Sálem!', rus: 'Привет!' },
          { kaz: 'Jaqsy!', rus: 'Хорошо!' },
          { kaz: 'Sáu bol!', rus: 'Пока!' },
          { kaz: 'Qalaisyñ?', rus: 'Как ты?' },
          { kaz: 'Tañ jaqsy!', rus: 'Доброе утро!' },
          { kaz: 'Keşe jaqsy!', rus: 'Добрый вечер!' },
        ]
      },
      {
        type: 'fill-blank',
        title: 'Заполни пробел',
        sentences: [
          { parts: ['— _____, qalaisyñ?\n— Jaqsy, raqmet!'], blank: 0, answer: 'Sálem', hint: 'Неформальное приветствие', options: ['Sálem', 'Sáu bol', 'Jaqsy', 'Keşe'] },
          { parts: ['Kешке: "_____!"'], blank: 0, answer: 'Keşe jaqsy', hint: 'Пожелание доброго вечера', options: ['Tañ jaqsy', 'Keşe jaqsy', 'Sálem', 'Sáu bol'] },
          { parts: ['При прощании говорят: "_____!"'], blank: 0, answer: 'Sáu bol', hint: 'Два слова', options: ['Jaqsy', 'Sálem', 'Sáu bol', 'Raqmet'] },
        ]
      }
    ]
  },
  {
    id: 'l3', section: 'Числа и цвета', sectionOrder: 2,
    title: 'Числа 1–20', emoji: '🔢', level: 'A1', xp: 20,
    desc: 'Научись считать на казахском до 20',
    exercises: [
      {
        type: 'flashcard',
        title: 'Числа от 1 до 10',
        cards: [
          { front: 'Bir', back: '1 — один', example: 'Bir alma — одно яблоко' },
          { front: 'Eki', back: '2 — два', example: 'Eki kún — два дня' },
          { front: 'Úsh', back: '3 — три', example: 'Úsh dós — три друга' },
          { front: 'Tórt', back: '4 — четыре', example: 'Tórt mevsiym — 4 сезона' },
          { front: 'Bes', back: '5 — пять', example: 'Bes barmaǵ — 5 пальцев' },
          { front: 'Alty', back: '6 — шесть', example: 'Alty kún — 6 дней' },
          { front: 'Jeti', back: '7 — семь', example: 'Jeti qundyz — 7 бобров' },
          { front: 'Segiz', back: '8 — восемь', example: 'Segiz saǵat — 8 часов' },
          { front: 'Toǵyz', back: '9 — девять', example: 'Toǵyz ay — 9 месяцев' },
          { front: 'On', back: '10 — десять', example: 'On jyl — 10 лет' },
        ]
      },
      {
        type: 'sentence-builder',
        title: 'Составь фразу',
        sentences: [
          { words: ['Menде', 'eki', 'kitap', 'bar.'], translation: 'У меня есть две книги.', shuffled: ['bar.', 'kitap', 'eki', 'Menде'] },
          { words: ['Úsh', 'dos', 'keldi.'], translation: 'Пришли три друга.', shuffled: ['keldi.', 'Úsh', 'dos'] },
          { words: ['On', 'bir', 'oqyshylar', 'bar.'], translation: 'Есть одиннадцать учеников.', shuffled: ['bar.', 'bir', 'On', 'oqyshylar'] },
        ]
      },
      {
        type: 'quiz',
        title: 'Числовой квиз',
        questions: [
          { q: 'Как будет "семь" по-казахски?', opts: ['Segiz', 'Alty', 'Jeti', 'Bes'], correct: 2, exp: 'Jeti = 7. Bes=5, Alty=6, Segiz=8' },
          { q: 'Сколько это: Tórt + Bes?', opts: ['8', '9', '10', '7'], correct: 1, exp: 'Tórt(4) + Bes(5) = Toǵyz(9)' },
          { q: '"On eki" — это:', opts: ['10', '11', '12', '20'], correct: 2, exp: 'On(10) + Eki(2) = 12' },
        ]
      }
    ]
  },
  {
    id: 'l4', section: 'Числа и цвета', sectionOrder: 2,
    title: 'Цвета', emoji: '🎨', level: 'A1', xp: 20,
    desc: 'Выучи основные цвета на казахском',
    exercises: [
      {
        type: 'flashcard',
        title: 'Основные цвета',
        cards: [
          { front: 'Qyzyl', back: '🔴 Красный', example: 'Qyzyl gúl — красный цветок' },
          { front: 'Kók', back: '🔵 Синий / Голубой / Зелёный', example: 'Kók aspan — синее небо' },
          { front: 'Jasyл', back: '🟢 Зелёный (трава)', example: 'Jasyl shóp — зелёная трава' },
          { front: 'Sary', back: '🟡 Жёлтый', example: 'Sary kún — жёлтое солнце' },
          { front: 'Aq', back: '⬜ Белый', example: 'Aq qar — белый снег' },
          { front: 'Qara', back: '⬛ Чёрный', example: 'Qara tún — чёрная ночь' },
          { front: 'Qoñyr', back: '🟤 Коричневый', example: 'Qoñyr ay — бурый медведь' },
          { front: 'Qyzgyltsary', back: '🟠 Оранжевый', example: 'Qyzgyltsary apelsin' },
        ]
      },
      {
        type: 'matching',
        title: 'Цвета: соедини пары',
        pairs: [
          { kaz: 'Qyzyl', rus: '🔴 Красный' },
          { kaz: 'Aq', rus: '⬜ Белый' },
          { kaz: 'Qara', rus: '⬛ Чёрный' },
          { kaz: 'Sary', rus: '🟡 Жёлтый' },
          { kaz: 'Jasyl', rus: '🟢 Зелёный' },
          { kaz: 'Kók', rus: '🔵 Синий' },
        ]
      }
    ]
  },
  // ── РАЗДЕЛ 2: СЕМЬЯ И ЛЮДИ ────────────────────────────────────────────────
  {
    id: 'l5', section: 'Семья и люди', sectionOrder: 3,
    title: 'Семья', emoji: '👨‍👩‍👧', level: 'A2', xp: 25,
    desc: 'Слова для описания членов семьи по-казахски',
    exercises: [
      {
        type: 'flashcard',
        title: 'Члены семьи',
        cards: [
          { front: 'Áke', back: 'Отец', example: 'Menіñ ákem — мой отец' },
          { front: 'Ana', back: 'Мать', example: 'Seniñ anaña sálem! — Привет маме!' },
          { front: 'Aǵa', back: 'Старший брат', example: 'Aǵam keldi — мой старший брат пришёл' },
          { front: 'Áпке', back: 'Старшая сестра', example: 'Ápkem oqyshы — моя сестра учится' },
          { front: 'Ini', back: 'Младший брат', example: 'Inim úyде — мой брат дома' },
          { front: 'Sinlim', back: 'Младшая сестра', example: 'Sinlim kishi — сестра маленькая' },
          { front: 'Ata', back: 'Дедушка', example: 'Atam aqyldy — дед мудрый' },
          { front: 'Áje', back: 'Бабушка', example: 'Ájem jaqsy — бабушка добрая' },
          { front: 'Bala', back: 'Ребёнок / Дитя', example: 'Qyzy bala — маленький ребёнок' },
        ]
      },
      {
        type: 'fill-blank',
        title: 'Заполни пробел',
        sentences: [
          { parts: ['Menіñ _____ — Alibek.'], blank: 0, answer: 'ákem', hint: 'Мой отец — Алибек', options: ['ákem', 'aǵam', 'inim', 'atam'] },
          { parts: ['_____ keldi. Ol uly bala.'], blank: 0, answer: 'Aǵam', hint: 'Мой старший брат пришёл', options: ['Inim', 'Aǵam', 'Ápkem', 'Atam'] },
          { parts: ['Oñ _____ maǵan kitap berdi.'], blank: 0, answer: 'ápkem', hint: 'Моя старшая сестра дала книгу', options: ['inim', 'atam', 'ápkem', 'ájem'] },
        ]
      },
      {
        type: 'quiz',
        title: 'Семья: финальный квиз',
        questions: [
          { q: 'Как называется старший брат по-казахски?', opts: ['Ini', 'Aǵa', 'Áke', 'Ata'], correct: 1, exp: 'Aǵa — старший брат. Ini — младший брат.' },
          { q: 'Что означает слово "Bala"?', opts: ['Мать', 'Отец', 'Ребёнок', 'Дедушка'], correct: 2, exp: 'Bala = ребёнок, дитя. Широко используется в разговорной речи.' },
          { q: '"Áje" — это:', opts: ['Дедушка', 'Бабушка', 'Тётя', 'Сестра'], correct: 1, exp: 'Áje — бабушка, Ata — дедушка' },
        ]
      }
    ]
  },
  // ── РАЗДЕЛ 3: ПОВСЕДНЕВНАЯ ЖИЗНЬ ─────────────────────────────────────────
  {
    id: 'l6', section: 'Повседневная жизнь', sectionOrder: 4,
    title: 'Еда и напитки', emoji: '🍽️', level: 'A2', xp: 25,
    desc: 'Назови популярные казахские блюда и продукты',
    exercises: [
      {
        type: 'flashcard',
        title: 'Еда и напитки',
        cards: [
          { front: 'Nan', back: 'Хлеб', example: 'Jylı nan — тёплый хлеб' },
          { front: 'Et', back: 'Мясо', example: 'Qoy eti — баранина' },
          { front: 'Sut', back: 'Молоко', example: 'Sut ishemіn — я пью молоко' },
          { front: 'Şay', back: 'Чай', example: 'Qymyz ben şay — кумыс и чай' },
          { front: 'Qymyz', back: 'Кумыс (кобылье молоко)', example: 'Qymyz sali dámdi — кумыс очень вкусный' },
          { front: 'Beshbarmaq', back: 'Бешбармак (национальное блюдо)', example: 'Beshbarmaq jidik — бешбармак вкусный' },
          { front: 'Alma', back: 'Яблоко', example: 'Almaty — "полно яблок"' },
          { front: 'Dámdi', back: 'Вкусный', example: 'Bul óte dámdi! — Это очень вкусно!' },
          { front: 'Ashtym', back: 'Я голоден/голодна', example: 'Ashtym, tamaq jei me?' },
        ]
      },
      {
        type: 'sentence-builder',
        title: 'Составь предложение',
        sentences: [
          { words: ['Bul', 'beshbarmaq', 'óte', 'dámdi!'], translation: 'Этот бешбармак очень вкусный!', shuffled: ['óte', 'Bul', 'dámdi!', 'beshbarmaq'] },
          { words: ['Men', 'şay', 'ishemіn.'], translation: 'Я пью чай.', shuffled: ['ishemіn.', 'şay', 'Men'] },
          { words: ['Alma', 'dámdi', 'jemis.'], translation: 'Яблоко — вкусный фрукт.', shuffled: ['jemis.', 'dámdi', 'Alma'] },
        ]
      },
      {
        type: 'quiz',
        title: 'Ресторан: диалог',
        questions: [
          { q: 'Как сказать "я голоден" по-казахски?', opts: ['Susadym', 'Ashtym', 'Jegim keledi', 'Tоysam'], correct: 1, exp: 'Ashtym — я голоден. Susadym — я хочу пить.' },
          { q: 'Что значит "Dámdi"?', opts: ['Горячий', 'Вкусный', 'Большой', 'Свежий'], correct: 1, exp: 'Dámdi = вкусный. Одно из самых полезных прилагательных!' },
          { q: 'Из чего делают кумыс?', opts: ['Из коровьего молока', 'Из козьего молока', 'Из кобыльего молока', 'Из верблюжьего молока'], correct: 2, exp: 'Qymyz — традиционный казахский напиток из кобыльего молока.' },
        ]
      }
    ]
  },
  {
    id: 'l7', section: 'Повседневная жизнь', sectionOrder: 4,
    title: 'Дни недели', emoji: '📅', level: 'A2', xp: 20,
    desc: 'Дни недели и выражения со временем',
    exercises: [
      {
        type: 'flashcard',
        title: 'Дни недели',
        cards: [
          { front: 'Dúysenbi', back: 'Понедельник', example: 'Dúysenbi — den salu kúni (день здоровья)' },
          { front: 'Seіsenbi', back: 'Вторник', example: 'Seіsenbi sabaqta — во вторник на уроке' },
          { front: 'Sársembi', back: 'Среда', example: 'Sársembi ortaǵy kún — среда — средний день' },
          { front: 'Beisenbi', back: 'Четверг', example: 'Beisenbi bazar — рынок в четверг' },
          { front: 'Juma', back: 'Пятница (священный день)', example: 'Juma namazy — пятничная молитва' },
          { front: 'Senbi', back: 'Суббота', example: 'Senbi — dem alu kúni (выходной)' },
          { front: 'Jeksenbi', back: 'Воскресенье', example: 'Jeksenbi — apta soñy (конец недели)' },
          { front: 'Búgin', back: 'Сегодня', example: 'Búgin juma — сегодня пятница' },
          { front: 'Erteng', back: 'Завтра', example: 'Erteng senbi — завтра суббота' },
        ]
      },
      {
        type: 'matching',
        title: 'Дни недели: пары',
        pairs: [
          { kaz: 'Dúysenbi', rus: 'Понедельник' },
          { kaz: 'Juma', rus: 'Пятница' },
          { kaz: 'Senbi', rus: 'Суббота' },
          { kaz: 'Jeksenbi', rus: 'Воскресенье' },
          { kaz: 'Búgin', rus: 'Сегодня' },
          { kaz: 'Erteng', rus: 'Завтра' },
        ]
      }
    ]
  },
  // ── РАЗДЕЛ 4: ГРАММАТИКА ──────────────────────────────────────────────────
  {
    id: 'l8', section: 'Грамматика', sectionOrder: 5,
    title: 'Личные местоимения', emoji: '👤', level: 'B1', xp: 30,
    desc: 'Я, ты, он, мы — местоимения и личные окончания глаголов',
    exercises: [
      {
        type: 'flashcard',
        title: 'Личные местоимения',
        cards: [
          { front: 'Men', back: 'Я', example: 'Men oqymyn — Я учусь' },
          { front: 'Sen', back: 'Ты (неформально)', example: 'Sen jaqsysyñ — Ты хороший' },
          { front: 'Siz', back: 'Вы (формально)', example: 'Siz kim siz? — Вы кто?' },
          { front: 'Ol', back: 'Он / Она / Оно', example: 'Ol maqta oqyshى — Он/она отличный ученик' },
          { front: 'Biz', back: 'Мы', example: 'Biz qazaqpyz — Мы казахи' },
          { front: 'Sіzder', back: 'Вы (множественное)', example: 'Sіzder qaida barasyz? — Куда вы идёте?' },
          { front: 'Olar', back: 'Они', example: 'Olar keldi — Они пришли' },
        ]
      },
      {
        type: 'fill-blank',
        title: 'Выбери местоимение',
        sentences: [
          { parts: ['_____ oqymyn. (Я учусь)'], blank: 0, answer: 'Men', hint: 'Первое лицо единственное число', options: ['Biz', 'Men', 'Ol', 'Sen'] },
          { parts: ['_____ qazaqpyz. (Мы казахи)'], blank: 0, answer: 'Biz', hint: 'Первое лицо множественное число', options: ['Sen', 'Olar', 'Biz', 'Men'] },
          { parts: ['_____ keldi. (Они пришли)'], blank: 0, answer: 'Olar', hint: 'Третье лицо множественное', options: ['Ol', 'Biz', 'Olar', 'Siz'] },
        ]
      },
      {
        type: 'quiz',
        title: 'Грамматика: местоимения',
        questions: [
          { q: 'Как вежливо сказать "вы" по-казахски?', opts: ['Sen', 'Ol', 'Siz', 'Biz'], correct: 2, exp: 'Siz — вежливая форма "вы". Sen — неформальное "ты".' },
          { q: 'В казахском языке "он" и "она" — это:', opts: ['Ol и Ola', 'O и Ona', 'Ol (одинаково)', 'He и She'], correct: 2, exp: 'В казахском нет грамматического рода! "Ol" = он/она/оно.' },
        ]
      }
    ]
  },
  {
    id: 'l9', section: 'Грамматика', sectionOrder: 5,
    title: 'Глагол "Бар" (есть/иметь)', emoji: '✅', level: 'B1', xp: 30,
    desc: 'Конструкция обладания и существования в казахском',
    exercises: [
      {
        type: 'flashcard',
        title: 'Конструкция с "Bar"',
        cards: [
          { front: 'Bar', back: 'Есть / имеется', example: 'Kitap bar — Есть книга' },
          { front: 'Joq', back: 'Нет / отсутствует', example: 'Aqsha joq — Денег нет' },
          { front: 'Menде bar', back: 'У меня есть', example: 'Menде qalam bar — У меня есть ручка' },
          { front: 'Senде joq', back: 'У тебя нет', example: 'Senде waqyt joq — У тебя нет времени' },
          { front: 'Olда bar', back: 'У него/неё есть', example: 'Olда mashina bar — У него есть машина' },
          { front: 'Bizde bar', back: 'У нас есть', example: 'Bizde ev bar — У нас есть дом' },
        ]
      },
      {
        type: 'sentence-builder',
        title: 'Составь предложение с Bar/Joq',
        sentences: [
          { words: ['Menде', 'kitap', 'bar.'], translation: 'У меня есть книга.', shuffled: ['bar.', 'Menде', 'kitap'] },
          { words: ['Olда', 'aqsha', 'joq.'], translation: 'У него нет денег.', shuffled: ['joq.', 'Olда', 'aqsha'] },
          { words: ['Bizde', 'mashina', 'bar.'], translation: 'У нас есть машина.', shuffled: ['Bizde', 'bar.', 'mashina'] },
        ]
      }
    ]
  },
  // ── РАЗДЕЛ 5: РАЗГОВОРНЫЙ ──────────────────────────────────────────────────
  {
    id: 'l10', section: 'Разговорный казахский', sectionOrder: 6,
    title: 'В магазине', emoji: '🛒', level: 'B1', xp: 35,
    desc: 'Диалоги: как купить что-то, спросить цену и торговаться',
    exercises: [
      {
        type: 'flashcard',
        title: 'В магазине: ключевые фразы',
        cards: [
          { front: 'Qansha tured?', back: 'Сколько стоит?', example: 'Bul qansha tured? — Сколько это стоит?' },
          { front: 'Qymbar', back: 'Дорого', example: 'Óte qymbar! — Очень дорого!' },
          { front: 'Arzan', back: 'Дёшево', example: 'Ó, arzan eken! — О, оказывается дёшево!' },
          { front: 'Alaim ba?', back: 'Возьму/куплю, можно?', example: 'Bul alaim ba? — Это можно купить?' },
          { front: 'Tenge', back: 'Тенге (казахская валюта)', example: 'Juz tenge — 100 тенге' },
          { front: 'Berіñіzshi', back: 'Дайте, пожалуйста', example: 'Mana berіñіzshi — Дайте мне пожалуйста' },
          { front: 'Raqmet!', back: 'Спасибо!', example: 'Kóp raqmet! — Большое спасибо!' },
        ]
      },
      {
        type: 'fill-blank',
        title: 'Диалог в магазине',
        sentences: [
          { parts: ['— Bul _____ tured?\n— Myn tenge.'], blank: 0, answer: 'qansha', hint: 'Вопрос о цене', options: ['qansha', 'qymbar', 'arzan', 'jaqsy'] },
          { parts: ['— Óte _____!\n— Bes juz ternge berei me?'], blank: 0, answer: 'qymbar', hint: 'Говорим что дорого', options: ['arzan', 'dámdi', 'qymbar', 'jaqsy'] },
          { parts: ['— Raqmet!\n— _____ joq!'], blank: 0, answer: 'Raqmet', hint: 'Не за что!', options: ['Sáu bol', 'Raqmet', 'Sálem', 'Jaqsy'] },
        ]
      },
      {
        type: 'quiz',
        title: 'Шоппинг: финальный квиз',
        questions: [
          { q: 'Как спросить цену товара?', opts: ['Qansha tured?', 'Qalaisyñ?', 'Arzan ba?', 'Bar ma?'], correct: 0, exp: '"Qansha tured?" — самый важный вопрос в магазине!' },
          { q: 'Что означает "Arzan"?', opts: ['Дорогой', 'Дешёвый', 'Вкусный', 'Большой'], correct: 1, exp: 'Arzan = дёшево, недорого' },
          { q: 'Казахская валюта называется:', opts: ['Рубль', 'Манат', 'Тенге', 'Сом'], correct: 2, exp: 'Tenge — официальная валюта Казахстана с 1993 года.' },
        ]
      }
    ]
  },
];

// ─── Структура секций ─────────────────────────────────────────────────────────
const SECTIONS = [
  { order: 1, title: 'Алфавит и приветствия', emoji: '🔤', color: '#58cc02' },
  { order: 2, title: 'Числа и цвета', emoji: '🔢', color: '#1cb0f6' },
  { order: 3, title: 'Семья и люди', emoji: '👨‍👩‍👧', color: '#ff9600' },
  { order: 4, title: 'Повседневная жизнь', emoji: '🌆', color: '#a560e8' },
  { order: 5, title: 'Грамматика', emoji: '📚', color: '#ff4b4b' },
  { order: 6, title: 'Разговорный казахский', emoji: '💬', color: '#ff9600' },
];

// ─── Состояние ────────────────────────────────────────────────────────────────
let state = {
  view: 'catalog', // catalog | lesson | result
  currentLesson: null,
  currentExIndex: 0,
  sessionXP: 0,
  mistakes: 0,
  hearts: 5,
};

// ─── Утилиты ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── ГЛАВНЫЙ РЕНДЕР ──────────────────────────────────────────────────────────
function init() {
  const container = document.querySelector(CONTAINER_SEL);
  if (!container) return;
  injectStyles();
  renderCatalog(container);
}

// ═══════════════════════════════════════════════════════════════════════════════
// КАТАЛОГ УРОКОВ
// ═══════════════════════════════════════════════════════════════════════════════
function renderCatalog(container) {
  state.view = 'catalog';
  const prog = getProgress();
  const totalXP = prog.xp || 0;
  const streak = prog.streak || 0;
  const doneLessons = Object.keys(prog.lessons || {}).length;

  container.innerHTML = `
    <div class="il-catalog">
      <!-- Шапка -->
      <div class="il-catalog-header">
        <div class="il-header-left">
          <h1 class="il-catalog-title">
            <span class="il-flag">🇰🇿</span>
            Казахский язык
          </h1>
          <p class="il-catalog-sub">Интерактивные уроки · ${LESSONS.length} занятий · A1 → B2</p>
        </div>
        <div class="il-stats-row">
          <div class="il-stat-chip il-stat-xp">
            <span class="il-stat-icon">⚡</span>
            <span class="il-stat-val">${totalXP}</span>
            <span class="il-stat-label">XP</span>
          </div>
          <div class="il-stat-chip il-stat-streak">
            <span class="il-stat-icon">🔥</span>
            <span class="il-stat-val">${streak}</span>
            <span class="il-stat-label">дней</span>
          </div>
          <div class="il-stat-chip il-stat-done">
            <span class="il-stat-icon">✅</span>
            <span class="il-stat-val">${doneLessons}</span>
            <span class="il-stat-label">уроков</span>
          </div>
        </div>
      </div>

      <!-- Прогресс-бар общий -->
      <div class="il-global-progress">
        <div class="il-gp-label">
          <span>Общий прогресс</span>
          <span>${doneLessons}/${LESSONS.length} уроков</span>
        </div>
        <div class="il-gp-bar">
          <div class="il-gp-fill" style="width:${Math.round(doneLessons/LESSONS.length*100)}%"></div>
        </div>
      </div>

      <!-- Секции и уроки -->
      <div class="il-sections">
        ${renderSections()}
      </div>

      <!-- AI Генератор -->
      <div class="il-ai-banner">
        <div class="il-ai-banner-text">
          <div class="il-ai-icon">✨</div>
          <div>
            <div class="il-ai-title">Создать урок с AI</div>
            <div class="il-ai-desc">Попроси Claude сгенерировать персональный урок на любую тему казахского</div>
          </div>
        </div>
        <button class="il-ai-btn" id="ilAiBtn">Создать урок</button>
      </div>
    </div>

    <!-- AI Модал -->
    <div class="il-modal-overlay" id="ilAiModal">
      <div class="il-modal-box">
        <div class="il-modal-header">
          <span>✨ AI-генератор урока</span>
          <button class="il-modal-close" id="ilAiClose">✕</button>
        </div>
        <div class="il-modal-body">
          <div class="il-field">
            <label>Тема урока</label>
            <input id="ilAiTopic" class="il-input" type="text" placeholder="Например: времена года, профессии, числа 100-1000..." />
          </div>
          <div class="il-field-row">
            <div class="il-field">
              <label>Уровень</label>
              <select id="ilAiLevel" class="il-select">
                <option value="A1">A1 — Начальный</option>
                <option value="A2" selected>A2 — Элементарный</option>
                <option value="B1">B1 — Средний</option>
                <option value="B2">B2 — Выше среднего</option>
              </select>
            </div>
            <div class="il-field">
              <label>Тип упражнений</label>
              <select id="ilAiType" class="il-select">
                <option value="mixed">Всё понемногу</option>
                <option value="flashcard">Карточки</option>
                <option value="quiz">Квизы</option>
                <option value="matching">Сопоставление</option>
              </select>
            </div>
          </div>
          <div id="ilAiResult" style="display:none">
            <div class="il-gen-progress">
              <div class="il-gen-progress-bar" id="ilGenBar"></div>
            </div>
            <div class="il-gen-status" id="ilGenStatus">Генерирую урок...</div>
          </div>
          <div class="il-gen-error" id="ilAiError" style="display:none"></div>
        </div>
        <div class="il-modal-footer">
          <button class="il-cancel-btn" id="ilAiCancel">Отмена</button>
          <button class="il-gen-btn" id="ilAiGenerate">
            <span>✨</span> Сгенерировать
          </button>
        </div>
      </div>
    </div>
  `;

  // Обработчики карточек уроков
  container.querySelectorAll('.il-lesson-card[data-lesson-id]').forEach(card => {
    card.addEventListener('click', () => {
      const lesson = LESSONS.find(l => l.id === card.dataset.lessonId);
      if (lesson) startLesson(container, lesson);
    });
  });

  // AI Модал
  document.getElementById('ilAiBtn')?.addEventListener('click', () => {
    document.getElementById('ilAiModal').classList.add('active');
  });
  document.getElementById('ilAiClose')?.addEventListener('click', () => {
    document.getElementById('ilAiModal').classList.remove('active');
  });
  document.getElementById('ilAiCancel')?.addEventListener('click', () => {
    document.getElementById('ilAiModal').classList.remove('active');
  });
  document.getElementById('ilAiModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'ilAiModal') document.getElementById('ilAiModal').classList.remove('active');
  });
  document.getElementById('ilAiGenerate')?.addEventListener('click', () => handleAiGenerate(container));
}

function renderSections() {
  return SECTIONS.map(sec => {
    const secLessons = LESSONS.filter(l => l.sectionOrder === sec.order);
    const doneSec = secLessons.filter(l => getLessonStars(l.id) > 0).length;
    return `
      <div class="il-section">
        <div class="il-section-header">
          <div class="il-section-info">
            <span class="il-section-emoji">${sec.emoji}</span>
            <div>
              <div class="il-section-title">${sec.title}</div>
              <div class="il-section-prog">${doneSec}/${secLessons.length} выполнено</div>
            </div>
          </div>
          <div class="il-section-progress-mini">
            <div class="il-section-fill" style="width:${doneSec/secLessons.length*100}%; background:${sec.color}"></div>
          </div>
        </div>
        <div class="il-lesson-grid">
          ${secLessons.map(l => renderLessonCard(l, sec.color)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderLessonCard(lesson, color) {
  const stars = getLessonStars(lesson.id);
  const done = stars > 0;
  const starsHtml = [1,2,3].map(i => `<span class="il-star ${i <= stars ? 'il-star-active' : ''}">★</span>`).join('');
  return `
    <div class="il-lesson-card ${done ? 'il-card-done' : ''}" data-lesson-id="${lesson.id}" style="--card-color: ${color}">
      <div class="il-card-top">
        <div class="il-card-emoji">${lesson.emoji}</div>
        <div class="il-card-level il-level-${lesson.level.toLowerCase()}">${lesson.level}</div>
      </div>
      <div class="il-card-title">${lesson.title}</div>
      <div class="il-card-desc">${lesson.desc}</div>
      <div class="il-card-bottom">
        <div class="il-card-stars">${starsHtml}</div>
        <div class="il-card-xp">⚡ ${lesson.xp} XP</div>
      </div>
      <div class="il-card-cta">${done ? '🔄 Повторить' : '▶ Начать'}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// УРОК — ОБОЛОЧКА
// ═══════════════════════════════════════════════════════════════════════════════
function startLesson(container, lesson) {
  state.view = 'lesson';
  state.currentLesson = lesson;
  state.currentExIndex = 0;
  state.sessionXP = 0;
  state.mistakes = 0;
  state.hearts = 5;

  renderLessonFrame(container);
}

function renderLessonFrame(container) {
  const lesson = state.currentLesson;
  const totalEx = lesson.exercises.length;
  const progress = Math.round(state.currentExIndex / totalEx * 100);

  container.innerHTML = `
    <div class="il-lesson-frame">
      <!-- Топбар -->
      <div class="il-lesson-topbar">
        <button class="il-back-btn" id="ilBackBtn">✕</button>
        <div class="il-lesson-progress-wrap">
          <div class="il-lesson-progress-bar">
            <div class="il-lesson-progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="il-hearts">
          ${'❤️'.repeat(state.hearts)}${'🖤'.repeat(5 - state.hearts)}
        </div>
        <div class="il-session-xp">⚡${state.sessionXP}</div>
      </div>

      <!-- Упражнение -->
      <div class="il-exercise-area" id="ilExArea">
        ${renderExercise(lesson.exercises[state.currentExIndex])}
      </div>
    </div>
  `;

  container.querySelector('#ilBackBtn')?.addEventListener('click', () => {
    renderCatalog(container);
  });

  bindExerciseHandlers(container);
}

function nextExercise(container) {
  const lesson = state.currentLesson;
  state.currentExIndex++;
  if (state.currentExIndex >= lesson.exercises.length) {
    renderResult(container);
  } else {
    renderLessonFrame(container);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// УПРАЖНЕНИЯ
// ═══════════════════════════════════════════════════════════════════════════════

function renderExercise(ex) {
  switch (ex.type) {
    case 'flashcard': return renderFlashcard(ex);
    case 'quiz': return renderQuiz(ex);
    case 'matching': return renderMatching(ex);
    case 'fill-blank': return renderFillBlank(ex);
    case 'sentence-builder': return renderSentenceBuilder(ex);
    default: return `<div>Упражнение "${ex.type}"</div>`;
  }
}

// ── Flashcard ──────────────────────────────────────────────────────────────────
function renderFlashcard(ex) {
  const shuffledCards = shuffle(ex.cards);
  window._fcCards = shuffledCards;
  window._fcIndex = 0;
  window._fcFlipped = false;

  return `
    <div class="il-flashcard-ex">
      <div class="il-ex-header">
        <div class="il-ex-type-badge">🃏 Карточки</div>
        <div class="il-ex-title">${ex.title}</div>
        <div class="il-fc-counter">1 / ${shuffledCards.length}</div>
      </div>
      <div class="il-fc-wrap">
        <div class="il-fc-card" id="ilFcCard" onclick="window.flipCard()">
          <div class="il-fc-inner" id="ilFcInner">
            <div class="il-fc-front">
              <div class="il-fc-hint">Нажми, чтобы увидеть перевод</div>
              <div class="il-fc-word">${shuffledCards[0].front}</div>
            </div>
            <div class="il-fc-back">
              <div class="il-fc-translation">${shuffledCards[0].back}</div>
              <div class="il-fc-example">${shuffledCards[0].example || ''}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="il-fc-nav">
        <button class="il-fc-nav-btn" id="ilFcPrev" disabled>◀ Назад</button>
        <div class="il-fc-dots" id="ilFcDots">
          ${shuffledCards.map((_, i) => `<div class="il-fc-dot ${i===0?'active':''}"></div>`).join('')}
        </div>
        <button class="il-fc-nav-btn" id="ilFcNext">Вперёд ▶</button>
      </div>
      <div class="il-fc-done-wrap" id="ilFcDoneWrap" style="display:none">
        <button class="il-continue-btn" id="ilFcDone">Продолжить ✓</button>
      </div>
    </div>
  `;
}

// ── Quiz ───────────────────────────────────────────────────────────────────────
function renderQuiz(ex) {
  window._quizState = { index: 0, questions: shuffle(ex.questions), score: 0 };
  return renderQuizQuestion(ex);
}

function renderQuizQuestion(ex) {
  const qs = window._quizState.questions;
  const qi = window._quizState.index;
  if (qi >= qs.length) return `<div id="ilQuizDone" data-score="${window._quizState.score}"></div>`;
  const q = qs[qi];
  return `
    <div class="il-quiz-ex">
      <div class="il-ex-header">
        <div class="il-ex-type-badge">⚡ Квиз</div>
        <div class="il-ex-title">${ex.title}</div>
        <div class="il-quiz-counter">${qi + 1} / ${qs.length}</div>
      </div>
      <div class="il-quiz-question">${q.q}</div>
      <div class="il-quiz-options" id="ilQuizOpts">
        ${q.opts.map((o, i) => `
          <button class="il-quiz-opt" data-idx="${i}">${o}</button>
        `).join('')}
      </div>
      <div class="il-quiz-explanation" id="ilQuizExp" style="display:none">
        <div class="il-exp-text">${q.exp}</div>
      </div>
    </div>
  `;
}

// ── Matching ───────────────────────────────────────────────────────────────────
function renderMatching(ex) {
  const pairs = shuffle(ex.pairs);
  const leftItems = shuffle(pairs.map(p => p.kaz));
  const rightItems = shuffle(pairs.map(p => p.rus));
  window._matchState = {
    pairs, leftItems, rightItems,
    selectedLeft: null, selectedRight: null,
    matched: new Set(), mistakes: 0
  };
  return `
    <div class="il-match-ex">
      <div class="il-ex-header">
        <div class="il-ex-type-badge">🔗 Сопоставление</div>
        <div class="il-ex-title">${ex.title}</div>
      </div>
      <div class="il-match-grid">
        <div class="il-match-col" id="ilMatchLeft">
          ${leftItems.map(w => `<div class="il-match-item il-match-left" data-word="${w}">${w}</div>`).join('')}
        </div>
        <div class="il-match-col" id="ilMatchRight">
          ${rightItems.map(w => `<div class="il-match-item il-match-right" data-word="${w}">${w}</div>`).join('')}
        </div>
      </div>
      <div class="il-match-done-wrap" id="ilMatchDoneWrap" style="display:none">
        <button class="il-continue-btn" id="ilMatchDone">Продолжить ✓</button>
      </div>
    </div>
  `;
}

// ── Fill Blank ─────────────────────────────────────────────────────────────────
function renderFillBlank(ex) {
  window._fbState = { index: 0, sentences: ex.sentences, score: 0 };
  return renderFillBlankItem(ex);
}

function renderFillBlankItem(ex) {
  const { index, sentences } = window._fbState;
  const s = sentences[index];
  const parts = s.parts[0].split('\n');
  return `
    <div class="il-fb-ex">
      <div class="il-ex-header">
        <div class="il-ex-type-badge">✏️ Заполни пробел</div>
        <div class="il-ex-title">Выбери правильный ответ</div>
        <div class="il-quiz-counter">${index + 1} / ${sentences.length}</div>
      </div>
      <div class="il-fb-context">
        ${parts.map(p => `<div class="il-fb-line">${p}</div>`).join('')}
      </div>
      <div class="il-fb-hint">💡 ${s.hint}</div>
      <div class="il-fb-options" id="ilFbOpts">
        ${shuffle(s.options).map(opt => `
          <button class="il-fb-opt" data-val="${opt}">${opt}</button>
        `).join('')}
      </div>
      <div class="il-fb-result" id="ilFbResult" style="display:none"></div>
    </div>
  `;
}

// ── Sentence Builder ────────────────────────────────────────────────────────────
function renderSentenceBuilder(ex) {
  window._sbState = { index: 0, sentences: ex.sentences, built: [], score: 0 };
  return renderSbItem(ex);
}

function renderSbItem(ex) {
  const { index, sentences } = window._sbState;
  const s = sentences[index];
  window._sbState.built = [];
  window._sbState.shuffled = shuffle([...s.shuffled]);
  return `
    <div class="il-sb-ex">
      <div class="il-ex-header">
        <div class="il-ex-type-badge">🧩 Составь предложение</div>
        <div class="il-ex-title">Собери слова в нужном порядке</div>
        <div class="il-quiz-counter">${index + 1} / ${sentences.length}</div>
      </div>
      <div class="il-sb-translation">"${s.translation}"</div>
      <div class="il-sb-built" id="ilSbBuilt">
        <div class="il-sb-placeholder">Нажми на слова ниже ↓</div>
      </div>
      <div class="il-sb-words" id="ilSbWords">
        ${window._sbState.shuffled.map((w, i) => `
          <button class="il-sb-word" data-word="${w}" data-idx="${i}">${w}</button>
        `).join('')}
      </div>
      <div class="il-sb-actions" id="ilSbActions">
        <button class="il-sb-clear" id="ilSbClear">Сбросить</button>
        <button class="il-sb-check il-btn-disabled" id="ilSbCheck" disabled>Проверить</button>
      </div>
      <div class="il-sb-result" id="ilSbResult" style="display:none"></div>
    </div>
  `;
}

// ─── Привязка обработчиков ────────────────────────────────────────────────────
function bindExerciseHandlers(container) {
  const ex = state.currentLesson.exercises[state.currentExIndex];

  if (ex.type === 'flashcard') bindFlashcardHandlers(container);
  if (ex.type === 'quiz') bindQuizHandlers(container, ex);
  if (ex.type === 'matching') bindMatchingHandlers(container);
  if (ex.type === 'fill-blank') bindFillBlankHandlers(container, ex);
  if (ex.type === 'sentence-builder') bindSbHandlers(container, ex);
}

// ── Flashcard Handlers ─────────────────────────────────────────────────────────
function bindFlashcardHandlers(container) {
  window.flipCard = () => {
    const inner = document.getElementById('ilFcInner');
    if (inner) {
      window._fcFlipped = !window._fcFlipped;
      inner.style.transform = window._fcFlipped ? 'rotateY(180deg)' : '';
    }
  };

  container.querySelector('#ilFcNext')?.addEventListener('click', () => {
    const cards = window._fcCards;
    window._fcIndex++;
    window._fcFlipped = false;
    if (window._fcIndex >= cards.length) {
      state.sessionXP += 5;
      container.querySelector('#ilFcDoneWrap').style.display = 'flex';
      container.querySelector('#ilFcNext').disabled = true;
    } else {
      updateFlashcard(container);
    }
  });

  container.querySelector('#ilFcPrev')?.addEventListener('click', () => {
    if (window._fcIndex > 0) {
      window._fcIndex--;
      window._fcFlipped = false;
      updateFlashcard(container);
    }
  });

  container.querySelector('#ilFcDone')?.addEventListener('click', () => {
    state.sessionXP += 10;
    nextExercise(container);
  });
}

function updateFlashcard(container) {
  const cards = window._fcCards;
  const idx = window._fcIndex;
  const card = cards[idx];
  const inner = document.getElementById('ilFcInner');
  if (inner) {
    inner.style.transform = '';
    inner.querySelector('.il-fc-word').textContent = card.front;
    inner.querySelector('.il-fc-translation').textContent = card.back;
    inner.querySelector('.il-fc-example').textContent = card.example || '';
  }
  const counter = container.querySelector('.il-fc-counter');
  if (counter) counter.textContent = `${idx + 1} / ${cards.length}`;
  container.querySelectorAll('.il-fc-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
  container.querySelector('#ilFcPrev').disabled = idx === 0;
  container.querySelector('#ilFcNext').disabled = false;
}

// ── Quiz Handlers ──────────────────────────────────────────────────────────────
function bindQuizHandlers(container, ex) {
  container.querySelectorAll('.il-quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const qs = window._quizState.questions;
      const qi = window._quizState.index;
      const q = qs[qi];
      const chosen = parseInt(btn.dataset.idx);
      const correct = q.correct;
      const isCorrect = chosen === correct;

      // Визуальная обратная связь
      container.querySelectorAll('.il-quiz-opt').forEach(b => b.disabled = true);
      btn.classList.add(isCorrect ? 'il-opt-correct' : 'il-opt-wrong');
      if (!isCorrect) {
        container.querySelectorAll('.il-quiz-opt')[correct]?.classList.add('il-opt-correct');
        state.hearts = Math.max(0, state.hearts - 1);
        state.mistakes++;
      } else {
        state.sessionXP += 8;
      }

      const expEl = document.getElementById('ilQuizExp');
      if (expEl) expEl.style.display = 'block';

      setTimeout(() => {
        window._quizState.index++;
        if (window._quizState.index >= qs.length) {
          nextExercise(container);
        } else {
          document.getElementById('ilExArea').innerHTML = renderQuizQuestion(ex);
          bindQuizHandlers(container, ex);
        }
      }, isCorrect ? 1200 : 2000);
    });
  });
}

// ── Matching Handlers ──────────────────────────────────────────────────────────
function bindMatchingHandlers(container) {
  const ms = window._matchState;

  container.querySelectorAll('.il-match-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.classList.contains('il-matched')) return;

      const isLeft = item.classList.contains('il-match-left');
      const word = item.dataset.word;

      if (isLeft) {
        container.querySelectorAll('.il-match-left').forEach(i => i.classList.remove('il-selected'));
        ms.selectedLeft = word;
        item.classList.add('il-selected');
      } else {
        container.querySelectorAll('.il-match-right').forEach(i => i.classList.remove('il-selected'));
        ms.selectedRight = word;
        item.classList.add('il-selected');
      }

      if (ms.selectedLeft && ms.selectedRight) {
        const pair = ms.pairs.find(p => p.kaz === ms.selectedLeft);
        const isMatch = pair && pair.rus === ms.selectedRight;

        if (isMatch) {
          container.querySelectorAll(`[data-word="${ms.selectedLeft}"]`)[0]?.classList.add('il-matched', 'il-match-ok');
          container.querySelectorAll(`[data-word="${ms.selectedRight}"]`)[0]?.classList.add('il-matched', 'il-match-ok');
          ms.matched.add(ms.selectedLeft);
          state.sessionXP += 5;
        } else {
          container.querySelectorAll('.il-selected').forEach(i => {
            i.classList.add('il-match-err');
            setTimeout(() => i.classList.remove('il-match-err', 'il-selected'), 600);
          });
          state.hearts = Math.max(0, state.hearts - 1);
          state.mistakes++;
        }

        ms.selectedLeft = null;
        ms.selectedRight = null;

        if (!isMatch) return;
        container.querySelectorAll('.il-selected').forEach(i => i.classList.remove('il-selected'));

        if (ms.matched.size === ms.pairs.length) {
          const doneWrap = document.getElementById('ilMatchDoneWrap');
          if (doneWrap) doneWrap.style.display = 'flex';
        }
      }
    });
  });

  container.querySelector('#ilMatchDone')?.addEventListener('click', () => {
    state.sessionXP += 10;
    nextExercise(container);
  });
}

// ── Fill Blank Handlers ────────────────────────────────────────────────────────
function bindFillBlankHandlers(container, ex) {
  container.querySelectorAll('.il-fb-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      const s = ex.sentences[window._fbState.index];
      const isCorrect = val === s.answer;

      container.querySelectorAll('.il-fb-opt').forEach(b => b.disabled = true);
      btn.classList.add(isCorrect ? 'il-opt-correct' : 'il-opt-wrong');
      if (!isCorrect) {
        container.querySelectorAll('.il-fb-opt').forEach(b => {
          if (b.dataset.val === s.answer) b.classList.add('il-opt-correct');
        });
        state.hearts = Math.max(0, state.hearts - 1);
        state.mistakes++;
      } else {
        state.sessionXP += 8;
        window._fbState.score++;
      }

      const resEl = document.getElementById('ilFbResult');
      if (resEl) {
        resEl.style.display = 'block';
        resEl.innerHTML = isCorrect
          ? `<div class="il-result-ok">✅ Правильно! Ответ: <strong>${s.answer}</strong></div>`
          : `<div class="il-result-err">❌ Правильный ответ: <strong>${s.answer}</strong></div>`;
      }

      setTimeout(() => {
        window._fbState.index++;
        if (window._fbState.index >= ex.sentences.length) {
          nextExercise(container);
        } else {
          document.getElementById('ilExArea').innerHTML = renderFillBlankItem(ex);
          bindFillBlankHandlers(container, ex);
        }
      }, isCorrect ? 1200 : 2200);
    });
  });
}

// ── Sentence Builder Handlers ──────────────────────────────────────────────────
function bindSbHandlers(container, ex) {
  updateSbBuilt(container);

  container.querySelectorAll('.il-sb-word').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      window._sbState.built.push(btn.dataset.word);
      btn.disabled = true;
      btn.classList.add('il-word-used');
      updateSbBuilt(container);
    });
  });

  container.querySelector('#ilSbClear')?.addEventListener('click', () => {
    window._sbState.built = [];
    container.querySelectorAll('.il-sb-word').forEach(b => {
      b.disabled = false;
      b.classList.remove('il-word-used');
    });
    updateSbBuilt(container);
  });

  container.querySelector('#ilSbCheck')?.addEventListener('click', () => {
    const s = ex.sentences[window._sbState.index];
    const built = window._sbState.built.join(' ');
    const correct = s.words.join(' ');
    const isCorrect = built === correct;

    const resEl = document.getElementById('ilSbResult');
    if (resEl) {
      resEl.style.display = 'block';
      resEl.innerHTML = isCorrect
        ? `<div class="il-result-ok">✅ Верно! «${s.translation}»</div>`
        : `<div class="il-result-err">❌ Правильно: <strong>${correct}</strong></div>`;
    }

    if (!isCorrect) {
      state.hearts = Math.max(0, state.hearts - 1);
      state.mistakes++;
    } else {
      state.sessionXP += 10;
    }

    setTimeout(() => {
      window._sbState.index++;
      if (window._sbState.index >= ex.sentences.length) {
        nextExercise(container);
      } else {
        document.getElementById('ilExArea').innerHTML = renderSbItem(ex);
        bindSbHandlers(container, ex);
      }
    }, isCorrect ? 1300 : 2400);
  });
}

function updateSbBuilt(container) {
  const built = window._sbState.built;
  const builtEl = document.getElementById('ilSbBuilt');
  const checkBtn = document.getElementById('ilSbCheck');
  if (builtEl) {
    if (built.length === 0) {
      builtEl.innerHTML = '<div class="il-sb-placeholder">Нажми на слова ниже ↓</div>';
    } else {
      builtEl.innerHTML = built.map(w => `<span class="il-sb-built-word">${w}</span>`).join('');
    }
  }
  const totalWords = window._sbState.shuffled.length;
  if (checkBtn) {
    const allUsed = built.length === totalWords;
    checkBtn.disabled = !allUsed;
    checkBtn.classList.toggle('il-btn-disabled', !allUsed);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// РЕЗУЛЬТАТ УРОКА
// ═══════════════════════════════════════════════════════════════════════════════
function renderResult(container) {
  const lesson = state.currentLesson;
  const xpEarned = state.sessionXP;
  const mistakes = state.mistakes;
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : mistakes <= 4 ? 1 : 1;

  markLessonDone(lesson.id, stars);
  const prog = addXP(xpEarned);

  const starsHtml = [1,2,3].map(i => `
    <span class="il-result-star ${i <= stars ? 'il-result-star-active' : ''}" style="animation-delay:${i*0.15}s">★</span>
  `).join('');

  container.innerHTML = `
    <div class="il-result-screen">
      <div class="il-result-emoji">${lesson.emoji}</div>
      <h2 class="il-result-title">Урок завершён!</h2>
      <div class="il-result-stars">${starsHtml}</div>
      <div class="il-result-lesson">${lesson.title}</div>

      <div class="il-result-stats">
        <div class="il-result-stat">
          <div class="il-rs-value il-rs-xp">+${xpEarned}</div>
          <div class="il-rs-label">Очки XP</div>
        </div>
        <div class="il-result-stat">
          <div class="il-rs-value">${prog.streak}</div>
          <div class="il-rs-label">🔥 Дней подряд</div>
        </div>
        <div class="il-result-stat">
          <div class="il-rs-value ${mistakes > 0 ? 'il-rs-err' : 'il-rs-ok'}">${mistakes}</div>
          <div class="il-rs-label">Ошибок</div>
        </div>
      </div>

      <div class="il-result-actions">
        <button class="il-result-back-btn" id="ilResBack">← К урокам</button>
        <button class="il-result-retry-btn" id="ilResRetry">🔄 Повторить</button>
      </div>
    </div>
  `;

  container.querySelector('#ilResBack')?.addEventListener('click', () => renderCatalog(container));
  container.querySelector('#ilResRetry')?.addEventListener('click', () => startLesson(container, lesson));
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI-ГЕНЕРАТОР УРОКА
// ═══════════════════════════════════════════════════════════════════════════════
async function handleAiGenerate(container) {
  const topic = document.getElementById('ilAiTopic')?.value?.trim();
  if (!topic) {
    const err = document.getElementById('ilAiError');
    if (err) { err.textContent = 'Введите тему урока'; err.style.display = 'block'; }
    return;
  }

  const level = document.getElementById('ilAiLevel')?.value || 'A2';
  const type = document.getElementById('ilAiType')?.value || 'mixed';
  const btn = document.getElementById('ilAiGenerate');
  const resultEl = document.getElementById('ilAiResult');
  const errEl = document.getElementById('ilAiError');
  const statusEl = document.getElementById('ilGenStatus');
  const barEl = document.getElementById('ilGenBar');

  btn.disabled = true;
  btn.innerHTML = '⏳ Генерирую...';
  resultEl.style.display = 'block';
  errEl.style.display = 'none';

  // Анимируем прогресс-бар
  let barWidth = 0;
  const barInterval = setInterval(() => {
    barWidth = Math.min(barWidth + 2, 90);
    if (barEl) barEl.style.width = barWidth + '%';
  }, 200);

  const statuses = ['Формирую план урока...', 'Создаю карточки...', 'Добавляю квизы и задания...', 'Шлифую контент...'];
  let si = 0;
  const statusInterval = setInterval(() => {
    if (statusEl && si < statuses.length) statusEl.textContent = statuses[si++];
  }, 2000);

  const systemPrompt = `Ты — эксперт по казахскому языку и опытный методолог по созданию учебных материалов.
Создавай интерактивные уроки казахского языка для русскоязычных студентов.
Используй латинский казахский алфавит (Qazaq latin).

Твой ответ должен быть СТРОГО в формате JSON без markdown-блоков. Начинай сразу с {.

Структура ответа:
{
  "id": "ai-<timestamp>",
  "title": "<название урока>",
  "section": "<название раздела>",
  "sectionOrder": 7,
  "emoji": "<подходящий emoji>",
  "level": "${level}",
  "xp": 30,
  "desc": "<краткое описание>",
  "exercises": [
    // 3-4 упражнения, чередуй типы
  ]
}

Типы упражнений:
1. flashcard: {"type":"flashcard","title":"...","cards":[{"front":"казахское слово","back":"перевод","example":"пример предложения"}]}
   - Минимум 6 карточек
   
2. quiz: {"type":"quiz","title":"...","questions":[{"q":"вопрос","opts":["а","б","в","г"],"correct":0,"exp":"объяснение"}]}
   - Минимум 3 вопроса, всегда 4 варианта

3. matching: {"type":"matching","title":"...","pairs":[{"kaz":"казахское","rus":"русское"}]}
   - Минимум 5 пар

4. fill-blank: {"type":"fill-blank","title":"...","sentences":[{"parts":["предложение с ___"],"blank":0,"answer":"ответ","hint":"подсказка","options":["вар1","вар2","вар3","вар4"]}]}
   - Минимум 3 предложения

5. sentence-builder: {"type":"sentence-builder","title":"...","sentences":[{"words":["слово1","слово2","..."],"translation":"перевод","shuffled":["слово2","слово1","..."]}]}
   - Минимум 3 предложения, shuffled должен быть в другом порядке чем words

Правила:
- Уровень ${level}: ${level === 'A1' ? 'базовая лексика, простые слова' : level === 'A2' ? 'повседневные фразы' : level === 'B1' ? 'грамматика, составные предложения' : 'сложные конструкции'}
- Тип упражнений: ${type === 'mixed' ? 'чередуй все типы' : type}
- Казахский текст — в латинском алфавите
- Каждый пример должен быть натуральным и полезным
- Добавляй культурный контекст где возможно`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Создай урок казахского языка на тему: "${topic}". Уровень: ${level}.` }]
      })
    });

    clearInterval(barInterval);
    clearInterval(statusInterval);

    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    const data = await resp.json();
    const text = data.content?.[0]?.text || '';

    // Парсим JSON
    const clean = text.replace(/```json|```/g, '').trim();
    const lesson = JSON.parse(clean);
    lesson.id = `ai-${Date.now()}`;
    lesson.sectionOrder = 7;
    if (!lesson.section) lesson.section = 'AI-уроки';

    // Добавляем урок в список и открываем
    LESSONS.push(lesson);

    if (barEl) barEl.style.width = '100%';
    if (statusEl) statusEl.textContent = '✅ Урок создан! Открываю...';

    btn.disabled = false;
    btn.innerHTML = '<span>✨</span> Сгенерировать';

    setTimeout(() => {
      document.getElementById('ilAiModal')?.classList.remove('active');
      startLesson(container, lesson);
    }, 800);

  } catch (e) {
    clearInterval(barInterval);
    clearInterval(statusInterval);
    if (barEl) barEl.style.width = '0%';
    btn.disabled = false;
    btn.innerHTML = '<span>✨</span> Сгенерировать';
    resultEl.style.display = 'none';
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = e.message.includes('JSON') ? 'Ошибка разбора ответа AI. Попробуйте ещё раз.' : `Ошибка: ${e.message}`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// СТИЛИ
// ═══════════════════════════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('il-styles')) return;
  const s = document.createElement('style');
  s.id = 'il-styles';
  s.textContent = `
  /* ── Каталог ── */
  .il-catalog { padding: 24px; max-width: 960px; margin: 0 auto; }
  
  .il-catalog-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 20px;
  }
  .il-flag { font-size: 36px; margin-right: 12px; }
  .il-catalog-title { font-size: 28px; font-weight: 900; margin: 0; display: flex; align-items: center; }
  .il-catalog-sub { font-size: 13px; color: var(--text3); margin: 4px 0 0; font-family: var(--mono); }
  
  .il-stats-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .il-stat-chip {
    display: flex; align-items: center; gap: 6px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 999px; padding: 8px 16px;
    font-weight: 800; font-size: 14px;
  }
  .il-stat-xp { border-color: rgba(88,204,2,.4); color: #58cc02; }
  .il-stat-streak { border-color: rgba(255,150,0,.4); color: #ff9600; }
  .il-stat-done { border-color: rgba(28,176,246,.4); color: #1cb0f6; }
  .il-stat-icon { font-size: 16px; }
  .il-stat-val { font-size: 18px; font-weight: 900; }
  .il-stat-label { font-size: 11px; font-weight: 600; font-family: var(--mono); opacity: .7; }

  .il-global-progress { margin-bottom: 28px; }
  .il-gp-label { display: flex; justify-content: space-between; font-size: 12px; color: var(--text3); margin-bottom: 6px; font-family: var(--mono); }
  .il-gp-bar { height: 8px; background: var(--bg3); border-radius: 999px; overflow: hidden; }
  .il-gp-fill { height: 100%; background: linear-gradient(90deg, #58cc02, #89e219); border-radius: 999px; transition: width .6s ease; }

  /* ── Секции ── */
  .il-sections { display: flex; flex-direction: column; gap: 32px; margin-bottom: 32px; }
  
  .il-section {}
  .il-section-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-bottom: 14px; flex-wrap: wrap;
  }
  .il-section-info { display: flex; align-items: center; gap: 12px; }
  .il-section-emoji { font-size: 28px; }
  .il-section-title { font-size: 17px; font-weight: 800; margin: 0; }
  .il-section-prog { font-size: 12px; color: var(--text3); font-family: var(--mono); }
  
  .il-section-progress-mini {
    width: 120px; height: 6px; background: var(--bg3); border-radius: 999px; overflow: hidden;
  }
  .il-section-fill { height: 100%; border-radius: 999px; transition: width .4s; }

  .il-lesson-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .il-lesson-card {
    background: var(--bg2); border: 2px solid var(--border);
    border-radius: 16px; padding: 16px; cursor: pointer;
    transition: all .2s; display: flex; flex-direction: column; gap: 8px;
    position: relative; overflow: hidden;
  }
  .il-lesson-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--card-color, #58cc02); opacity: 0; transition: opacity .2s;
  }
  .il-lesson-card:hover { transform: translateY(-3px); border-color: var(--card-color, #58cc02); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
  .il-lesson-card:hover::before { opacity: 1; }
  .il-card-done { border-color: rgba(88,204,2,.3); background: rgba(88,204,2,.05); }

  .il-card-top { display: flex; justify-content: space-between; align-items: center; }
  .il-card-emoji { font-size: 24px; }
  .il-card-level { font-size: 10px; font-weight: 800; font-family: var(--mono); padding: 3px 8px; border-radius: 999px; }
  .il-level-a1 { background: rgba(88,204,2,.2); color: #58cc02; }
  .il-level-a2 { background: rgba(28,176,246,.2); color: #1cb0f6; }
  .il-level-b1 { background: rgba(255,150,0,.2); color: #ff9600; }
  .il-level-b2 { background: rgba(165,96,232,.2); color: #a560e8; }

  .il-card-title { font-size: 14px; font-weight: 800; line-height: 1.3; }
  .il-card-desc { font-size: 12px; color: var(--text3); line-height: 1.4; flex: 1; }
  .il-card-bottom { display: flex; justify-content: space-between; align-items: center; }
  .il-star { color: var(--border); font-size: 14px; }
  .il-star-active { color: #ffd900; }
  .il-card-xp { font-size: 11px; font-weight: 700; color: #58cc02; font-family: var(--mono); }
  .il-card-cta {
    margin-top: 4px; font-size: 12px; font-weight: 700;
    color: var(--card-color, #58cc02); text-align: center;
    padding: 8px; background: color-mix(in srgb, var(--card-color, #58cc02) 10%, transparent);
    border-radius: 10px;
  }

  /* ── AI Banner ── */
  .il-ai-banner {
    background: linear-gradient(135deg, rgba(165,96,232,.15), rgba(28,176,246,.1));
    border: 1px solid rgba(165,96,232,.3); border-radius: 20px;
    padding: 20px 24px; display: flex; align-items: center;
    justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .il-ai-banner-text { display: flex; align-items: center; gap: 16px; }
  .il-ai-icon { font-size: 32px; }
  .il-ai-title { font-size: 16px; font-weight: 800; }
  .il-ai-desc { font-size: 12px; color: var(--text3); margin-top: 2px; }
  .il-ai-btn {
    background: linear-gradient(135deg, #a560e8, #1cb0f6);
    border: none; border-radius: 12px; color: #fff; font-weight: 800;
    font-size: 14px; padding: 12px 24px; cursor: pointer; font-family: var(--font);
    transition: all .2s; white-space: nowrap;
  }
  .il-ai-btn:hover { opacity: .85; transform: scale(1.03); }

  /* ── Модал ── */
  .il-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.75);
    display: none; align-items: center; justify-content: center; z-index: 2000;
  }
  .il-modal-overlay.active { display: flex; }
  .il-modal-box {
    background: var(--bg2); width: 90%; max-width: 560px;
    border-radius: 20px; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,.5);
  }
  .il-modal-header {
    padding: 18px 24px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 16px; font-weight: 800;
  }
  .il-modal-close { background: none; border: none; color: var(--text3); font-size: 20px; cursor: pointer; padding: 4px; }
  .il-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .il-modal-footer {
    padding: 16px 24px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 12px;
  }
  .il-field { display: flex; flex-direction: column; gap: 6px; }
  .il-field label { font-size: 12px; font-weight: 700; color: var(--text2); font-family: var(--mono); }
  .il-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .il-input, .il-select {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 10px; color: #fff; padding: 10px 14px;
    font-family: var(--font); font-size: 14px;
  }
  .il-input:focus, .il-select:focus { outline: none; border-color: #a560e8; }
  .il-cancel-btn {
    background: var(--bg3); border: 1px solid var(--border); color: var(--text2);
    border-radius: 10px; padding: 10px 20px; cursor: pointer; font-family: var(--font); font-weight: 600;
  }
  .il-gen-btn {
    background: linear-gradient(135deg, #a560e8, #1cb0f6);
    border: none; border-radius: 10px; color: #fff; font-weight: 800;
    padding: 10px 24px; cursor: pointer; font-family: var(--font); font-size: 14px;
    display: flex; align-items: center; gap: 6px;
  }
  .il-gen-progress { height: 6px; background: var(--bg3); border-radius: 999px; overflow: hidden; }
  .il-gen-progress-bar { height: 100%; background: linear-gradient(90deg, #a560e8, #1cb0f6); border-radius: 999px; width: 0; transition: width .2s; }
  .il-gen-status { font-size: 13px; color: var(--text3); font-family: var(--mono); margin-top: 8px; }
  .il-gen-error { color: #ff4b4b; font-size: 13px; background: rgba(255,75,75,.1); border-radius: 10px; padding: 10px 14px; }

  /* ── Урок ── */
  .il-lesson-frame { height: 100%; display: flex; flex-direction: column; }
  .il-lesson-topbar {
    padding: 12px 20px; background: var(--bg2); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
  }
  .il-back-btn {
    background: var(--bg3); border: 1px solid var(--border2);
    color: var(--text2); width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; flex-shrink: 0;
  }
  .il-lesson-progress-wrap { flex: 1; }
  .il-lesson-progress-bar { height: 8px; background: var(--bg3); border-radius: 999px; overflow: hidden; }
  .il-lesson-progress-fill { height: 100%; background: #58cc02; border-radius: 999px; transition: width .4s; }
  .il-hearts { font-size: 16px; letter-spacing: 2px; }
  .il-session-xp { font-weight: 800; color: #58cc02; font-size: 14px; font-family: var(--mono); white-space: nowrap; }

  .il-exercise-area { flex: 1; overflow-y: auto; padding: 24px; }

  /* ── Общие элементы упражнения ── */
  .il-ex-header { margin-bottom: 20px; }
  .il-ex-type-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 999px; padding: 4px 12px;
    font-size: 12px; font-weight: 700; font-family: var(--mono); color: var(--text2);
    margin-bottom: 10px;
  }
  .il-ex-title { font-size: 20px; font-weight: 800; margin: 0; }
  .il-quiz-counter { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-top: 4px; }

  /* ── Flashcard ── */
  .il-flashcard-ex { max-width: 600px; margin: 0 auto; }
  .il-fc-counter { font-size: 12px; color: var(--text3); font-family: var(--mono); }
  .il-fc-wrap { perspective: 1000px; margin: 20px 0; }
  .il-fc-card {
    width: 100%; min-height: 200px; cursor: pointer; position: relative;
  }
  .il-fc-inner {
    width: 100%; height: 100%; min-height: 200px;
    transition: transform .5s; transform-style: preserve-3d; position: relative;
  }
  .il-fc-front, .il-fc-back {
    position: absolute; inset: 0; min-height: 200px;
    background: var(--bg2); border: 2px solid var(--border);
    border-radius: 20px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 28px;
    backface-visibility: hidden;
  }
  .il-fc-back { transform: rotateY(180deg); background: var(--bg3); border-color: #58cc02; }
  .il-fc-inner[style*="rotateY(180deg)"] .il-fc-front { opacity: 0; }
  .il-fc-hint { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-bottom: 12px; }
  .il-fc-word { font-size: 36px; font-weight: 900; text-align: center; }
  .il-fc-translation { font-size: 22px; font-weight: 800; text-align: center; color: #58cc02; }
  .il-fc-example { font-size: 13px; color: var(--text3); margin-top: 12px; text-align: center; font-style: italic; }
  
  .il-fc-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .il-fc-nav-btn {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text2); padding: 10px 20px;
    cursor: pointer; font-family: var(--font); font-weight: 700; font-size: 13px;
    transition: all .2s;
  }
  .il-fc-nav-btn:disabled { opacity: .3; cursor: default; }
  .il-fc-nav-btn:not(:disabled):hover { background: var(--bg2); border-color: var(--duo-blue); }
  .il-fc-dots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .il-fc-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); transition: all .2s; }
  .il-fc-dot.active { background: #58cc02; transform: scale(1.3); }
  .il-fc-done-wrap { margin-top: 16px; display: flex; justify-content: center; }

  /* ── Quiz ── */
  .il-quiz-ex { max-width: 600px; margin: 0 auto; }
  .il-quiz-question { font-size: 20px; font-weight: 700; margin-bottom: 20px; line-height: 1.4; }
  .il-quiz-options { display: grid; gap: 10px; }
  .il-quiz-opt {
    padding: 14px 18px; border: 2px solid var(--border); border-radius: 14px;
    background: var(--bg2); color: #fff; cursor: pointer; text-align: left;
    font-family: var(--font); font-size: 14px; font-weight: 600;
    transition: all .15s;
  }
  .il-quiz-opt:not(:disabled):hover { border-color: #1cb0f6; background: rgba(28,176,246,.08); }
  .il-opt-correct { border-color: #58cc02 !important; background: rgba(88,204,2,.15) !important; }
  .il-opt-wrong { border-color: #ff4b4b !important; background: rgba(255,75,75,.15) !important; }
  .il-quiz-explanation {
    margin-top: 14px; background: var(--bg3); border-radius: 12px; padding: 14px;
    border-left: 3px solid #1cb0f6;
  }
  .il-exp-text { font-size: 13px; color: var(--text2); }

  /* ── Matching ── */
  .il-match-ex { max-width: 700px; margin: 0 auto; }
  .il-match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .il-match-col { display: flex; flex-direction: column; gap: 8px; }
  .il-match-item {
    padding: 12px 16px; background: var(--bg2); border: 2px solid var(--border);
    border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 14px;
    transition: all .2s; text-align: center;
  }
  .il-match-item:hover:not(.il-matched) { border-color: #1cb0f6; background: rgba(28,176,246,.08); }
  .il-match-item.il-selected { border-color: #1cb0f6; background: rgba(28,176,246,.15); }
  .il-match-item.il-match-ok { border-color: #58cc02; background: rgba(88,204,2,.15); cursor: default; opacity: .7; }
  .il-match-item.il-match-err { border-color: #ff4b4b; background: rgba(255,75,75,.15); animation: il-shake .4s; }
  .il-match-done-wrap { margin-top: 16px; display: flex; justify-content: center; }

  /* ── Fill Blank ── */
  .il-fb-ex { max-width: 600px; margin: 0 auto; }
  .il-fb-context {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 14px;
    padding: 20px; margin: 16px 0; font-size: 16px; line-height: 1.7;
  }
  .il-fb-line { margin-bottom: 4px; }
  .il-fb-hint { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-bottom: 16px; }
  .il-fb-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .il-fb-opt {
    padding: 12px 16px; border: 2px solid var(--border); border-radius: 12px;
    background: var(--bg2); color: #fff; cursor: pointer;
    font-family: var(--font); font-size: 14px; font-weight: 700;
    transition: all .15s;
  }
  .il-fb-opt:not(:disabled):hover { border-color: #1cb0f6; }
  .il-fb-result { margin-top: 12px; border-radius: 10px; padding: 12px 16px; }
  .il-result-ok { color: #58cc02; font-weight: 700; }
  .il-result-err { color: #ff4b4b; font-weight: 700; }

  /* ── Sentence Builder ── */
  .il-sb-ex { max-width: 640px; margin: 0 auto; }
  .il-sb-translation {
    background: var(--bg2); border-left: 3px solid #ff9600;
    border-radius: 0 12px 12px 0; padding: 14px 18px;
    font-size: 16px; font-weight: 700; color: #ff9600; margin: 16px 0;
  }
  .il-sb-built {
    min-height: 56px; background: var(--bg3); border: 2px dashed var(--border);
    border-radius: 14px; padding: 12px 16px; display: flex; flex-wrap: wrap;
    align-items: center; gap: 8px; margin-bottom: 16px;
  }
  .il-sb-placeholder { color: var(--text3); font-size: 14px; font-style: italic; }
  .il-sb-built-word {
    background: #1cb0f6; color: #000; font-weight: 800; border-radius: 8px;
    padding: 6px 12px; font-size: 14px;
  }
  .il-sb-words { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .il-sb-word {
    background: var(--bg2); border: 2px solid var(--border); border-radius: 10px;
    color: #fff; padding: 8px 16px; font-family: var(--font); font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all .15s;
  }
  .il-sb-word:not(:disabled):hover { border-color: #1cb0f6; transform: translateY(-2px); }
  .il-sb-word.il-word-used { opacity: .3; cursor: default; }
  .il-sb-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .il-sb-clear {
    background: var(--bg3); border: 1px solid var(--border); color: var(--text2);
    border-radius: 10px; padding: 10px 18px; cursor: pointer;
    font-family: var(--font); font-weight: 600;
  }
  .il-sb-check {
    background: #58cc02; border: none; color: #000; border-radius: 10px;
    padding: 10px 24px; font-family: var(--font); font-weight: 800; cursor: pointer;
    transition: all .2s;
  }
  .il-sb-check:not(:disabled):hover { background: #89e219; }
  .il-btn-disabled { opacity: .4; cursor: default !important; }
  .il-sb-result { margin-top: 12px; border-radius: 10px; padding: 12px 16px; }

  /* ── Кнопка продолжить ── */
  .il-continue-btn {
    background: #58cc02; border: none; border-radius: 14px;
    color: #000; padding: 14px 40px; font-family: var(--font);
    font-weight: 800; font-size: 16px; cursor: pointer; transition: all .2s;
  }
  .il-continue-btn:hover { background: #89e219; transform: scale(1.03); }

  /* ── Результат ── */
  .il-result-screen {
    max-width: 480px; margin: 0 auto; padding: 40px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
    text-align: center;
  }
  .il-result-emoji { font-size: 72px; animation: il-bounce .6s; }
  .il-result-title { font-size: 28px; font-weight: 900; margin: 0; }
  .il-result-stars { display: flex; gap: 8px; margin: 8px 0; }
  .il-result-star { font-size: 40px; color: var(--border); transition: color .3s; animation: il-star-pop .4s forwards; opacity: 0; }
  .il-result-star-active { color: #ffd900; }
  .il-result-lesson { color: var(--text3); font-size: 14px; font-family: var(--mono); }
  .il-result-stats { display: flex; gap: 16px; background: var(--bg2); border-radius: 20px; padding: 20px 28px; }
  .il-result-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .il-rs-value { font-size: 28px; font-weight: 900; }
  .il-rs-xp { color: #58cc02; }
  .il-rs-ok { color: #58cc02; }
  .il-rs-err { color: #ff4b4b; }
  .il-rs-label { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .il-result-actions { display: flex; gap: 12px; margin-top: 8px; }
  .il-result-back-btn {
    background: var(--bg3); border: 1px solid var(--border); color: var(--text2);
    border-radius: 12px; padding: 12px 24px; cursor: pointer;
    font-family: var(--font); font-weight: 700; font-size: 14px;
  }
  .il-result-retry-btn {
    background: #1cb0f6; border: none; color: #000; border-radius: 12px;
    padding: 12px 24px; cursor: pointer; font-family: var(--font);
    font-weight: 800; font-size: 14px;
  }

  /* ── Анимации ── */
  @keyframes il-shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  @keyframes il-bounce {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  @keyframes il-star-pop {
    0% { opacity: 0; transform: scale(0) rotate(-30deg); }
    70% { transform: scale(1.3) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0); }
  }
  `;
  document.head.appendChild(s);
}

// ─── Точка входа ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);