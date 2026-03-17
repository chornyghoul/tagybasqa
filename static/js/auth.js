// auth.js — только UI и меню

let currentUser = null; // будет обновляться из firebase.js

function getCurrentUser() {
  try {
    const data = localStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById('authButtons');
  if (!authButtons) return;

  currentUser = getCurrentUser();

  if (currentUser) {
    authButtons.innerHTML = `
      <button class="hero-header__menu-btn" onclick="toggleMenu()" title="Меню">
        <i class="fa fa-bars"></i>
      </button>
    `;
    createMobileMenu();
  } else {
    authButtons.innerHTML = `
      <a class="hero-header__signup" href="">
        <span class="hero-header__icon">✺</span>
        <span>Регистрация</span>
      </a>
    `;
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.remove();
  }
}

// Остальные функции (createMobileMenu, getMenuHTML, toggleMenu) — оставь как есть
// logout() замени на вызов window.logout()