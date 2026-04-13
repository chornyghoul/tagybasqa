import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signOut, deleteUser
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc,
    collection, addDoc, updateDoc, deleteDoc,
    increment, arrayUnion, arrayRemove,
    serverTimestamp, query, orderBy, onSnapshot,
    where, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAywbSZkiReHjTq4oc46Kbw9iZ0iDHVTpY",
    authDomain: "pystart-dd2db.firebaseapp.com",
    projectId: "pystart-dd2db",
    storageBucket: "pystart-dd2db.firebasestorage.app",
    messagingSenderId: "9188811255",
    appId: "1:9188811255:web:6f7280f1f7f67b80d90ef2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ─────────────────────────────────────────
// АВТОРИЗАЦИЯ
// ─────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes('auth.html');
    const isIndexPage = path.includes('index.html') || path === '/' || path.endsWith('/');

    if (user) {
        if (isAuthPage) { window.location.href = './index.html'; return; }

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Выйти из аккаунта?')) {
                signOut(auth).then(() => { window.location.href = './auth.html'; });
            }
        });

        loadUserProfile(user);
        setupFeed(user);
        setupSearch(user);
        setupSuggestedUsers(user);

        if (isIndexPage) {
            loadPlatformStats();          // УЛУЧШЕНИЕ 6: статистика платформы
            loadUserCourses(user);
            loadAllPublicCourses();
            loadUserProgress(user);
        }

    } else {
        if (!isAuthPage) { window.location.href = './auth.html'; return; }
        document.getElementById('global-preloader')?.classList.add('hidden');
    }
});

// ─────────────────────────────────────────
// УЛУЧШЕНИЕ 6: СТАТИСТИКА ПЛАТФОРМЫ
// ─────────────────────────────────────────
async function loadPlatformStats() {
    const container = document.getElementById('platformStats');
    if (!container) return;

    try {
        const [coursesSnap, usersSnap, quizzesSnap] = await Promise.all([
            getDocs(query(collection(db, "courses"), where("status", "==", "Открытый"))),
            getDocs(query(collection(db, "users"), limit(200))),
            getDocs(query(collection(db, "quizzes"), where("visibility", "==", "public")))
        ]);

        const coursesCount = coursesSnap.size;
        const usersCount = usersSnap.size;
        const quizzesCount = quizzesSnap.size;

        container.innerHTML = `
            <div class="stats-strip">
                <div class="stat-chip">
                    <span class="stat-chip-num">${usersCount}</span>
                    <span class="stat-chip-label">Студентов</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip-num">${coursesCount}</span>
                    <span class="stat-chip-label">Курсов</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip-num">${quizzesCount}</span>
                    <span class="stat-chip-label">Квизов</span>
                </div>
                <div class="stat-chip">
                    <span class="stat-chip-num" style="color:var(--green);">онлайн</span>
                    <span class="stat-chip-label">Статус</span>
                </div>
            </div>`;
    } catch (e) {
        console.error("Ошибка загрузки статистики:", e);
    }
}

