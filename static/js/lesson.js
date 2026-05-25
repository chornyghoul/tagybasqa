/**
 * TAGYBASQA — lesson.js
 * 
 * Точка входа для вкладки "Интерактивный урок".
 * Импортирует и инициализирует плеер «Три в одном» (lecture-player.js)
 * а также каталог интерактивных уроков из Firestore (interactiveLessons).
 *
 * СТРУКТУРА ДАННЫХ Firestore:
 *   collection "lectures"      → полные лекции с таймлайном (для плеера)
 *   collection "interactiveLessons" → карточки коротких интерактивных уроков
 */

// Плеер «Три в одном» — управляет вкладкой #view-story полностью
// Просто импортируем — инициализация происходит внутри по DOMContentLoaded
import "./lecture-player.js";

// ─────────────────────────────────────────────────────────────────────────────
// Если вам нужно дополнительно показывать интерактивные уроки (collection
// "interactiveLessons") в той же вкладке — раскомментируйте блок ниже и
// укажите нужный контейнер-селектор.
// ─────────────────────────────────────────────────────────────────────────────
// import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
// import { getFirestore, collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
//
// const firebaseConfig = { ... }; // ваш конфиг
// const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
// async function loadInteractiveLessons() {
//   const snap = await getDocs(query(collection(db, "interactiveLessons")));
//   const lessons = [];
//   snap.forEach(d => lessons.push({ id: d.id, ...d.data() }));
//   return lessons;
// }