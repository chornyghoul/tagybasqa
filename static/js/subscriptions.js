/**
 * subscriptions.js — Система подписок и просмотр профилей пользователей
 * Tagybasqa Platform / 2026
 *
 * Экспортирует:
 *  - initSubscriptions(user, db, auth) — вызвать после logIn
 *  - openUserProfile(uid)              — открыть профиль любого пользователя
 */

import {
    getFirestore, doc, getDoc, getDocs, updateDoc,
    collection, query, where, orderBy, limit,
    increment, arrayUnion, arrayRemove, onSnapshot,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ─── Внешние ссылки (устанавливаются через initSubscriptions) ────────────────
let _db   = null;
let _auth = null;
let _currentUser = null;

// ═══════════════════════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════════
export function initSubscriptions(user, db, auth) {
    _currentUser = user;
    _db   = db;
    _auth = auth;

    injectProfileModal();
    injectSubscriptionStyles();
    loadSubscriptionsTab();
    loadSuggestedUsersWidget();
    patchFeedAvatars();
    patchCourseAuthors();
    patchSearchResults();
}


// ─── УНИВЕРСАЛЬНАЯ И БЕЗОПАСНАЯ ФУНКЦИЯ ПОДПИСКИ ──────────────────────────────
export async function toggleFollowStatus(targetUid) {
    if (!_currentUser || !_db) throw new Error("Не инициализировано");
    if (_currentUser.uid === targetUid) throw new Error("Нельзя подписаться на самого себя");

    const myRef = doc(_db, "users", _currentUser.uid);
    const targetRef = doc(_db, "users", targetUid);

    return await runTransaction(_db, async (transaction) => {
        const myDoc = await transaction.get(myRef);
        const targetDoc = await transaction.get(targetRef);

        const myData = myDoc.exists() ? myDoc.data() : {};
        const targetData = targetDoc.exists() ? targetDoc.data() : {};

        let followingList = myData.followingList || [];
        let followersList = targetData.followersList || [];

        const isFollowing = followingList.includes(targetUid);

        if (isFollowing) {
            // Отписка: фильтруем массивы
            followingList = followingList.filter(id => id !== targetUid);
            followersList = followersList.filter(id => id !== _currentUser.uid);
        } else {
            // Подписка: добавляем в массивы (убедившись, что дублей нет)
            if (!followingList.includes(targetUid)) followingList.push(targetUid);
            if (!followersList.includes(_currentUser.uid)) followersList.push(_currentUser.uid);
        }

        // Обновляем массивы и жестко привязываем счетчик к их реальной длине
        transaction.update(myRef, {
            followingList: followingList,
            following: followingList.length
        });
        transaction.update(targetRef, {
            followersList: followersList,
            followers: followersList.length
        });

        // Возвращаем новый статус: true (подписан) или false (отписан)
        return !isFollowing; 
    });
}
// ═══════════════════════════════════════════════════════════════════════════════
// МОДАЛ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
// ═══════════════════════════════════════════════════════════════════════════════
function injectProfileModal() {
    if (document.getElementById('user-profile-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.className = 'upm-overlay';
    modal.innerHTML = `
        <div class="upm-sheet">
            <button class="upm-close" id="upm-close-btn">✕</button>

            <!-- Шапка профиля -->
            <div class="upm-banner"></div>
            <div class="upm-header">
                <div class="upm-avatar" id="upm-avatar"></div>
                <div class="upm-header-right">
                    <button class="upm-follow-btn" id="upm-follow-btn">Следить</button>
                </div>
            </div>
            <div class="upm-info">
                <div class="upm-name" id="upm-name">Загрузка...</div>
                <div class="upm-handle" id="upm-handle">@username</div>
                <div class="upm-stats" id="upm-stats">
                    <span id="upm-followers"><strong>0</strong> подписчиков</span>
                    <span id="upm-following"><strong>0</strong> подписок</span>
                    <span id="upm-courses-count"><strong>0</strong> курсов</span>
                </div>
            </div>

            <!-- Табы контента -->
            <div class="upm-tabs">
                <button class="upm-tab active" data-tab="courses">Курсы</button>
                <button class="upm-tab" data-tab="quizzes">Квизы</button>
                <button class="upm-tab" data-tab="lessons">Уроки</button>
                <button class="upm-tab" data-tab="posts">Посты</button>
            </div>

            <div class="upm-content" id="upm-content">
                <div class="upm-loading">Загрузка...</div>
            </div>
        </div>`;

    document.body.appendChild(modal);

    // Закрытие
    document.getElementById('upm-close-btn').addEventListener('click', closeProfileModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeProfileModal(); });

    // Переключение табов
    modal.querySelectorAll('.upm-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.upm-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const uid = modal.dataset.uid;
            if (uid) loadProfileTab(uid, tab.dataset.tab);
        });
    });
}

function closeProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.dataset.uid = ''; }, 300);
    }
}

// ─── Открыть профиль пользователя ────────────────────────────────────────────
export async function openUserProfile(uid) {
    if (!uid || !_db) return;
    // Не открывать свой профиль через модал — переключить таб
    if (_currentUser && uid === _currentUser.uid) {
        document.querySelector('.tab-btn[data-target="view-profile"]')?.click();
        return;
    }

    const modal = document.getElementById('user-profile-modal');
    if (!modal) return;

    modal.dataset.uid = uid;
    modal.classList.add('active');

    // Сбрасываем состояние
    setEl('upm-name', 'Загрузка...');
    setEl('upm-handle', '@...');
    setEl('upm-content', '<div class="upm-loading">Загрузка...</div>');
    const avatarEl = document.getElementById('upm-avatar');
    if (avatarEl) { avatarEl.innerHTML = ''; avatarEl.style.cssText = ''; }

    // Сбрасываем табы
    modal.querySelectorAll('.upm-tab').forEach((t, i) => {
        t.classList.toggle('active', i === 0);
    });

    try {
        const snap = await getDoc(doc(_db, "users", uid));
        const data = snap.exists() ? snap.data() : {};

        // Аватар
        renderUpmAvatar(data.avatar, data.name, avatarEl);

        // Инфо
        setEl('upm-name', escHtml(data.name || uid));
        setEl('upm-handle', escHtml(data.handle || `@${uid.slice(0, 8)}`));

        // Статистика
        document.getElementById('upm-followers').innerHTML =
            `<strong>${data.followers || 0}</strong> подписчиков`;
        document.getElementById('upm-following').innerHTML =
            `<strong>${data.following || 0}</strong> подписок`;

        // Считаем курсы
        const coursesQ = query(collection(_db, "courses"),
            where("uid", "==", uid), where("status", "==", "approved"));
        const cSnap = await getDocs(coursesQ);
        document.getElementById('upm-courses-count').innerHTML =
            `<strong>${cSnap.size}</strong> курсов`;

        // Кнопка follow
        setupFollowButton(uid, data);

        // Загружаем первый таб (курсы)
        loadProfileTab(uid, 'courses');

    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setEl('upm-content', '<div class="upm-empty">Ошибка загрузки</div>');
    }
}