// ─────────────────────────────────────────
// ПРОФИЛЬ
// ─────────────────────────────────────────
function loadUserProfile(user) {
    const userDocRef = doc(db, "users", user.uid);
    const profileName = document.querySelector('.user-name-row h1');
    const profileHandle = document.querySelector('.handle');
    const profileAvatar = document.querySelector('.main-avatar');
    const userPostAvatar = document.getElementById('userPostAvatar');
    const defaultName = user.email ? user.email.split('@')[0] : 'Пользователь';
    let currentAvatarData = null;

    const renderAvatar = (avatar, el) => {
        if (!el) return;
        el.innerHTML = '';
        el.style.cssText = '';
        if (!avatar) return;
        if ([...avatar].length <= 2) {
            el.textContent = avatar;
            el.style.fontSize = el.classList.contains('main-avatar') ? '32px' : '18px';
        } else {
            el.style.backgroundImage = `url('${avatar}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
        }
    };

    try {
        const cached = JSON.parse(localStorage.getItem('lastKnownProfile'));
        if (cached) {
            currentAvatarData = cached.avatar;
            if (profileName && cached.name) profileName.textContent = cached.name;
            if (profileHandle && cached.handle) profileHandle.textContent = cached.handle;
            renderAvatar(cached.avatar, profileAvatar);
            renderAvatar(cached.avatar, userPostAvatar);
            updateVerifiedBadge(cached);
            renderProfileStats(cached);
        }
    } catch { }

    let isFirstLoad = true;

    onSnapshot(userDocRef, snap => {
        if (snap.exists()) {
            const data = snap.data();
            currentAvatarData = data.avatar;
            localStorage.setItem('lastKnownProfile', JSON.stringify(data));

            if (profileName) profileName.textContent = data.name || defaultName;
            if (profileHandle) profileHandle.textContent = data.handle || `@${defaultName}`;

            if (data.avatar) {
                renderAvatar(data.avatar, profileAvatar);
                renderAvatar(data.avatar, userPostAvatar);
            } else {
                const initial = (data.name || defaultName)[0].toUpperCase();
                [profileAvatar, userPostAvatar].forEach(el => {
                    if (!el) return;
                    el.innerHTML = '';
                    el.textContent = initial;
                    el.style.fontSize = '18px';
                    el.style.fontWeight = '700';
                    el.style.color = 'var(--text)';
                    el.style.background = 'var(--accent-dim)';
                });
            }

            updateVerifiedBadge(data);
            renderProfileStats(data);
        } else {
            if (profileName) profileName.textContent = defaultName;
            if (profileHandle) profileHandle.textContent = `@${defaultName}`;
            setDoc(userDocRef, {
                name: defaultName,
                handle: `@${defaultName}`,
                followers: 0,
                following: 0,
                createdAt: serverTimestamp()
            }, { merge: true });
        }

        if (isFirstLoad) {
            document.getElementById('global-preloader')?.classList.add('hidden');
            isFirstLoad = false;
        }
    }, () => {
        document.getElementById('global-preloader')?.classList.add('hidden');
    });

    const editModal = document.getElementById('editProfileModal');
    const cancelBtn = document.getElementById('cancelProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const nameInp = document.getElementById('editNameInput');
    const handleInp = document.getElementById('editHandleInput');
    const avatarPreview = document.getElementById('editAvatarPreview');
    const avatarInp = document.getElementById('avatarUrlInput');

    document.querySelector('.edit-profile-btn')?.addEventListener('click', () => {
        if (profileName) nameInp.value = profileName.textContent;
        if (profileHandle) handleInp.value = profileHandle.textContent.replace('@', '');
        if (avatarInp) avatarInp.value = currentAvatarData || '';
        renderAvatarPreview(currentAvatarData, avatarPreview);
        editModal?.classList.add('active');
    });

    cancelBtn?.addEventListener('click', () => editModal?.classList.remove('active'));
    window.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('active'); });
    avatarInp?.addEventListener('input', e => renderAvatarPreview(e.target.value.trim(), avatarPreview));

    saveBtn?.addEventListener('click', async () => {
        const name = nameInp?.value.trim();
        const handle = handleInp?.value.trim();
        if (!name) { shake(nameInp); return; }
        if (!handle) { shake(handleInp); return; }

        saveBtn.textContent = 'Сохранение...';
        saveBtn.disabled = true;

        const updateData = {
            name,
            handle: `@${handle.replace('@', '').toLowerCase()}`,
            avatar: avatarInp?.value.trim() || ''
        };

        try {
            await setDoc(userDocRef, updateData, { merge: true });
            const cache = JSON.parse(localStorage.getItem('lastKnownProfile') || '{}');
            localStorage.setItem('lastKnownProfile', JSON.stringify({ ...cache, ...updateData }));
            showToast('Профиль сохранён ✓');
            editModal.classList.remove('active');
            window.location.reload();
        } catch (err) {
            alert('Ошибка: ' + err.message);
            saveBtn.textContent = 'Сохранить';
            saveBtn.disabled = false;
        }
    });

    document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
        if (!confirm('Удалить аккаунт навсегда? Это действие необратимо.')) return;
        const btn = document.getElementById('deleteAccountBtn');
        btn.textContent = 'Удаление...';
        btn.disabled = true;
        try {
            await deleteDoc(doc(db, "users", user.uid));
            await deleteUser(user);
            window.location.href = './auth.html';
        } catch (err) {
            if (err.code === 'auth/requires-recent-login') {
                alert('Для удаления выйдите и войдите снова.');
            } else { alert('Ошибка: ' + err.message); }
            btn.textContent = 'Удалить мой аккаунт навсегда';
            btn.disabled = false;
        }
    });
}

function renderProfileStats(data) {
    const statsRow = document.querySelector('.stats-row');
    if (!statsRow) return;
    statsRow.innerHTML = `
        <span><strong>${data.followers || 0}</strong> подписчиков</span>
        <span><strong>${data.following || 0}</strong> подписок</span>
    `;
}

function renderAvatarPreview(val, el) {
    if (!el) return;
    el.innerHTML = '';
    el.style.backgroundImage = 'none';
    el.style.background = 'var(--bg3)';
    if (!val) { el.textContent = '😶'; el.style.fontSize = '22px'; return; }
    if ([...val].length <= 2) { el.textContent = val; el.style.fontSize = '22px'; }
    else {
        el.style.backgroundImage = `url('${val}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
    }
}

function updateVerifiedBadge(userData) {
    const badge = document.getElementById('verified-badge');
    const createCourseAction = document.getElementById('createCourseAction');
    const isVerified = userData?.verified === true;
    if (badge) { badge.style.filter = isVerified ? 'none' : 'grayscale(100%)'; badge.style.opacity = isVerified ? '1' : '0.4'; }
    if (createCourseAction) createCourseAction.style.display = isVerified ? 'block' : 'none';
}

// ─────────────────────────────────────────
// УЛУЧШЕНИЕ 3: СТРИК + ПРОГРЕСС ОБУЧЕНИЯ
// ─────────────────────────────────────────
async function loadUserProgress(user) {
    const container = document.getElementById('enrolledCoursesContainer');
    if (!container) return;

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
            renderEmptyState(container, '📚', 'Вы ещё не начали ни одного курса', 'Перейти к курсам', () => {
                document.querySelector('.tab-btn[data-target="view-courses"]')?.click();
            });
            return;
        }

        const userData = userSnap.data();
        const courseProgress = userData.courseProgress || {};
        const enrolledCourseIds = Object.keys(courseProgress);

        renderStreakWidget(courseProgress, userData);

        if (enrolledCourseIds.length === 0) {
            renderEmptyState(container, '📚', 'Вы ещё не начали ни одного курса', 'Перейти к курсам', () => {
                document.querySelector('.tab-btn[data-target="view-courses"]')?.click();
            });
            return;
        }

        container.innerHTML = '';

        for (const courseId of enrolledCourseIds) {
            const courseSnap = await getDoc(doc(db, "courses", courseId));
            if (courseSnap.exists()) {
                const courseData = courseSnap.data();
                let totalLessons = 0;
                if (courseData.modules) {
                    courseData.modules.forEach(mod => {
                        if (mod.lessons) totalLessons += mod.lessons.length;
                    });
                }
                const completedLessons = courseProgress[courseId].length || 0;
                let percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                if (percent > 100) percent = 100;
                renderProgressCard(courseId, courseData, completedLessons, totalLessons, percent, container);
            }
        }
    } catch (error) {
        console.error("Ошибка при загрузке прогресса:", error);
        container.innerHTML = '<div class="empty-state">Не удалось загрузить данные прогресса.</div>';
    }
}

