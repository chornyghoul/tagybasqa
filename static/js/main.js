// Инициализация базы данных пользователей в localStorage
function initUserDatabase() {
    if (!localStorage.getItem('users')) {
        // Создаем тестовых пользователей
        const testUsers = [
            {
                id: '1',
                name: 'Иван Студентов',
                email: 'admin@qwer.ru         ',
                password: 'admin',
                role: 'student'
            }
        ];
        localStorage.setItem('users', JSON.stringify(testUsers));
    }
}

// Получение всех пользователей из базы данных
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// Сохранение пользователя в базу данных
function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
}

// Поиск пользователя по email
function findUserByEmail(email) {
    const users = getUsers();
    return users.find(user => user.email === email);
}

// Проверка, существует ли пользователь с таким email
function isUserExists(email) {
    return findUserByEmail(email) !== undefined;
}

// Валидация формы регистрации
function validateRegistrationForm(formData) {
    const errors = {};
    
    // Проверка ФИО
    if (!formData.name.trim()) {
        errors.name = 'ФИО обязательно для заполнения';
    } else if (formData.name.trim().length < 2) {
        errors.name = 'ФИО должно содержать минимум 2 символа';
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
        errors.email = 'Email обязателен для заполнения';
    } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Введите корректный email';
    } else if (isUserExists(formData.email)) {
        errors.email = 'Пользователь с таким email уже существует';
    }
    
    // Проверка пароля
    if (!formData.password) {
        errors.password = 'Пароль обязателен для заполнения';
    } else if (formData.password.length < 6) {
        errors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    // Проверка подтверждения пароля
    if (!formData.confirmPassword) {
        errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают';
    }
    
    return errors;
}

// Валидация формы входа
function validateLoginForm(formData) {
    const errors = {};
    
    // Проверка email
    if (!formData.email.trim()) {
        errors.email = 'Email обязателен для заполнения';
    } else if (!isUserExists(formData.email)) {
        errors.email = 'Пользователь с таким email не найден';
    }
    
    // Проверка пароля
    if (!formData.password) {
        errors.password = 'Пароль обязателен для заполнения';
    } else {
        const user = findUserByEmail(formData.email);
        if (user && user.password !== formData.password) {
            errors.password = 'Неверный пароль';
        }
    }
    
    return errors;
}

// Отображение ошибок в форме
function displayFormErrors(formId, errors) {
    // Скрыть все сообщения об ошибках
    const errorElements = formId === 'loginForm' 
        ? document.querySelectorAll('#loginForm .error-message')
        : document.querySelectorAll('#regForm .error-message');
    
    errorElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Показать ошибки
    Object.keys(errors).forEach(field => {
        let errorElement;
        if (formId === 'loginForm') {
            // Для формы логина используем другие ID
            errorElement = document.getElementById(`login${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
        } else {
            // Для формы регистрации обычные ID
            errorElement = document.getElementById(`${field}Error`);
        }
        
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.style.display = 'block';
        }
    });
}


// Открытие модального окна
function openModal(modalId) {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('open');
    });
    document.getElementById(modalId).classList.add('open');
}

// Закрытие модального окна
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// Обновление интерфейса в зависимости от состояния авторизации
function updateUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Пользователь авторизован
        document.querySelectorAll('[data-guest="true"]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('[data-auth="true"]').forEach(el => {
            el.style.display = 'flex';
        });
        document.getElementById('userContent').style.display = 'flex';
        
        // Обновление информации о пользователе
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role === 'student' ? 'Студент' : 'Преподаватель';
        document.getElementById('userRole').className = `user-role ${currentUser.role}`;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
        // Пользователь не авторизован
        document.querySelectorAll('[data-guest="true"]').forEach(el => {
            el.style.display = 'flex';
        });
        document.querySelectorAll('[data-auth="true"]').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('userContent').style.display = 'none';
    }
}

// Выход из системы
function logout() {
    localStorage.removeItem('currentUser');
    updateUI();
    showNotification('Вы успешно вышли из системы');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация базы данных
    initUserDatabase();
    
    // Обновление интерфейса
    updateUI();
    
    // Обработчики для кнопок открытия модальных окон
    document.getElementById('openRegister').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('registerModal');
    });
    
    document.getElementById('openLoginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('loginModal');
    });
    
    document.getElementById('openLogin').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });
    
    document.getElementById('openRegisterFromLogin').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });
    
    // Обработчики для кнопок закрытия модальных окон
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('open');
            });
        });
    });
    
    // Обработчик формы регистрации
    document.getElementById('regForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: this.name.value,
            email: this.email.value,
            password: this.password.value,
            confirmPassword: this.confirmPassword.value,
            role: this.role.value
        };
        
        const errors = validateRegistrationForm(formData);
        
        if (Object.keys(errors).length === 0) {
            // Сохранение пользователя
            const user = {
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };
            
            saveUser(user);
            
            // Закрытие модального окна и очистка формы
            closeModal('registerModal');
            this.reset();
            
            // Показать уведомление об успешной регистрации
        } else {
            displayFormErrors('regForm', errors);
        }
    });
    
    // Обработчик формы входа
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            email: this.email.value,
            password: this.password.value
        };
        
        const errors = validateLoginForm(formData);
        
        if (Object.keys(errors).length === 0) {
            // Авторизация пользователя
            const user = findUserByEmail(formData.email);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Закрытие модального окна и очистка формы
            closeModal('loginModal');
            this.reset();
            
            // Обновление интерфейса
            updateUI();
            
            // Показать уведомление об успешном входе
            showNotification(`Добро пожаловать, ${user.name}!`);
        } else {
            displayFormErrors('loginForm', errors);
        }
    });
    
    // Обработчик кнопки выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Обработчик для кнопки "Кабинет"
    document.querySelector('.hero-header__cabinet').addEventListener('click', function(e) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            e.preventDefault();
            showNotification('Пожалуйста, войдите в систему', 'error');
        }
    });
    
    // Обработчик для кнопки "Забыли пароль"
    document.getElementById('forgotPassword').addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('Функция восстановления пароля временно недоступна', 'error');
    });
    
    // Закрытие модальных окон по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('open');
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const specialtyBtns = document.querySelectorAll('.specialty-btn');
    const specialtyCards = document.querySelectorAll('.specialty-card');
    const specialtiesStack = document.querySelector('.specialties-stack');

    // Изначально активна первая карточка
    specialtyCards[0].classList.add('active');

    function activateButton(btn) {
        specialtyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    function showAllCards() {
        specialtiesStack.classList.add('show-all');
        specialtyCards.forEach(card => card.classList.remove('active'));
    }

    function showSingleCard(targetId) {
        specialtiesStack.classList.remove('show-all');
        specialtyCards.forEach(card => {
            card.classList.remove('active');
            if (card.getAttribute('data-id') === targetId) {
                card.classList.add('active');
            }
        });
    }

    specialtyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            activateButton(this);

            if (targetId === 'all') {
                showAllCards();
            } else {
                showSingleCard(targetId);
            }
        });
    });
});