// ─── Кнопка Follow / Unfollow ─────────────────────────────────────────────────
async function setupFollowButton(targetUid, targetData) {
    const btn = document.getElementById('upm-follow-btn');
    if (!btn || !_currentUser) return;

    // Проверяем: уже подписан?
    const mySnap = await getDoc(doc(_db, "users", _currentUser.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const followingList = myData.followingList || [];
    let isFollowing = followingList.includes(targetUid);

    updateFollowBtn(btn, isFollowing);

    btn.onclick = async () => {
        if (!_currentUser) return;
        btn.disabled = true; // Защита от спама

        try {
            // Используем транзакцию
            isFollowing = await toggleFollowStatus(targetUid);
            showToast(isFollowing ? 'Вы подписались ✓' : 'Вы отписались');
            
            updateFollowBtn(btn, isFollowing);

            // Обновляем счётчик подписчиков на экране
            const updSnap = await getDoc(doc(_db, "users", targetUid));
            if (updSnap.exists()) {
                document.getElementById('upm-followers').innerHTML =
                    `<strong>${updSnap.data().followers || 0}</strong> подписчиков`;
            }
        } catch (e) {
            console.error("Ошибка транзакции:", e);
        } finally {
            btn.disabled = false;
        }
    };
}

function updateFollowBtn(btn, isFollowing) {
    btn.textContent = isFollowing ? 'Вы следите' : 'Следить';
    btn.classList.toggle('upm-following', isFollowing);
}

// ─── Контент табов ────────────────────────────────────────────────────────────
async function loadProfileTab(uid, tab) {
    const content = document.getElementById('upm-content');
    if (!content) return;
    content.innerHTML = '<div class="upm-loading">Загрузка...</div>';

    try {
        switch (tab) {
            case 'courses':  await renderProfileCourses(uid, content); break;
            case 'quizzes':  await renderProfileQuizzes(uid, content); break;
            case 'lessons':  await renderProfileLessons(uid, content); break;
            case 'posts':    await renderProfilePosts(uid, content);   break;
        }
    } catch (err) {
        console.error(err);
        content.innerHTML = '<div class="upm-empty">Ошибка загрузки</div>';
    }
}

async function renderProfileCourses(uid, container) {
    const q = query(collection(_db, "courses"),
        where("uid", "==", uid), where("status", "==", "approved"));
    const snap = await getDocs(q);

    if (snap.empty) {
        container.innerHTML = upmEmpty('📚', 'Нет опубликованных курсов');
        return;
    }

    let html = '<div class="upm-grid">';
    snap.forEach(d => {
        const c = d.data();
        html += upmCourseCard(d.id, c);
    });
    html += '</div>';
    container.innerHTML = html;
}

async function renderProfileQuizzes(uid, container) {
    const q = query(collection(_db, "quizzes"),
        where("uid", "==", uid), where("visibility", "==", "public"));
    const snap = await getDocs(q);

    if (snap.empty) {
        container.innerHTML = upmEmpty('🎮', 'Нет опубликованных квизов');
        return;
    }

    let html = '<div class="upm-grid">';
    snap.forEach(d => {
        const qz = d.data();
        html += upmQuizCard(d.id, qz);
    });
    html += '</div>';
    container.innerHTML = html;
}

async function renderProfileLessons(uid, container) {
    const q = query(collection(_db, "interactiveLessons"),
        where("uid", "==", uid), where("status", "==", "approved"));
    const snap = await getDocs(q);

    if (snap.empty) {
        container.innerHTML = upmEmpty('🎬', 'Нет опубликованных уроков');
        return;
    }

    let html = '<div class="upm-grid">';
    snap.forEach(d => {
        const l = d.data();
        html += upmLessonCard(d.id, l);
    });
    html += '</div>';
    container.innerHTML = html;
}

async function renderProfilePosts(uid, container) {
    const q = query(collection(_db, "posts"),
        where("uid", "==", uid), orderBy("createdAt", "desc"), limit(20));
    const snap = await getDocs(q);

    if (snap.empty) {
        container.innerHTML = upmEmpty('📝', 'Нет публикаций');
        return;
    }

    let html = '<div class="upm-posts">';
    snap.forEach(d => {
        const p = d.data();
        const time = p.createdAt
            ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
            : '';
        html += `
        <div class="upm-post-item">
            ${p.text ? `<p class="upm-post-text">${escHtml(p.text)}</p>` : ''}
            ${p.imageUrl ? `<img class="upm-post-img" src="${p.imageUrl}" loading="lazy" alt="">` : ''}
            <div class="upm-post-meta">
                <span>❤️ ${p.likes || 0}</span>
                <span>${time}</span>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ─── HTML-шаблоны карточек ────────────────────────────────────────────────────
function upmCourseCard(id, c) {
    const cover = (c.cover && c.cover.startsWith('http'))
        ? `<img src="${c.cover}" style="width:100%;height:100%;object-fit:cover;">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;">${c.emoji || '📘'}</div>`;

    return `
    <div class="upm-card" onclick="window.location.href='./course.html?id=${id}'">
        <div class="upm-card-cover">${cover}</div>
        <div class="upm-card-body">
            <span class="upm-card-tag">Курс</span>
            <div class="upm-card-title">${escHtml(c.title || 'Без названия')}</div>
            <div class="upm-card-meta">
                ${c.level ? `<span>${escHtml(c.level)}</span>` : ''}
                ${c.duration ? `<span>⏱ ${escHtml(c.duration)}</span>` : ''}
                ${c.rating ? `<span>★ ${c.rating}</span>` : ''}
            </div>
        </div>
    </div>`;
}

function upmQuizCard(id, q) {
    const count = q.questions?.length || 0;
    return `
    <div class="upm-card" onclick="window.location.href='./quiz.html?id=${id}'">
        <div class="upm-card-cover" style="background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:32px;">🎮</div>
        <div class="upm-card-body">
            <span class="upm-card-tag" style="background:rgba(139,92,246,.15);color:#8b5cf6;">Квиз</span>
            <div class="upm-card-title">${escHtml(q.title || 'Без названия')}</div>
            <div class="upm-card-meta">
                <span>${count} вопросов</span>
                ${q.difficulty ? `<span>${escHtml(q.difficulty)}</span>` : ''}
            </div>
        </div>
    </div>`;
}

function upmLessonCard(id, l) {
    return `
    <div class="upm-card" onclick="window.location.href='./lesson.html?id=${id}'">
        <div class="upm-card-cover" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:32px;">🎬</div>
        <div class="upm-card-body">
            <span class="upm-card-tag" style="background:rgba(6,182,212,.15);color:#06b6d4;">Урок</span>
            <div class="upm-card-title">${escHtml(l.title || 'Без названия')}</div>
            <div class="upm-card-meta">
                <span>Интерактивный урок</span>
            </div>
        </div>
    </div>`;
}

function upmEmpty(icon, text) {
    return `<div class="upm-empty"><div style="font-size:32px;margin-bottom:10px;">${icon}</div><div>${text}</div></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ВКЛАДКА "МОИ ПОДПИСКИ"
// ═══════════════════════════════════════════════════════════════════════════════
async function loadSubscriptionsTab() {
    const container = document.getElementById('menu-subscriptions');
    if (!container || !_currentUser || !_db) return;

    // Слушаем изменения в реальном времени
    const userRef = doc(_db, "users", _currentUser.uid);
    onSnapshot(userRef, async snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        const followingList = data.followingList || [];

        // Перестроить контент вкладки
        renderSubscriptionsTab(container, followingList);
    });
}

async function renderSubscriptionsTab(container, followingList) {
    // Очищаем только динамический контент (оставляем заголовок)
    let inner = container.querySelector('.subs-inner');
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'subs-inner';
        container.appendChild(inner);
    }

    if (followingList.length === 0) {
        inner.innerHTML = `
        <div style="padding: 0 28px;">
            <div class="empty-state-rich">
                <div class="empty-icon">🔔</div>
                <div class="empty-title">Вы ещё ни на кого не подписаны</div>
                <div class="empty-sub" style="font-size:11px;color:var(--text3);font-family:var(--mono);">
                    Подпишитесь на авторов, чтобы видеть их новые курсы и квизы
                </div>
            </div>
        </div>`;
        return;
    }

    inner.innerHTML = '<div class="subs-loading" style="padding:28px;color:var(--text3);font-family:var(--mono);font-size:12px;">Загрузка...</div>';

    try {
        // Загружаем профили всех, на кого подписаны
        const profiles = await Promise.all(
            followingList.map(async uid => {
                try {
                    const s = await getDoc(doc(_db, "users", uid));
                    return s.exists() ? { uid, ...s.data() } : null;
                } catch { return null; }
            })
        );

        const validProfiles = profiles.filter(Boolean);

        // Для каждого — загружаем количество курсов
        const enriched = await Promise.all(validProfiles.map(async profile => {
            try {
                const cQ = query(collection(_db, "courses"),
                    where("uid", "==", profile.uid), where("status", "==", "approved"));
                const cSnap = await getDocs(cQ);
                const qQ = query(collection(_db, "quizzes"),
                    where("uid", "==", profile.uid), where("visibility", "==", "public"));
                const qSnap = await getDocs(qQ);
                return { ...profile, courseCount: cSnap.size, quizCount: qSnap.size };
            } catch {
                return { ...profile, courseCount: 0, quizCount: 0 };
            }
        }));

        let html = '<div class="subs-list" style="padding: 16px 28px;">';
        enriched.forEach(profile => {
            html += renderSubscriptionCard(profile);
        });
        html += '</div>';
        inner.innerHTML = html;

    } catch (err) {
        console.error(err);
        inner.innerHTML = '<div style="padding:28px;color:var(--text3);">Ошибка загрузки</div>';
    }
}

function renderSubscriptionCard(profile) {
    const avatarHtml = buildInlineAvatar(profile.avatar, profile.name, 44);
    const name = escHtml(profile.name || profile.uid.slice(0, 8));
    const handle = escHtml(profile.handle || '');

    return `
    <div class="subs-card">
        <div class="subs-card-left" onclick="window._openUserProfile('${profile.uid}')" style="cursor:pointer;display:flex;align-items:center;gap:14px;flex:1;">
            ${avatarHtml}
            <div class="subs-card-info">
                <div class="subs-card-name">${name}</div>
                ${handle ? `<div class="subs-card-handle">${handle}</div>` : ''}
                <div class="subs-card-meta">
                    ${profile.followers ? `<span>${profile.followers} подписчиков</span>` : ''}
                    ${profile.courseCount ? `<span>${profile.courseCount} курсов</span>` : ''}
                    ${profile.quizCount ? `<span>${profile.quizCount} квизов</span>` : ''}
                </div>
            </div>
        </div>
        <button class="subs-unfollow-btn" data-uid="${profile.uid}">Отписаться</button>
    </div>`;
}

// Делегирование кликов на кнопки "Отписаться"
document.addEventListener('click', async e => {
    const btn = e.target.closest('.subs-unfollow-btn');
    if (!btn || !_currentUser || !_db) return;

    const targetUid = btn.dataset.uid;
    if (!targetUid) return;

    btn.disabled = true;
    btn.textContent = '...';

    try {
        await toggleFollowStatus(targetUid);
        showToast('Вы отписались');
    } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = 'Отписаться';
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ВИДЖЕТ "SUGGESTED USERS" в правой панели
// ═══════════════════════════════════════════════════════════════════════════════
async function loadSuggestedUsersWidget() {
    if (!_db || !_currentUser) return;

    // Находим место под виджет в правой панели
    const rightSidebar = document.querySelector('.right-sidebar');
    if (!rightSidebar) return;

    // Создаём виджет, если нет
    let widget = document.getElementById('suggested-users-widget');
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'suggested-users-widget';
        // Вставляем перед footer-links
        const footer = rightSidebar.querySelector('.footer-links');
        if (footer) rightSidebar.insertBefore(widget, footer);
        else rightSidebar.appendChild(widget);
    }

    widget.innerHTML = `
    <div class="widget-title">👥 Люди на платформе</div>
    <div id="suggested-list" style="display:flex;flex-direction:column;gap:10px;">
        <div style="font-family:var(--mono);font-size:11px;color:var(--text3);">Загрузка...</div>
    </div>`;

    try {
        // Получаем мой followingList
        const mySnap = await getDoc(doc(_db, "users", _currentUser.uid));
        const myData = mySnap.exists() ? mySnap.data() : {};
        const followingList = myData.followingList || [];

        // Берём последних зарегистрированных пользователей
        const q = query(collection(_db, "users"), limit(15));
        const snap = await getDocs(q);

        // Фильтруем себя
        const others = [];
        snap.forEach(d => {
            if (d.id !== _currentUser.uid) others.push({ uid: d.id, ...d.data() });
        });

        // Перемешиваем и берём 5
        const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 5);

        const list = document.getElementById('suggested-list');
        if (!list) return;

        if (shuffled.length === 0) {
            list.innerHTML = '<div style="font-family:var(--mono);font-size:11px;color:var(--text3);">Нет пользователей</div>';
            return;
        }

        list.innerHTML = shuffled.map(profile => {
            const isFollowing = followingList.includes(profile.uid);
            const avatarHtml = buildInlineAvatar(profile.avatar, profile.name, 34);
            return `
            <div class="suggested-user-row" data-uid="${profile.uid}">
                <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;"
                     onclick="window._openUserProfile('${profile.uid}')">
                    ${avatarHtml}
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${escHtml(profile.name || profile.uid.slice(0, 8))}
                        </div>
                        ${profile.handle ? `<div style="font-family:var(--mono);font-size:10px;color:var(--text3);">${escHtml(profile.handle)}</div>` : ''}
                    </div>
                </div>
                <button class="suggested-follow-btn ${isFollowing ? 'following' : ''}"
                        data-uid="${profile.uid}">
                    ${isFollowing ? 'Слежу' : 'Следить'}
                </button>
            </div>`;
        }).join('');

        // Делегирование кликов на follow-кнопки виджета
        list.addEventListener('click', async e => {
            const btn = e.target.closest('.suggested-follow-btn');
            if (!btn || !_currentUser) return;
            const targetUid = btn.dataset.uid;
            const isFollowing = btn.classList.contains('following');
            btn.disabled = true;

            try {
                const isNowFollowing = await toggleFollowStatus(targetUid);
                if (isNowFollowing) {
                    btn.textContent = 'Слежу';
                    btn.classList.add('following');
                    showToast('Вы подписались!');
                } else {
                    btn.textContent = 'Следить';
                    btn.classList.remove('following');
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                btn.disabled = false; 
            }
        });

    } catch (err) {
        console.error('Ошибка загрузки suggested users:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ПАТЧ — кликабельные аватары/имена в ленте
// ═══════════════════════════════════════════════════════════════════════════════
function patchFeedAvatars() {
    // Делегирование клика по аватарам/именам в постах
    const feedContainer = document.getElementById('menu-feed');
    if (!feedContainer) return;

    feedContainer.addEventListener('click', e => {
        const nameEl = e.target.closest('.post-author-name');
        const avatarEl = e.target.closest('.post-avatar-col');
        const target = nameEl || avatarEl;
        if (!target) return;

        const post = target.closest('.post-item');
        if (!post) return;

        const uid = post.dataset.authorUid;
        if (uid && uid !== _currentUser?.uid) {
            openUserProfile(uid);
        }
    });
}

function patchCourseAuthors() {
    // Делегирование клика по авторам курсов
    const coursesContainer = document.getElementById('publicCoursesContainer');
    if (!coursesContainer) return;

    coursesContainer.addEventListener('click', e => {
        const authorEl = e.target.closest('.course-author');
        if (!authorEl) return;
        e.stopPropagation();
        const uid = authorEl.dataset.uid;
        if (uid) openUserProfile(uid);
    });
}

function patchSearchResults() {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    resultsDiv.addEventListener('click', e => {
        const item = e.target.closest('.search-result-item[data-type="user"]');
        if (!item) return;
        e.preventDefault();
        const uid = item.dataset.uid;
        if (uid) openUserProfile(uid);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ГЛОБАЛЬНЫЕ ХУКИ (вызываются из main.js через window)
// ═══════════════════════════════════════════════════════════════════════════════
window._openUserProfile = openUserProfile;

// ═══════════════════════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════════════════════
function setEl(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildInlineAvatar(avatar, name, size = 40) {
    const style = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;`;
    if (!avatar) {
        return `<div style="${style}background:var(--accent-dim);color:var(--text);font-weight:700;font-size:${size * 0.38}px;">${(name?.[0] || '?').toUpperCase()}</div>`;
    }
    if ([...String(avatar)].length <= 2) {
        return `<div style="${style}font-size:${size * 0.48}px;">${avatar}</div>`;
    }
    return `<div style="${style}background:url('${avatar}') center/cover;"></div>`;
}

function renderUpmAvatar(avatar, name, el) {
    if (!el) return;
    el.innerHTML = '';
    el.style.cssText = '';
    if (!avatar) {
        el.textContent = (name?.[0] || '?').toUpperCase();
        el.style.cssText = 'background:var(--accent-dim);color:var(--text);font-weight:700;font-size:28px;display:flex;align-items:center;justify-content:center;';
    } else if ([...String(avatar)].length <= 2) {
        el.textContent = avatar;
        el.style.cssText = 'font-size:32px;display:flex;align-items:center;justify-content:center;';
    } else {
        el.style.cssText = `background:url('${avatar}') center/cover;`;
    }
}

function showToast(msg) {
    let toast = document.getElementById('tbq-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'tbq-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// СТИЛИ
// ═══════════════════════════════════════════════════════════════════════════════
function injectSubscriptionStyles() {
    if (document.getElementById('subs-styles')) return;
    const s = document.createElement('style');
    s.id = 'subs-styles';
    s.textContent = `
/* ── USER PROFILE MODAL ─────────────────────────────── */
.upm-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: flex-end; justify-content: center;
    opacity: 0; pointer-events: none;
    transition: opacity .25s ease;
}
.upm-overlay.active {
    opacity: 1; pointer-events: all;
}
.upm-sheet {
    background: var(--bg);
    width: 100%; max-width: 640px; max-height: 88vh;
    border-radius: 20px 20px 0 0;
    overflow: hidden; display: flex; flex-direction: column;
    transform: translateY(40px);
    transition: transform .3s cubic-bezier(.4,0,.2,1);
    position: relative;
}
.upm-overlay.active .upm-sheet { transform: translateY(0); }

.upm-close {
    position: absolute; top: 14px; right: 16px;
    background: var(--bg3); border: none; color: var(--text3);
    width: 30px; height: 30px; border-radius: 50%;
    cursor: pointer; font-size: 13px; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
}
.upm-close:hover { background: var(--bg4); }

.upm-banner {
    height: 80px; background: linear-gradient(135deg, var(--bg3), var(--bg4));
    flex-shrink: 0;
}
.upm-header {
    display: flex; align-items: flex-end;
    justify-content: space-between;
    padding: 0 20px;
    margin-top: -28px;
    position: relative;
    z-index: 1;
}
.upm-avatar {
    width: 64px; height: 64px; border-radius: 50%;
    border: 3px solid var(--bg);
    background: var(--bg3);
    overflow: hidden; flex-shrink: 0;
}
.upm-header-right { padding-bottom: 8px; }

.upm-follow-btn {
    background: var(--text); color: var(--bg);
    border: none; padding: 8px 20px;
    font-family: var(--font); font-size: 13px; font-weight: 700;
    cursor: pointer; border-radius: 9999px;
    transition: all .15s;
}
.upm-follow-btn:hover { opacity: .85; }
.upm-follow-btn.upm-following {
    background: transparent; color: var(--text);
    border: 1px solid var(--border3);
}
.upm-follow-btn:disabled { opacity: .5; cursor: default; }

.upm-info { padding: 10px 20px 0; }
.upm-name { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
.upm-handle { font-family: var(--mono); font-size: 12px; color: var(--text3); margin-bottom: 10px; }
.upm-stats { display: flex; gap: 14px; flex-wrap: wrap; }
.upm-stats span { font-family: var(--mono); font-size: 11px; color: var(--text3); }
.upm-stats strong { color: var(--text); }

.upm-tabs {
    display: flex; gap: 0;
    border-bottom: 1px solid var(--border);
    margin-top: 12px;
    flex-shrink: 0;
}
.upm-tab {
    flex: 1; background: none; border: none; border-bottom: 2px solid transparent;
    color: var(--text3); font-family: var(--mono); font-size: 11px;
    font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
    padding: 10px 4px; cursor: pointer;
    transition: all .15s; margin-bottom: -1px;
}
.upm-tab:hover { color: var(--text2); }
.upm-tab.active { color: var(--text); border-bottom-color: var(--text); }

.upm-content {
    flex: 1; overflow-y: auto; padding: 16px;
    overscroll-behavior: contain;
}

.upm-loading { 
    text-align: center; padding: 40px;
    font-family: var(--mono); font-size: 12px; color: var(--text3);
}
.upm-empty {
    text-align: center; padding: 48px 20px;
    font-family: var(--mono); font-size: 12px; color: var(--text3);
}

/* UPM Grid */
.upm-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
}
.upm-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 10px; overflow: hidden; cursor: pointer;
    transition: transform .15s, box-shadow .15s;
}
.upm-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
.upm-card-cover {
    height: 90px; background: var(--bg3);
    overflow: hidden;
}
.upm-card-body { padding: 10px 12px; }
.upm-card-tag {
    display: inline-block;
    font-family: var(--mono); font-size: 9px;
    background: var(--accent-dim); color: var(--text3);
    padding: 2px 7px; border-radius: 3px;
    margin-bottom: 5px; letter-spacing: .05em;
    text-transform: uppercase;
}
.upm-card-title {
    font-size: 12px; font-weight: 700; line-height: 1.4;
    margin-bottom: 4px; 
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
}
.upm-card-meta {
    display: flex; gap: 8px; flex-wrap: wrap;
    font-family: var(--mono); font-size: 10px; color: var(--text3);
}

/* UPM Posts */
.upm-posts { display: flex; flex-direction: column; gap: 1px; }
.upm-post-item {
    padding: 14px; border-bottom: 1px solid var(--border);
}
.upm-post-text { font-size: 14px; line-height: 1.5; margin-bottom: 8px; word-break: break-word; }
.upm-post-img { max-width: 100%; max-height: 240px; object-fit: cover; margin-bottom: 8px; border-radius: 8px; }
.upm-post-meta { display: flex; gap: 12px; font-family: var(--mono); font-size: 11px; color: var(--text3); }

/* ── SUBSCRIPTIONS TAB ──────────────────────────────── */
.subs-list { display: flex; flex-direction: column; gap: 1px; }
.subs-card {
    display: flex; align-items: center;
    justify-content: space-between; gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
}
.subs-card-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.subs-card-handle { font-family: var(--mono); font-size: 11px; color: var(--text3); margin-bottom: 4px; }
.subs-card-meta { display: flex; gap: 8px; font-family: var(--mono); font-size: 10px; color: var(--text3); }
.subs-unfollow-btn {
    background: transparent; border: 1px solid var(--border3);
    color: var(--text3); padding: 6px 14px;
    font-family: var(--font); font-size: 12px; font-weight: 600;
    cursor: pointer; border-radius: 9999px; white-space: nowrap;
    flex-shrink: 0; transition: all .15s;
}
.subs-unfollow-btn:hover { border-color: var(--red); color: var(--red); }

/* ── SUGGESTED USERS WIDGET ─────────────────────────── */
#suggested-users-widget {
    margin-bottom: 20px;
    border: 1px solid var(--border);
    padding: 16px;
    border-radius: 0;
}
.suggested-user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 0;
}
.suggested-follow-btn {
    background: var(--text); color: var(--bg);
    border: none; padding: 5px 12px;
    font-family: var(--font); font-size: 11px; font-weight: 700;
    cursor: pointer; border-radius: 9999px; white-space: nowrap;
    transition: all .15s; flex-shrink: 0;
}
.suggested-follow-btn.following {
    background: transparent; color: var(--text3);
    border: 1px solid var(--border3);
}
.suggested-follow-btn:hover:not(.following) { opacity: .85; }
.suggested-follow-btn:disabled { opacity: .4; cursor: default; }

/* ── POST AUTHOR HOVER ──────────────────────────────── */
.post-author-name {
    cursor: pointer;
    transition: color .1s;
}
.post-author-name:hover { color: var(--text2); text-decoration: underline; }
.post-avatar-col { cursor: pointer; }
`;
    document.head.appendChild(s);
}