function renderStreakWidget(courseProgress, userData) {
    const streakContainer = document.getElementById('streakWidget');
    if (!streakContainer) return;

    const streak = userData.streak || 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // "2026-04-13"

    // Массив дат, в которые пользователь заходил (или выполнял активность)
    // Это главный массив, который нужно заполнять при заходе пользователя
    const visitedDates = courseProgress?.visitedDates || userData?.visitedDates || [];

    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    // Находим индекс сегодняшнего дня (Понедельник = 0)
    const todayIdx = (today.getDay() + 6) % 7;

    // Генерируем даты всей недели (с понедельника)
    const weekDates = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - todayIdx);

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDates.push(d.toISOString().split('T')[0]);
    }

    // Создаём HTML дней
    const daysHTML = days.map((dayName, i) => {
        const dateStr = weekDates[i];
        const isVisited = visitedDates.includes(dateStr);   // ← главный момент
        const isToday = dateStr === todayStr;

        let className = 'streak-day';
        if (isVisited) className += ' done';
        if (isToday) className += ' today';

        return `
            <div class="${className}">
                <div class="streak-day-dot"></div>
                <div class="streak-day-name">${dayName}</div>
            </div>
        `;
    }).join('');

    streakContainer.innerHTML = `
        <div class="streak-widget">
            <div class="streak-left">
                <div class="streak-fire">🔥</div>
                <div>
                    <div class="streak-num">${streak}</div>
                    <div class="streak-text">дней подряд</div>
                </div>
            </div>
            <div class="streak-days-col">
                <div class="streak-label-top">Эта неделя</div>
                <div class="streak-days-row">
                    ${daysHTML}
                </div>
            </div>
        </div>
    `;
}
function renderProgressCard(courseId, courseData, completed, total, percent, container) {
    const isCompleted = percent === 100;

    let iconHtml = '';
    if (courseData.cover && courseData.cover.startsWith('http')) {
        iconHtml = `<img src="${courseData.cover}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;" alt="">`;
    } else if (courseData.emoji) {
        iconHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;">${courseData.emoji}</div>`;
    } else {
        const initial = (courseData.title || 'К').charAt(0).toUpperCase();
        iconHtml = `<div style="width:100%;height:100%;background:var(--accent-dim);color:var(--text);font-size:42px;font-weight:700;display:flex;align-items:center;justify-content:center;border-radius:16px;">${initial}</div>`;
    }

    const title = courseData.title || 'Курс без названия';
    const color = isCompleted ? 'var(--gold)' : 'var(--text)';
    const hasCertificate = !!courseData.certificate;

    container.insertAdjacentHTML('beforeend', `
        <a href="./course.html?id=${courseId}" 
           class="progress-card course-card-modern"
           style="text-decoration:none;color:inherit;">
            
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden;cursor:pointer;min-height:260px;">
                
                <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;">
                    <div class="pc-icon" style="width:72px;height:72px;flex-shrink:0;border-radius:16px;overflow:hidden;background:var(--bg2);box-shadow:0 4px 16px rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;">
                        ${iconHtml}
                    </div>
                    
                    <div style="flex:1;min-width:0;">
                        <div class="course-title-modern" style="font-size:18px;font-weight:700;line-height:1.3;margin-bottom:6px;color:var(--text);">
                            ${escHtml(title)}
                        </div>
                        <div style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:.05em;margin-bottom:16px;">
                            ${completed} / ${total} уроков пройдено
                        </div>
                        
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="flex:1;height:8px;background:var(--bg3);border-radius:9999px;position:relative;overflow:hidden;">
                                <div class="pc-bar-fill" 
                                     style="height:100%;width:${percent}%;background:${color};transition:width .4s cubic-bezier(0.34,1.56,0.64,1);">
                                </div>
                            </div>
                            <div class="pc-percent" 
                                 style="font-family:var(--mono);font-size:17px;font-weight:700;color:${color};white-space:nowrap;min-width:48px;text-align:right;">
                                ${percent}%
                            </div>
                        </div>
                    </div>
                </div>

                ${isCompleted ? `
                <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;font-weight:500;color:var(--gold);text-transform:uppercase;letter-spacing:.12em;">
                        <div style="width:8px;height:8px;background:var(--gold);border-radius:50%;box-shadow:0 0 0 3px var(--gold)"></div>
                        Курс завершен
                    </div>
                    ${hasCertificate ? `
                    <button onclick="event.stopImmediatePropagation(); event.preventDefault(); downloadCertificate('${courseId}');"
                            style="background: var(--green);color:white;border:none;padding:9px 20px;border-radius:9999px;font-family:var(--mono);font-size:11px;font-weight:700;letter-spacing:.08em;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:all .2s ease;">
                        Скачать сертификат
                    </button>` : ''}
                </div>` : ''}
            </div>
        </a>
    `);
}

