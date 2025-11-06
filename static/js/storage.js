// Простая прослойка хранения (эмуляция бэкенда) на localStorage
window.Store = (function(){
  const KEY_USER = 'itch.user';
  const KEY_MATERIALS = 'itch.materials';
  const KEY_TESTS = 'itch.tests';

  const get = (k, def) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; }
  };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // Инициализация контента дефолтными данными
  function ensureContent() {
    if (!get(KEY_MATERIALS)) set(KEY_MATERIALS, AppData.materials);
    if (!get(KEY_TESTS)) set(KEY_TESTS, AppData.tests);
  }

  function currentUser() { return get(KEY_USER, null); }
  function login(user) { set(KEY_USER, user); }
  function logout() { localStorage.removeItem(KEY_USER); }

  function allMaterials() { ensureContent(); return get(KEY_MATERIALS, {}); }
  function saveMaterials(all) { set(KEY_MATERIALS, all); }
  function allTests() { ensureContent(); return get(KEY_TESTS, {}); }
  function saveTests(all) { set(KEY_TESTS, all); }

  return { currentUser, login, logout, allMaterials, saveMaterials, allTests, saveTests, ensureContent };
})();
