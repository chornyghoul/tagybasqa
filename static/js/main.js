// main.js — ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ (2025)

let currentUser = null;  // ← глобальная переменная (можно оставить, но мы будем читать из localStorage)

const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

// ГЛАВНАЯ ФУНКЦИЯ — всегда читает из localStorage
function updateAuthUI() {
  console.log('→ updateAuthUI() вызвана');

  // ВСЕГДА читаем свежие данные из localStorage
  const stored = localStorage.getItem('currentUser');  // ← только этот ключ!
  const user = stored ? JSON.parse(stored) : null;

  console.log('Пользователь из localStorage:', user);

  const authBlock = document.getElementById('authButtons');
  if (!authBlock) {
    console.warn('Блок #authButtons не найден!');
    return;
  }

  const signupBtn  = authBlock.querySelector('.hero-header__signup');
  const profileBtn = authBlock.querySelector('.hero-header__profile');
  const menuBtn    = authBlock.querySelector('.hero-header__menu-btn');

  if (user) {
    console.log('АВТОРИЗОВАН:', user.name || user.email);

    document.body.classList.remove('guest');
    document.body.classList.add('authenticated');

    if (signupBtn)  signupBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = isMobile() ? 'none' : 'flex';
    if (menuBtn) {
      menuBtn.style.display = isMobile() ? 'flex' : 'none';
      menuBtn.onclick = toggleMenu;
    }

    if (isMobile()) createMobileMenu(user);  // передаём user

  } else {
    console.log('ГОСТЬ — показываем кнопку регистрации');

    document.body.classList.remove('authenticated');
    document.body.classList.add('guest');

    if (signupBtn) {
      signupBtn.style.display = 'flex';
      console.log('Кнопка "Регистрация" — ВИДИМА');
    }
    if (profileBtn) profileBtn.style.display = 'none';
    if (menuBtn)    menuBtn.style.display = 'none';

    // Очищаем мобильное меню
    const menu = document.getElementById('mobileMenu');
    if (menu) {
      menu.innerHTML = '';
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
    }
  }
}

// Создание мобильного меню — принимаем user как параметр
function createMobileMenu(user) {
  if (!user || !isMobile()) return;

  const menu = document.getElementById('mobileMenu');
  const content = menu?.querySelector('.mobile-menu__content');
  if (!content) return;

  content.innerHTML = `
    <div class="mobile-menu__handle"></div>
    <div class="mobile-menu__inner">
      <div class="mobile-menu__header">
        <span class="mobile-menu__greeting">Привет, ${user.name || 'Друг'}!</span>
        <button class="mobile-menu__close" aria-label="Закрыть"><i class="fa fa-times"></i></button>
      </div>
      <nav class="mobile-menu__nav">
        <ul class="mobile-menu__list">
          <li><a href="index.html"><i class="fa fa-home"></i> Главная</a></li>
          <li><a href="./specialties.html"><i class="fa fa-book"></i> Спецальности</a></li>
          <li><a href="games/index.html"><i class="fa fa-gamepad"></i> Игры</a></li>
          <li><a href="tests/index.html"><i class="fa fa-question-circle"></i> Тесты</a></li>
          <li><a href="presentations/index.html"><i class="fa fa-slideshare"></i> Презентации</a></li>
          <div class="mobile-menu__divider"></div>
          <li><a href="./profile.html"><i class="fa fa-user"></i> Профиль</a></li>
          <li><a href="./dashboard.html"><i class="fa fa-tachometer-alt"></i> Кабинет</a></li>
          <li><a href="./settings.html"><i class="fa fa-cog"></i> Настройки</a></li>
          <div class="mobile-menu__divider"></div>
          <li><a href="#" onclick="logout(event)" style="color:#ff4444">
            <i class="fa fa-sign-out-alt"></i> Выйти
          </a></li>
        </ul>
      </nav>
    </div>
  `;

  content.querySelector('.mobile-menu__close').onclick = toggleMenu;
  menu.querySelector('.mobile-menu__overlay')?.addEventListener('click', toggleMenu);
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const icon = document.querySelector('.hero-header__menu-btn i');
  const isOpen = menu.classList.toggle('open');

  icon?.classList.toggle('fa-bars', !isOpen);
  icon?.classList.toggle('fa-times', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// ВЫХОД — ИСПРАВЛЕНО НА 100%
function logout(e) {
  e.preventDefault();

  if (!confirm('Выйти из аккаунта?')) {
    console.log('Выход отменён');
    return;
  }

  console.log('Удаляем currentUser из localStorage...');
  localStorage.removeItem('currentUser');  // ← только этот ключ!

  console.log('localStorage.currentUser после удаления:', localStorage.getItem('currentUser')); // → null

  updateAuthUI();  // ← теперь точно увидит, что пользователя нет

  const menu = document.getElementById('mobileMenu');
  if (menu?.classList.contains('open')) {
    console.log('Меню закрыто');
    toggleMenu();
  }

  console.log('УСПЕШНЫЙ ВЫХОД');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  console.log('Страница загружена — проверяем авторизацию');
  updateAuthUI();

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(updateAuthUI, 150);
  });

  window.addEventListener('focus', () => setTimeout(updateAuthUI, 100));
  window.addEventListener('storage', updateAuthUI);
});

// Глобальные функции
window.logout = logout;
window.toggleMenu = toggleMenu;