window.downloadCertificate = async function (courseId) {
    const user = auth.currentUser;
    if (!user) return alert('Сначала войдите в аккаунт');

    try {
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        const course = courseSnap.data();

        if (!course.certificate) {
            return alert('Для этого курса сертификат ещё не настроен');
        }

        const link = document.createElement('a');
        link.href = course.certificate;
        link.download = `Сертификат_${course.title || 'Курс'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('✅ Сертификат скачивается...');
    } catch (err) {
        console.error(err);
        alert('Не удалось скачать сертификат');
    }
};

// ─────────────────────────────────────────
// УЛУЧШЕНИЕ 1: МОИ КУРСЫ С ПРОГРЕСС-БАРОМ
// ─────────────────────────────────────────
async function loadUserCourses(user) {
    const container = document.getElementById('myCoursesContainer');
    if (!container) return;

    try {
        const snap = await getDocs(query(collection(db, "courses"), where("uid", "==", user.uid)));

        if (snap.empty) {
            renderEmptyState(container, '✏️', 'Вы ещё не создали ни одного курса', 'Создать первый курс', () => {
                window.location.href = './create-course.html';
            });
            return;
        }

        let html = '<div class="courses-grid">';

        // Используем for...of, чтобы дождаться ответа от функции рейтинга
        for (const d of snap.docs) {
            const c = d.data();
            const id = d.id;
            const isDraft = c.status === 'Черновик';

            const studentsCount = c.studentsCount || 0;
            const modules = c.modules?.length || 0;

            // Получаем реальный рейтинг из БД
            let ratingText = await getCourseAverageRating(db, id);
            ratingText = ratingText.replace('★ ', ''); // Оставляем только число для этого блока

            html += `
                <div class="course-card modern" onclick="window.viewCourse('${id}')">
                    <div class="card-header">
                        <span class="course-category">${escHtml(c.category || 'Общее')}</span>
                        <div class="card-actions-top">
                            <span class="status-dot ${isDraft ? 'draft' : 'published'}" title="${isDraft ? 'Черновик' : 'Опубликован'}"></span>
                            <button onclick="event.stopImmediatePropagation(); window.deleteCourse('${id}')"
                                    class="delete-course-btn" title="Удалить курс">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <div class="course-icon-main" style="overflow:hidden;">
    ${c.cover && c.cover.startsWith('http') ? `<img src="${c.cover}" style="width:100%;height:100%;object-fit:cover;display:block;">` : (c.emoji || '<div style="width:100%;height:100%;background:var(--bg3);"></div>')}
</div>
                        <h3 class="course-title-modern">${escHtml(c.title || 'Без названия')}</h3>
                        <p class="course-description-modern">${escHtml((c.tagline || c.description || '').substring(0, 70))}...</p>
                    </div>

                    <div class="card-stats">
                        <div class="stat-item">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <span>${ratingText}</span>
                        </div>
                        <div class="stat-item">
                            <span>${modules} модулей</span>
                        </div>
                        <div class="stat-item">
                            <span>${studentsCount} студентов</span>
                        </div>
                    </div>

                    <div class="card-footer-modern">
                        <button onclick="event.stopImmediatePropagation(); window.editCourse('${id}')" class="btn-secondary-modern">
                            Настроить
                        </button>
                        <button onclick="event.stopImmediatePropagation(); window.viewCourse('${id}')" class="btn-primary-modern">
                            Открыть →
                        </button>
                    </div>
                </div>`;
        }

        container.innerHTML = html + '</div>';
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="empty-state">Ошибка загрузки курсов</div>';
    }
}

// ─────────────────────────────────────────
// ВСЕ ОТКРЫТЫЕ КУРСЫ С ПРОГРЕСС-БАРОМ И РЕЙТИНГОМ
// ─────────────────────────────────────────
async function loadAllPublicCourses() {
    const container = document.getElementById('publicCoursesContainer');
    if (!container) return;

    let courseProgress = {};
    const user = auth.currentUser;
    if (user) {
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) courseProgress = userSnap.data().courseProgress || {};
        } catch (e) { }
    }

    try {
        const publicCoursesQuery = query(collection(db, "courses"), where("status", "==", "Открытый"));
        const snap = await getDocs(publicCoursesQuery);

        if (snap.empty) {
            renderEmptyState(container, '🎓', 'Пока нет доступных курсов', 'Создать курс', () => {
                window.location.href = './create-course.html';
            });
            return;
        }

        const uidSet = new Set();
        snap.forEach(d => uidSet.add(d.data().uid));

        const userCache = {};
        await Promise.all([...uidSet].map(async uid => {
            if (!uid) return;
            try {
                const ud = await getDoc(doc(db, "users", uid));
                if (ud.exists()) userCache[uid] = ud.data();
            } catch (e) { }
        }));

        let html = '';
        let index = 1;

        // Перебираем курсы через for...of для асинхронного подсчета рейтинга
        for (const docSnap of snap.docs) {
            const c = docSnap.data();
            const id = docSnap.id;
            const num = String(index).padStart(2, '0');

            const author = userCache[c.uid] || {};
            const authorName = author.name || c.userName || 'Автор';
            const authorAvatar = author.avatar || '';

            const userLessons = courseProgress[id] ? courseProgress[id].length : 0;
            let totalLessons = 0;
            if (c.modules) c.modules.forEach(m => { if (m.lessons) totalLessons += m.lessons.length; });
            const percent = totalLessons > 0 ? Math.round((userLessons / totalLessons) * 100) : 0;
            const isStarted = userLessons > 0;
            const isCompleted = percent === 100;

            // Вычисляем реальный рейтинг курса из БД
            let displayRating = c.rating || 0;
            if (!displayRating || displayRating === 0) {
                displayRating = await getCourseAverageRating(db, id); // пересчёт
            } else {
                displayRating = `★ ${displayRating}`;
            }

            let coverHtml = '';
            if (c.cover && c.cover.startsWith('http')) {
                coverHtml = `<img src="${c.cover}" style="width:100%;height:100%;object-fit:cover;">`;
            } else if (c.cover || c.emoji) {
                coverHtml = c.cover || c.emoji;
            } else {
                coverHtml = '<div style="width:100%;height:100%;background:var(--bg3);"></div>';
            }

            let avatarHtml = '';
            if (authorAvatar) {
                if ([...authorAvatar].length <= 2) {
                    avatarHtml = `<div class="author-avatar" style="background:var(--accent-dim);color:var(--text);font-size:14px;display:flex;align-items:center;justify-content:center;">${authorAvatar}</div>`;
                } else {
                    avatarHtml = `<div class="author-avatar" style="background:url('${authorAvatar}') center/cover;"></div>`;
                }
            } else {
                avatarHtml = `<div class="author-avatar" style="background:var(--accent-dim);color:var(--text);display:flex;align-items:center;justify-content:center;">${authorName[0].toUpperCase()}</div>`;
            }

            let btnText = 'Начать →';
            if (isCompleted) btnText = '✓ Завершён';
            else if (isStarted) btnText = `Продолжить (${percent}%)`;

            html += `
            <div class="course-card" onclick="window.location.href='./course.html?id=${id}'">
              <span class="course-num">${num} / ${escHtml(c.category || 'Общее')}</span>
              <span class="course-emoji-wrap" style="overflow:hidden;">${coverHtml}</span>
              <span class="course-badge">${escHtml(c.level || 'Для всех')}</span>
              <div class="course-title">${escHtml(c.title || 'Без названия')}</div>
              <div class="course-desc">${escHtml((c.tagline || c.description || '').substring(0, 70))}...</div>
              ${isStarted ? `
              <div class="course-progress-wrap">
                <div class="course-progress-bar" style="width:${percent}%;background:${isCompleted ? 'var(--gold)' : 'var(--text)'};"></div>
              </div>
              <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:10px;">${isCompleted ? '✓ Завершён' : `${percent}% пройдено`}</div>` : ''}
              <div class="course-meta">
                <span>${escHtml(c.duration || '-')}</span>
                <span style="color: var(--gold); font-weight: 500;">★ ${c.rating || '0.0'}</span>
              </div>
              <div class="course-footer">
                <div class="course-author">
                  ${avatarHtml}
                  <span class="author-name">${escHtml(authorName)}</span>
                </div>
                <button class="course-btn" style="${isCompleted ? 'color:var(--gold);border-color:#16a34a;' : ''}">${btnText}</button>
              </div>
            </div>`;
            index++;
        }

        container.innerHTML = html;
    } catch (err) {
        console.error("Ошибка при загрузке курсов:", err);
        container.innerHTML = '<div class="empty-state">Ошибка загрузки курсов</div>';
    }
}

window.editCourse = id => { window.location.href = `./create-course.html?edit=${id}`; };
window.deleteCourse = async (courseId) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс? Все данные будут стерты навсегда.')) return;
    try {
        await deleteDoc(doc(db, "courses", courseId));
        showToast('Курс успешно удален');
        const currentUser = auth.currentUser;
        if (currentUser) loadUserCourses(currentUser);
    } catch (err) {
        console.error("Ошибка при удалении курса:", err);
        alert('Не удалось удалить курс: ' + err.message);
    }
};
window.viewCourse = id => { window.location.href = `./course.html?id=${id}`; };

// ─────────────────────────────────────────
// ЛЕНТА
// ─────────────────────────────────────────
function setupFeed(user) {
    const publishBtn = document.querySelector('.publish-btn');
    const postInput = document.getElementById('postInput');
    const charCount = document.getElementById('charCount');
    const feedContainer = document.getElementById('menu-feed');
    const fileInput = document.getElementById('fileInput');
    const imgWrap = document.getElementById('imagePreviewContainer');
    const imgPreview = document.getElementById('imagePreview');
    const removeImgBtn = document.getElementById('removeImageBtn');
    const pollContainer = document.getElementById('pollContainer');
    const removePollBtn = document.getElementById('removePollBtn');
    const pollInputs = document.querySelectorAll('.poll-option-input');

    if (!postInput || !publishBtn || !feedContainer) return;

    const MAX = 280;
    let selectedFile = null;
    let isPollActive = false;

    const checkState = () => {
        const len = postInput.value.length;
        const hasPoll = isPollActive && pollInputs[0]?.value.trim() && pollInputs[1]?.value.trim();
        publishBtn.disabled = len > MAX || !(postInput.value.trim() || selectedFile || hasPoll);
        if (charCount) {
            charCount.textContent = MAX - len;
            charCount.style.color = len > MAX ? 'var(--red)' : 'var(--text3)';
        }
    };
    postInput.oninput = checkState;

    document.getElementById('btnAttach')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('Файл слишком большой (макс 10 МБ)'); return; }
        selectedFile = file;
        imgPreview.src = URL.createObjectURL(file);
        imgWrap.style.display = 'block';
        if (pollContainer) { pollContainer.style.display = 'none'; isPollActive = false; }
        checkState();
    });
    removeImgBtn?.addEventListener('click', () => {
        selectedFile = null;
        if (fileInput) fileInput.value = '';
        if (imgWrap) imgWrap.style.display = 'none';
        checkState();
    });

    document.getElementById('btnPoll')?.addEventListener('click', () => {
        if (!pollContainer) return;
        isPollActive = true;
        pollContainer.style.display = 'flex';
        selectedFile = null;
        if (fileInput) fileInput.value = '';
        if (imgWrap) imgWrap.style.display = 'none';
        checkState();
    });
    pollInputs.forEach(inp => inp.addEventListener('input', checkState));
    removePollBtn?.addEventListener('click', () => {
        isPollActive = false;
        if (pollContainer) pollContainer.style.display = 'none';
        pollInputs.forEach(i => i.value = '');
        checkState();
    });

    publishBtn.addEventListener('click', async () => {
        publishBtn.disabled = true;
        const orig = publishBtn.textContent;
        publishBtn.textContent = 'Публикация...';

        try {
            let imageUrl = null;
            let pollData = null;
            const cache = JSON.parse(localStorage.getItem('lastKnownProfile') || '{}');

            if (selectedFile) {
                const fileRef = ref(storage, `posts/${user.uid}_${Date.now()}_${selectedFile.name}`);
                await uploadBytes(fileRef, selectedFile);
                imageUrl = await getDownloadURL(fileRef);
            }

            if (isPollActive) {
                const opts = Array.from(pollInputs).map(i => i.value.trim()).filter(Boolean);
                if (opts.length >= 2) pollData = {
                    options: opts.map(t => ({ text: t, votes: 0 })),
                    totalVotes: 0,
                    voters: {}
                };
            }

            await addDoc(collection(db, "posts"), {
                text: postInput.value.trim(),
                uid: user.uid,
                userName: cache.name || user.email?.split('@')[0] || 'Пользователь',
                userAvatar: cache.avatar || '',
                userHandle: cache.handle || '',
                createdAt: serverTimestamp(),
                imageUrl,
                poll: pollData,
                likes: 0,
                likedBy: []
            });

            postInput.value = '';
            removeImgBtn?.click();
            removePollBtn?.click();
            checkState();
            showToast('Опубликовано ✓');
        } catch (err) {
            console.error(err);
            alert('Ошибка при публикации: ' + err.message);
        }

        publishBtn.textContent = orig;
        checkState();
    });

    let isInitialLoad = true;
    const feedQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30));

    onSnapshot(feedQuery, async snap => {
        const changes = snap.docChanges();
        const onlyMods = changes.length > 0 && changes.every(c => c.type === 'modified');

        if (!isInitialLoad && onlyMods) {
            changes.forEach(change => {
                const data = change.doc.data();
                const btn = feedContainer.querySelector(`.like-post-btn[data-id="${change.doc.id}"]`);
                if (btn) {
                    const liked = data.likedBy?.includes(user.uid);
                    btn.classList.toggle('liked', liked);
                    btn.querySelector('span').textContent = data.likes || 0;
                    btn.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
                }
                if (data.poll) renderPollUpdate(change.doc.id, data.poll, user.uid);
            });
            return;
        }

        isInitialLoad = false;
        feedContainer.querySelectorAll('.post-item').forEach(el => el.remove());
        const emptyState = feedContainer.querySelector('.empty-state');

        if (snap.empty) {
            if (emptyState) {
                emptyState.innerHTML = `
                    <div class="empty-icon"><svg viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>comment-1</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-100.000000, -255.000000)" fill="#000000"> <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" id="comment-1" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>   </div>
                    <div class="empty-title">Лента пока пуста</div>
                    <div class="empty-sub">Будьте первым, кто поделится чем-то интересным!</div>`;
                emptyState.style.display = 'flex';
            }
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        const uidSet = new Set();
        snap.forEach(d => uidSet.add(d.data().uid));
        const userCache = {};
        await Promise.all([...uidSet].map(async uid => {
            try {
                const ud = await getDoc(doc(db, "users", uid));
                userCache[uid] = ud.exists() ? ud.data() : {};
            } catch { userCache[uid] = {}; }
        }));

        snap.forEach(d => {
            const data = { id: d.id, ...d.data() };
            const author = userCache[data.uid] || {};
            const name = author.name || data.userName || 'Пользователь';
            const avatar = author.avatar || data.userAvatar || '';
            const handle = author.handle || data.userHandle || '';
            const time = data.createdAt ? formatTimeAgo(new Date(data.createdAt.seconds * 1000)) : 'только что';
            const liked = data.likedBy?.includes(user.uid);

            const el = document.createElement('article');
            el.className = 'post-item';
            el.dataset.postId = data.id;
            el.innerHTML = `
                <div class="post-avatar-col">${buildAvatarHtml(avatar, name, 'create-post-avatar')}</div>
                <div class="post-content-col">
                    <div class="post-header">
                        <div class="post-author-info">
                            <span class="post-author-name">${escHtml(name)}</span>
                            ${handle ? `<span class="post-author-handle">${escHtml(handle)}</span>` : ''}
                            <span class="post-time">· ${time}</span>
                        </div>
                        ${data.uid === user.uid ? `<button class="action-btn delete-post-btn" data-id="${data.id}" title="Удалить">✕</button>` : ''}
                    </div>
                    ${data.text ? `<p class="post-text">${escHtml(data.text).replace(/\n/g, '<br>')}</p>` : ''}
                    ${data.imageUrl ? `<div class="post-media-container"><img src="${data.imageUrl}" loading="lazy" alt=""></div>` : ''}
                    ${data.poll ? buildPollHtml(data.id, data.poll, user.uid) : ''}
                    <div class="post-actions">
                        <button class="action-btn like-post-btn ${liked ? 'liked' : ''}" data-id="${data.id}">
                            ${heartSVG(liked)}<span>${data.likes || 0}</span>
                        </button>
                    </div>
                </div>`;

            if (emptyState) emptyState.insertAdjacentElement('beforebegin', el);
            else feedContainer.appendChild(el);
        });
    });

    if (!feedContainer.dataset.listenerAttached) {
        feedContainer.addEventListener('click', async e => {
            const likeBtn = e.target.closest('.like-post-btn');
            if (likeBtn) {
                const pid = likeBtn.dataset.id;
                const pRef = doc(db, "posts", pid);
                try {
                    const s = await getDoc(pRef);
                    if (s.exists()) {
                        const pd = s.data();
                        const liked = pd.likedBy?.includes(user.uid);
                        await updateDoc(pRef, {
                            likes: increment(liked ? -1 : 1),
                            likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
                        });
                    }
                } catch (err) { console.error(err); }
            }

            const delBtn = e.target.closest('.delete-post-btn');
            if (delBtn && confirm('Удалить пост?')) {
                try { await deleteDoc(doc(db, "posts", delBtn.dataset.id)); }
                catch { alert('Ошибка удаления'); }
            }

            const pollBtn = e.target.closest('.poll-option-btn:not([disabled])');
            if (pollBtn) {
                const postId = pollBtn.dataset.postId;
                const optIdx = parseInt(pollBtn.dataset.optionIndex, 10);
                await voteInPoll(postId, optIdx, user.uid);
            }
        });
        feedContainer.dataset.listenerAttached = 'true';
    }
}

// ─────────────────────────────────────────
// ОПРОСЫ
// ─────────────────────────────────────────
async function voteInPoll(postId, optionIndex, uid) {
    const pRef = doc(db, "posts", postId);
    try {
        const snap = await getDoc(pRef);
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data.poll || data.poll.voters?.[uid] !== undefined) return;

        const options = [...data.poll.options];
        options[optionIndex] = { ...options[optionIndex], votes: (options[optionIndex].votes || 0) + 1 };

        await updateDoc(pRef, {
            'poll.options': options,
            'poll.totalVotes': increment(1),
            [`poll.voters.${uid}`]: optionIndex
        });
    } catch (err) { console.error(err); }
}

function buildPollHtml(postId, poll, uid) {
    const hasVoted = poll.voters?.[uid] !== undefined;
    const myVote = hasVoted ? poll.voters[uid] : null;
    const totalVotes = poll.totalVotes || 0;

    const optionsHtml = poll.options.map((opt, i) => {
        const pct = totalVotes > 0 && hasVoted ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
        const isMyVote = myVote === i;
        return `
            <button class="poll-option-btn ${hasVoted ? 'voted' : ''} ${isMyVote ? 'my-vote' : ''}"
                    data-post-id="${postId}" data-option-index="${i}"
                    ${hasVoted ? 'disabled' : ''}>
                <span class="poll-option-bar" style="width:${pct}%"></span>
                <span class="poll-option-text">${escHtml(opt.text)}</span>
                ${hasVoted ? `<span class="poll-option-pct">${pct}%</span>` : ''}
            </button>`;
    }).join('');

    return `<div class="poll-block">
        ${optionsHtml}
        <div class="poll-footer">${totalVotes} ${declension(totalVotes, ['голос', 'голоса', 'голосов'])}</div>
    </div>`;
}

function renderPollUpdate(postId, poll, uid) {
    const article = document.querySelector(`article[data-post-id="${postId}"]`);
    if (!article) return;
    const pollBlock = article.querySelector('.poll-block');
    if (pollBlock) pollBlock.outerHTML = buildPollHtml(postId, poll, uid);
}

// ─────────────────────────────────────────
// ПОИСК
// ─────────────────────────────────────────
function setupSearch(user) {
    const searchInp = document.querySelector('#view-search input');
    const resultsDiv = document.getElementById('searchResults');
    if (!searchInp || !resultsDiv) return;

    let debounce;
    searchInp.addEventListener('input', () => {
        clearTimeout(debounce);
        const val = searchInp.value.trim();
        if (!val) {
            resultsDiv.innerHTML = '<div class="empty-state" style="margin-top:24px;">Введите запрос для поиска</div>';
            return;
        }
        resultsDiv.innerHTML = '<div class="empty-state" style="margin-top:24px;">Поиск...</div>';
        debounce = setTimeout(() => runSearch(val, resultsDiv), 400);
    });
}

async function runSearch(q, container) {
    try {
        const lq = q.toLowerCase();
        const results = [];

        const coursesSnap = await getDocs(query(collection(db, "courses"), limit(20)));
        coursesSnap.forEach(d => {
            const data = d.data();
            if (data.title?.toLowerCase().includes(lq) || data.category?.toLowerCase().includes(lq)) {
                const icon = (data.cover && data.cover.startsWith('http')) ? data.cover : (data.emoji || '');
                results.push({ type: 'course', id: d.id, icon: icon, title: data.title, sub: data.tagline || data.category || 'Курс' });
            }
        });

        const usersSnap = await getDocs(query(collection(db, "users"), limit(20)));
        usersSnap.forEach(d => {
            const data = d.data();
            if (data.name?.toLowerCase().includes(lq) || data.handle?.toLowerCase().includes(lq)) {
                results.push({ type: 'user', id: d.id, icon: data.avatar || '👤', title: data.name, sub: data.handle || '' });
            }
        });

        if (results.length === 0) {
            container.innerHTML = `<div class="empty-state" style="margin-top:24px;">Ничего не найдено по запросу «${escHtml(q)}»</div>`;
            return;
        }

        container.innerHTML = results.map(r => `
            <a class="search-result-item" href="${r.type === 'course' ? `./course.html?id=${r.id}` : '#'}">
                <div class="sr-icon">${r.icon ? ([...String(r.icon)].length <= 2 ? r.icon : `<img src="${r.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`) : '<div style="width:100%;height:100%;background:var(--bg3);border-radius:50%;"></div>'}</div>
                <div class="sr-info">
                    <h4>${escHtml(r.title || '')}</h4>
                    <p>${escHtml(r.sub)}</p>
                </div>
            </a>`).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state" style="margin-top:24px;">Ошибка поиска</div>';
        console.error(err);
    }
}

// ─────────────────────────────────────────
// SUGGESTED USERS + FOLLOW
// ─────────────────────────────────────────
async function setupSuggestedUsers(user) {
    document.querySelectorAll('.follow-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetUid = btn.dataset.uid;
            const isFollowing = btn.classList.contains('following');

            if (targetUid) {
                const userRef = doc(db, "users", user.uid);
                const targetRef = doc(db, "users", targetUid);
                try {
                    if (isFollowing) {
                        await updateDoc(userRef, { following: increment(-1), followingList: arrayRemove(targetUid) });
                        await updateDoc(targetRef, { followers: increment(-1), followersList: arrayRemove(user.uid) });
                    } else {
                        await updateDoc(userRef, { following: increment(1), followingList: arrayUnion(targetUid) });
                        await updateDoc(targetRef, { followers: increment(1), followersList: arrayUnion(user.uid) });
                    }
                } catch (err) { console.error(err); }
            }

            btn.classList.toggle('following');
            const following = btn.classList.contains('following');
            btn.textContent = following ? 'Вы следите' : 'Следить';
            btn.style.borderColor = following ? 'var(--border3)' : '';
            btn.style.color = following ? 'var(--text)' : '';
        });
    });
}

// ─────────────────────────────────────────
// ВКЛАДКИ + ВОССТАНОВЛЕНИЕ
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    injectStyles();

    const wire = (btnSelector, viewSelector, storageKey, dataAttr) => {
        const btns = document.querySelectorAll(btnSelector);
        const views = document.querySelectorAll(viewSelector);
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                views.forEach(v => v.classList.remove('active'));
                document.getElementById(btn.dataset[dataAttr])?.classList.add('active');
                if (storageKey) localStorage.setItem(storageKey, btn.dataset[dataAttr]);
            });
        });
        const saved = storageKey && localStorage.getItem(storageKey);
        if (saved) document.querySelector(`${btnSelector}[data-${dataAttr}="${saved}"]`)?.click();
    };

    wire('.sidebar-left .tab-btn', '.view-section', 'savedMainTab', 'target');
    wire('#view-menu .menu-tab', '#view-menu .inner-view', 'savedMenuTab', 'menuTarget');
    wire('#view-profile .profile-tab', '#view-profile .inner-view', 'savedProfileTab', 'profileTarget');
    wire('.settings-tab', '.settings-panel', null, 'settingsTarget');

    setupCourseFilters();
});

// ─────────────────────────────────────────
// УЛУЧШЕНИЕ 2: PILL-ФИЛЬТРЫ ДЛЯ КУРСОВ
// ─────────────────────────────────────────
function setupCourseFilters() {
    const pillContainer = document.getElementById('courseFilterPills');
    if (!pillContainer) return;

    pillContainer.addEventListener('click', e => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;

        pillContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const filter = pill.dataset.filter;
        const cards = document.querySelectorAll('#publicCoursesContainer .course-card');

        cards.forEach(card => {
            if (filter === 'all') {
                card.style.display = '';
            } else {
                const category = card.querySelector('.course-num')?.textContent || '';
                card.style.display = category.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
            }
        });
    });
}

// ─────────────────────────────────────────
// УЛУЧШЕНИЕ 5: УНИВЕРСАЛЬНЫЙ EMPTY STATE
// ─────────────────────────────────────────
function renderEmptyState(container, icon, text, btnText, btnAction) {
    container.innerHTML = `
        <div class="empty-state-rich">
            <div class="empty-icon">${icon}</div>
            <div class="empty-title">${text}</div>
            ${btnText ? `<button class="empty-action-btn">${btnText} →</button>` : ''}
        </div>`;
    if (btnAction) {
        container.querySelector('.empty-action-btn')?.addEventListener('click', btnAction);
    }
}

// ─────────────────────────────────────────
// ИНЛАЙН-СТИЛИ
// ─────────────────────────────────────────
function injectStyles() {
    if (document.getElementById('tbq-injected-styles')) return;
    const s = document.createElement('style');
    s.id = 'tbq-injected-styles';
    s.textContent = `
    /* ПОСТЫ */
    .post-item {
        display: flex; gap: 12px;
        padding: 18px 24px;
        border-bottom: 1px solid var(--border);
        animation: fadeUp .2s ease;
    }
    .post-avatar-col { flex-shrink: 0; }
    .post-content-col { flex: 1; min-width: 0; }
    .post-header {
        display: flex; align-items: flex-start;
        justify-content: space-between; gap: 8px; margin-bottom: 6px;
    }
    .post-author-info { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
    .post-author-name { font-size: 14px; font-weight: 700; }
    .post-author-handle { font-family: var(--mono); font-size: 11px; color: var(--text3); }
    .post-time { font-family: var(--mono); font-size: 11px; color: var(--text3); }
    .post-text { font-size: 15px; line-height: 1.6; margin-bottom: 10px; word-break: break-word; }
    .post-media-container { margin-bottom: 10px; }
    .post-media-container img {
        max-width: 100%; max-height: 360px;
        object-fit: cover; border: 1px solid var(--border2); display: block;
    }
    .post-actions { display: flex; gap: 16px; padding-top: 4px; }
    .action-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: transparent; border: none;
        color: var(--text3); font-family: var(--mono); font-size: 12px;
        cursor: pointer; padding: 4px 0; transition: color .15s;
    }
    .action-btn svg { width: 16px; height: 16px; }
    .like-post-btn:hover { color: #ef4444; }
    .like-post-btn.liked { color: #ef4444; }
    .delete-post-btn { color: var(--text3); font-size: 11px; padding: 4px 6px; }
    .delete-post-btn:hover { color: var(--red); }

    /* ОПРОСЫ */
    .poll-block { display: flex; flex-direction: column; gap: 8px; margin: 10px 0; }
    .poll-option-btn {
        position: relative; overflow: hidden;
        background: var(--bg2); border: 1px solid var(--border2);
        color: var(--text); padding: 10px 14px; text-align: left;
        cursor: pointer; font-family: var(--font); font-size: 13px;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        transition: border-color .15s; width: 100%;
    }
    .poll-option-btn:not([disabled]):hover { border-color: var(--border3); }
    .poll-option-btn.my-vote { border-color: var(--text); }
    .poll-option-bar {
        position: absolute; left: 0; top: 0; bottom: 0;
        background: var(--accent-dim); transition: width .5s ease; pointer-events: none;
    }
    .poll-option-text { position: relative; z-index: 1; }
    .poll-option-pct { font-family: var(--mono); font-size: 11px; color: var(--text3); position: relative; z-index: 1; }
    .poll-footer { font-family: var(--mono); font-size: 10px; color: var(--text3); text-align: right; margin-top: 2px; }

    /* УЛУЧШЕНИЕ 1: Прогресс в карточке курса */
    .course-progress-wrap {
        height: 2px; background: var(--border);
        margin-bottom: 6px; overflow: hidden;
    }
    .course-progress-bar {
        height: 100%; transition: width .5s ease;
    }

    /* УЛУЧШЕНИЕ 3: СТРИК */
        .streak-widget {
        display: flex;
        align-items: center;
        gap: 24px;
        background: var(--bg2);
        border: 1px solid var(--border);
        padding: 16px 20px;
        margin-bottom: 24px;
        border-radius: 12px; /* опционально, для красоты */
    }

    .streak-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .streak-fire {
        font-size: 32px;
    }

    .streak-num {
        font-size: 32px;
        font-weight: 900;
        line-height: 1;
    }

    .streak-text {
        font-family: var(--mono);
        font-size: 10px;
        color: var(--text3);
        text-transform: uppercase;
        letter-spacing: .08em;
    }

    .streak-days-col {
        flex: 1;
    }

    .streak-label-top {
        font-family: var(--mono);
        font-size: 10px;
        color: var(--text3);
        letter-spacing: .08em;
        text-transform: uppercase;
        margin-bottom: 8px;
    }

    .streak-days-row {
        display: flex;
        gap: 8px;
        justify-content: space-between; /* или space-around */
    }

    .streak-day {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
    }

    .streak-day-dot {
        width: 22px;
        height: 22px;
        border: 2px solid var(--border2);
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .streak-day.done .streak-day-dot {
        background: #22c55e;        /* зелёный для выполненных */
        border-color: #22c55e;
    }

    .streak-day.today .streak-day-dot {
        border-color: var(--text);
        background: transparent;
        box-shadow: 0 0 0 3px rgba(255,255,255,0.1); /* подсветка сегодня */
    }

    .streak-day-name {
        font-family: var(--mono);
        font-size: 9px;
        color: var(--text3);
    }

    /* УЛУЧШЕНИЕ 5: ПУСТЫЕ СОСТОЯНИЯ */
    .empty-state-rich {
        display: flex; flex-direction: column; align-items: center;
        padding: 48px 24px; text-align: center;
        border: 1px dashed var(--border); margin: 8px auto;
        width: 90%; box-sizing: border-box;
    }
    .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: .7; }
    .empty-title { font-family: var(--mono); font-size: 12px; color: var(--text3); margin-bottom: 16px; line-height: 1.6; }
    .empty-sub { font-family: var(--mono); font-size: 11px; color: var(--text3); margin-bottom: 16px; }
    .empty-action-btn {
        background: var(--text); color: var(--bg);
        border: none; padding: 8px 20px;
        font-family: var(--font); font-size: 12px; font-weight: 700;
        cursor: pointer; transition: opacity .15s; letter-spacing: .03em;
    }
    .empty-action-btn:hover { opacity: .8; }

    /* УЛУЧШЕНИЕ 6: СТАТИСТИКА */
    .stats-strip {
        display: flex; gap: 1px; margin-bottom: 28px;
        background: var(--border);
        border: 1px solid var(--border);
    }
    .stat-chip {
        flex: 1; background: var(--bg);
        padding: 16px 12px; text-align: center;
    }
    .stat-chip-num {
        display: block; font-size: 20px; font-weight: 900;
        line-height: 1; margin-bottom: 4px;
    }
    .stat-chip-label {
        display: block; font-family: var(--mono);
        font-size: 9px; color: var(--text3);
        text-transform: uppercase; letter-spacing: .1em;
    }

    /* УЛУЧШЕНИЕ 2: PILL ФИЛЬТРЫ */
    .filter-pills {
        display: flex; gap: 8px; flex-wrap: wrap;
        padding: 16px 28px; border-bottom: 1px solid var(--border);
    }
    .filter-pill {
        background: transparent; border: 1px solid var(--border2);
        color: var(--text3); padding: 5px 14px;
        font-family: var(--font); font-size: 12px; font-weight: 500;
        cursor: pointer; border-radius: 99px; transition: all .15s;
        letter-spacing: .02em;
    }
    .filter-pill:hover { border-color: var(--border3); color: var(--text2); }
    .filter-pill.active {
        background: var(--text); color: var(--bg);
        border-color: var(--text);
    }

    /* FOLLOW */
    .follow-btn.following { border-color: var(--border3); color: var(--text); }

    /* TOAST */
    #tbq-toast {
        position: fixed; bottom: 80px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--text); color: var(--bg);
        padding: 10px 24px; font-family: var(--mono); font-size: 12px; font-weight: 500;
        z-index: 9999; opacity: 0;
        transition: opacity .25s, transform .25s;
        pointer-events: none; white-space: nowrap;
    }
    #tbq-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%,60%  { transform: translateX(-6px); }
        40%,80%  { transform: translateX(6px); }
    }
    .shake { animation: shake .3s ease; }

    /* ФИКС РАЗМЕРА ОБЛОЖЕК И ВЫРАВНИВАНИЕ КАРТОЧЕК */
    .course-emoji-wrap,
    .course-icon-main {
        display: block; width: 100%; height: 180px;
        background: var(--bg3); overflow: hidden;
        flex-shrink: 0; border-radius: var(--r); margin-bottom: 12px;
    }
    .course-emoji-wrap img,
    .course-icon-main img {
        width: 100%; height: 100%;
        object-fit: cover; display: block;
    }
    .course-card {
        display: flex; flex-direction: column; height: 100%;
    }
    .course-footer {
        margin-top: auto; padding-top: 16px;
    }
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────
// УТИЛИТЫ
// ─────────────────────────────────────────
function buildAvatarHtml(avatar, name, className = '') {
    const cls = className ? `class="${className}"` : '';
    if (!avatar) {
        return `<div ${cls} style="background:var(--accent-dim);color:var(--text);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;">${(name?.[0] || '?').toUpperCase()}</div>`;
    }
    if ([...String(avatar)].length <= 2) {
        return `<div ${cls} style="font-size:18px;display:flex;align-items:center;justify-content:center;">${avatar}</div>`;
    }
    return `<div ${cls} style="background:url('${avatar}') center/cover;"></div>`;
}

function heartSVG(filled) {
    return filled
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTimeAgo(date) {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин. назад';
    if (diff < 86400) return Math.floor(diff / 3600) + ' ч. назад';
    return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

function declension(n, forms) {
    const m = Math.abs(n) % 100, m10 = m % 10;
    if (m > 10 && m < 20) return forms[2];
    if (m10 > 1 && m10 < 5) return forms[1];
    if (m10 === 1) return forms[0];
    return forms[2];
}

function showToast(msg) {
    let toast = document.getElementById('tbq-toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'tbq-toast'; document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
}

// ─────────────────────────────────────────
// СИСТЕМА РЕЙТИНГА КУРСОВ (НОВОЕ)
// ─────────────────────────────────────────
async function getCourseAverageRating(db, courseId) {
    try {
        const q = query(collection(db, "courseReviews"), where("courseId", "==", courseId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return "★ Нет оценок";
        }

        let totalScore = 0;
        snapshot.forEach(docSnap => {
            totalScore += docSnap.data().rating;
        });

        const average = (totalScore / snapshot.size).toFixed(1);
        return `★ ${average}`;

    } catch (error) {
        console.error("Ошибка при получении рейтинга курса:", error);
        return "★ —";
    }
}