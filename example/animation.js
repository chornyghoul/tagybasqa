// ==========================================
// 1. ИМПОРТЫ FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,      
    addDoc,
    updateDoc,       
    deleteDoc,       
    increment,       
    arrayUnion,      
    arrayRemove,     
    serverTimestamp, 
    query,          
    orderBy,        
    onSnapshot      
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// ==========================================
// 2. КОНФИГУРАЦИЯ И ИНИЦИАЛИЗАЦИЯ
// ==========================================
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
const googleProvider = new GoogleAuthProvider();

// ==========================================
// 3. ГЛОБАЛЬНЫЕ ЭЛЕМЕНТЫ И АВТОРИЗАЦИЯ
// ==========================================
const elements = {
    regForm: document.querySelector('#registration-form form'),
    loginForm: document.querySelector('#login-form form'),
    toggleBtn: document.getElementById('toggleBtn'),
    googleBtns: document.querySelectorAll('.btn-social'),
    logoutBtn: document.getElementById('logoutBtn'),
    userNameDisplay: document.getElementById('userNameDisplay'),
};

if (elements.toggleBtn) {
    elements.toggleBtn.onclick = () => {
        const reg = document.getElementById('registration-form');
        const log = document.getElementById('login-form');
        const isRegVisible = reg.style.display !== 'none';
        reg.style.display = isRegVisible ? 'none' : 'block';
        log.style.display = isRegVisible ? 'block' : 'none';
        elements.toggleBtn.textContent = isRegVisible ? 'РЕГИСТРАЦИЯ' : 'ВОЙТИ';
    };
}

if (elements.regForm) {
    elements.regForm.onsubmit = (e) => {
        e.preventDefault();
        const [_, email, pass] = Array.from(e.target.querySelectorAll('input')).map(i => i.value);
        createUserWithEmailAndPassword(auth, email, pass).catch(err => alert("Ошибка: " + err.message));
    };
}

if (elements.loginForm) {
    elements.loginForm.onsubmit = (e) => {
        e.preventDefault();
        const [email, pass] = Array.from(e.target.querySelectorAll('input')).map(i => i.value);
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Ошибка: " + err.message));
    };
}

elements.googleBtns.forEach(btn => {
    btn.onclick = () => signInWithPopup(auth, googleProvider).catch(err => console.error("Google auth error", err));
});

onAuthStateChanged(auth, async (user) => {
    const isAuthPage = window.location.pathname.includes('auth.html');
    const isProfilePage = window.location.pathname.includes('profile.html') || window.location.pathname === '/' || window.location.pathname.includes('index.html');

    if (user) {
        // Перекидываем на профиль после успешного входа/регистрации
        if (isAuthPage) window.location.href = './profile.html'; 
        
        if (elements.userNameDisplay) {
            elements.userNameDisplay.textContent = user.displayName || user.email.split('@')[0];
        }

        if (elements.logoutBtn) {
            elements.logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = './auth.html');
        }

        if (isProfilePage) {
            loadUserProfile(user);
            setupFeed(user);
        }
    } else {
        if (isProfilePage && !isAuthPage) {
            window.location.href = './auth.html';
        }
    }
});

// ==========================================
// 4. ЛОГИКА ПРОФИЛЯ (Загрузка и Редактирование)
// ==========================================
async function loadUserProfile(user) {
    const userDocRef = doc(db, "users", user.uid);
    
    const profileName = document.querySelector('.user-name-row h1');
    const profileHandle = document.querySelector('.handle');
    const profileAvatar = document.querySelector('.main-avatar');
    const userPostAvatar = document.getElementById('userPostAvatar');

    const editProfileBtn = document.querySelector('.edit-profile-btn');
    const editModal = document.getElementById('editProfileModal');
    const closeModal = document.getElementById('closeModal');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const nameInput = document.getElementById('editNameInput');
    const handleInput = document.getElementById('editHandleInput');
    const avatarInput = document.getElementById('avatarInput');

    const renderAvatar = (avatarData, targetElement) => {
        if (!targetElement) return;
        if (avatarData.length <= 2) { 
            targetElement.innerHTML = `${avatarData}`;
            targetElement.style.background = '#2f3336';
            targetElement.style.backgroundImage = 'none';
        } else { 
            targetElement.style.backgroundImage = `url(${avatarData})`;
            targetElement.style.backgroundSize = 'cover';
            targetElement.style.backgroundPosition = 'center';
            targetElement.innerText = '';
        }
    };

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (profileName && data.name) profileName.innerText = data.name;
            if (profileHandle && data.handle) profileHandle.innerText = data.handle;
            
            if (data.avatar) {
                renderAvatar(data.avatar, profileAvatar);
                if (profileAvatar) profileAvatar.innerHTML += '<div class="status-indicator"></div>'; 
                renderAvatar(data.avatar, userPostAvatar);
            }
        } else {
            if (userPostAvatar) {
                userPostAvatar.textContent = (user.displayName || user.email)[0].toUpperCase();
                userPostAvatar.style.background = "var(--accent-blue)";
            }
        }
    } catch (e) { console.error("Ошибка загрузки профиля:", e); }

    if (editProfileBtn && editModal) {
        editProfileBtn.onclick = () => {
            if (profileName) nameInput.value = profileName.innerText;
            if (profileHandle) handleInput.value = profileHandle.innerText.replace('@', '');
            editModal.classList.add('active');
        };

        closeModal.onclick = () => editModal.classList.remove('active');
        window.onclick = (e) => { if (e.target === editModal) editModal.classList.remove('active'); };

        saveProfileBtn.onclick = async () => {
            saveProfileBtn.textContent = 'Сохранение...';
            saveProfileBtn.disabled = true;

            const nVal = nameInput.value.trim();
            const hVal = handleInput.value.trim();
            const aVal = avatarInput.value.trim();

            const updateData = {};
            if (nVal) updateData.name = nVal;
            if (hVal) updateData.handle = `@${hVal.replace('@', '').toLowerCase()}`;
            if (aVal) updateData.avatar = aVal;

            try {
                await setDoc(userDocRef, updateData, { merge: true });
                window.location.reload(); 
            } catch (error) {
                alert('Ошибка при сохранении: ' + error.message);
                saveProfileBtn.textContent = 'Сохранить';
                saveProfileBtn.disabled = false;
            }
        };
    }
}

// ==========================================
// 5. ЛОГИКА ЛЕНТЫ (Создание, Отрисовка, Лайки, Удаление)
// ==========================================
function setupFeed(user) {
    const publishBtn = document.querySelector('.publish-btn');
    const postInput = document.getElementById('postInput');
    const charCount = document.getElementById('charCount');
    const feedContainer = document.getElementById('menu-feed');

    const fileInput = document.getElementById('fileInput');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    const pollContainer = document.getElementById('pollContainer');
    const removePollBtn = document.getElementById('removePollBtn');
    const pollInputs = document.querySelectorAll('.poll-option-input');

    if (!postInput || !publishBtn || !feedContainer) return;

    const MAX_CHARS = 280;
    let selectedFile = null;
    let isPollActive = false;

    const checkPublishState = () => {
        const textLen = postInput.value.length;
        const hasText = postInput.value.trim().length > 0;
        const textValid = textLen <= MAX_CHARS;
        const hasFile = selectedFile !== null;
        const hasPoll = isPollActive && pollInputs[0]?.value.trim() && pollInputs[1]?.value.trim();
        
        publishBtn.disabled = !textValid || (!hasText && !hasFile && !hasPoll);
    };

    postInput.oninput = () => {
        const len = postInput.value.length;
        if (charCount) {
            charCount.textContent = MAX_CHARS - len;
            charCount.style.color = len > MAX_CHARS ? "#ff4b4b" : "var(--text-muted)";
        }
        checkPublishState();
    };

    // --- ФАЙЛЫ ---
    const btnAttach = document.getElementById('btnAttach');
    if (btnAttach && fileInput) {
        btnAttach.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                alert("Размер файла не должен превышать 10 МБ.");
                fileInput.value = "";
                return;
            }

            selectedFile = file;
            imagePreview.src = URL.createObjectURL(file);
            imagePreviewContainer.style.display = 'block';
            
            if (pollContainer) {
                pollContainer.style.display = 'none';
                isPollActive = false;
            }
            checkPublishState();
        };
    }

    if (removeImageBtn) {
        removeImageBtn.onclick = () => {
            selectedFile = null;
            if (fileInput) fileInput.value = "";
            imagePreviewContainer.style.display = 'none';
            checkPublishState();
        };
    }

    // --- ОПРОСЫ ---
    const btnPoll = document.getElementById('btnPoll');
    if (btnPoll && pollContainer) {
        btnPoll.onclick = () => {
            isPollActive = true;
            pollContainer.style.display = 'flex';
            
            selectedFile = null;
            if (fileInput) fileInput.value = "";
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            
            checkPublishState();
        };
    }

    pollInputs.forEach(input => input.addEventListener('input', checkPublishState));

    if (removePollBtn) {
        removePollBtn.onclick = () => {
            isPollActive = false;
            pollContainer.style.display = 'none';
            pollInputs.forEach(input => input.value = "");
            checkPublishState();
        };
    }

    // --- ПУБЛИКАЦИЯ ---
    publishBtn.onclick = async () => {
        publishBtn.disabled = true;
        const originalText = publishBtn.textContent;
        publishBtn.textContent = "Публикация...";

        try {
            let imageUrl = null;
            let pollData = null;

            if (selectedFile) {
                const fileRef = ref(storage, `posts/${Date.now()}_${selectedFile.name}`);
                await uploadBytes(fileRef, selectedFile);
                imageUrl = await getDownloadURL(fileRef);
            }

            if (isPollActive) {
                const options = Array.from(pollInputs)
                    .map(input => input.value.trim())
                    .filter(val => val !== "");
                if (options.length >= 2) {
                    pollData = {
                        options: options.map(opt => ({ text: opt, votes: 0 })),
                        totalVotes: 0
                    };
                }
            }

            await addDoc(collection(db, "posts"), {
                text: postInput.value.trim(),
                uid: user.uid,
                userName: user.displayName || user.email.split('@')[0], 
                createdAt: serverTimestamp(),
                imageUrl: imageUrl,
                poll: pollData,
                likes: 0,          // Счетчик лайков
                likedBy: []        // Кто поставил лайк
            });

            postInput.value = "";
            if (removeImageBtn) removeImageBtn.onclick();
            if (removePollBtn) removePollBtn.onclick();
            postInput.oninput();

        } catch (e) { 
            console.error(e); 
            alert("Ошибка при публикации поста."); 
        }
        
        publishBtn.textContent = originalText;
        checkPublishState();
    };

    // --- ОТРИСОВКА ЛЕНТЫ (Умное обновление без мерцания) ---
    let isInitialLoad = true;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    onSnapshot(q, async (snap) => {
        const changes = snap.docChanges();

        // УМНОЕ ОБНОВЛЕНИЕ ЛАЙКОВ БЕЗ МЕРЦАНИЯ
        const onlyModifications = changes.length > 0 && changes.every(change => change.type === 'modified');
        
        if (!isInitialLoad && onlyModifications) {
            changes.forEach(change => {
                const data = change.doc.data();
                const postId = change.doc.id;
                
                const likeBtn = document.querySelector(`.like-post-btn[data-id="${postId}"]`);
                if (likeBtn) {
                    const hasLiked = data.likedBy?.includes(user.uid);
                    const likeColor = hasLiked ? '#e0245e' : 'var(--text-muted)';
                    
                    const heartIcon = hasLiked 
                        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
                        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
                        
                    likeBtn.style.color = likeColor;
                    likeBtn.innerHTML = `${heartIcon} <span>${data.likes || 0}</span>`;
                }
            });
            return; // Прерываем функцию, чтобы избежать дерганья ленты
        }

        isInitialLoad = false;

        // ПОЛНАЯ ПЕРЕРИСОВКА (при загрузке, добавлении или удалении)
        document.querySelectorAll('.post-item').forEach(el => el.remove());
        const emptyState = feedContainer.querySelector('.empty-state');
        if (emptyState) emptyState.style.display = snap.empty ? 'block' : 'none';

        const userCache = {};
        const postsData = [];
        snap.forEach(doc => postsData.push({ id: doc.id, ...doc.data() }));

        // Сортировка: Сначала по популярности (лайкам), затем по дате
        postsData.sort((a, b) => {
            const likesDiff = (b.likes || 0) - (a.likes || 0);
            if (likesDiff !== 0) return likesDiff;
            const timeA = a.createdAt?.seconds || Date.now() / 1000;
            const timeB = b.createdAt?.seconds || Date.now() / 1000;
            return timeB - timeA; 
        });

        for (const data of postsData) {
            let author = userCache[data.uid];
            if (!author) {
                try {
                    const userDoc = await getDoc(doc(db, "users", data.uid));
                    author = userDoc.exists() ? userDoc.data() : {};
                    userCache[data.uid] = author;
                } catch (e) { author = {}; }
            }

            const authorName = author.name || data.userName || "Пользователь";
            const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "Сейчас";
            
            let avatarHtml = `<div class="create-post-avatar" style="background:#1d9bf0; color:white; display:flex; align-items:center; justify-content:center;">${authorName[0].toUpperCase()}</div>`;
            if (author.avatar) {
                if (author.avatar.length <= 2) { 
                    avatarHtml = `<div class="create-post-avatar" style="background:#2f3336; font-size: 20px; display:flex; align-items:center; justify-content:center;">${author.avatar}</div>`;
                } else { 
                    avatarHtml = `<div class="create-post-avatar" style="background: url('${author.avatar}') center/cover; color: transparent;"></div>`;
                }
            }

            const imageHtml = data.imageUrl ? 
                `<img src="${data.imageUrl}" style="max-width: 100%; max-height: 400px; border-radius: 12px; margin-top: 10px; border: 1px solid var(--border-color);">` : '';

            let pollHtml = '';
            if (data.poll) {
                pollHtml = `<div style="margin-top: 10px; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px;">`;
                data.poll.options.forEach(opt => {
                    pollHtml += `
                        <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; border: 1px solid var(--border-color);">
                            ${opt.text}
                        </div>
                    `;
                });
                pollHtml += `</div>`;
            }

            const deleteBtnHtml = data.uid === user.uid ? 
                `<button class="delete-post-btn" data-id="${data.id}" style="background:none; border:none; color:#ff4b4b; cursor:pointer; font-size: 13px; padding: 5px; opacity: 0.7;">🗑️ Удалить</button>` : '';

            const hasLiked = data.likedBy?.includes(user.uid);
            const likeColor = hasLiked ? '#e0245e' : 'var(--text-muted)';

            const heartIcon = hasLiked 
                ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
                : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

            const html = `
                <div class="create-post-container post-item" style="margin-top: 15px; border: 1px solid var(--border-color); animation: fadeIn 0.3s ease;">
                    <div class="create-post-top" style="display:flex; justify-content: space-between;">
                        <div style="display:flex; gap: 10px;">
                            ${avatarHtml}
                            <div style="display:flex; flex-direction:column; justify-content:center;">
                                <span style="font-weight:700;">${authorName}</span>
                                <span style="font-size:11px; color:var(--text-muted);">${time}</span>
                            </div>
                        </div>
                        <div>${deleteBtnHtml}</div>
                    </div>
                    <div style="padding-left:56px; margin-top:8px; line-height:1.4;">
                        ${data.text}
                        ${imageHtml}
                        ${pollHtml}
                        
                        <div style="margin-top: 15px; display: flex; align-items: center;">
                            <button class="like-post-btn" data-id="${data.id}" style="background:none; border:none; color:${likeColor}; cursor:pointer; font-size: 16px; display:flex; align-items:center; gap: 5px; padding: 5px; transition: 0.2s;">
                                ${heartIcon} <span>${data.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>`;
            
            if (emptyState) {
                emptyState.insertAdjacentHTML('beforebegin', html);
            } else {
                feedContainer.insertAdjacentHTML('beforeend', html);
            }
        }
    });

    // --- ОБРАБОТЧИК ЛАЙКОВ И УДАЛЕНИЯ (Делегирование) ---
    if (!feedContainer.dataset.listenerAttached) {
        feedContainer.addEventListener('click', async (e) => {
            
            // ЛАЙКИ
            const likeBtn = e.target.closest('.like-post-btn');
            if (likeBtn) {
                const postId = likeBtn.getAttribute('data-id');
                const postRef = doc(db, "posts", postId);
                
                try {
                    const postSnap = await getDoc(postRef);
                    if (postSnap.exists()) {
                        const postData = postSnap.data();
                        const hasLiked = postData.likedBy?.includes(user.uid);

                        if (hasLiked) {
                            await updateDoc(postRef, {
                                likes: increment(-1),
                                likedBy: arrayRemove(user.uid)
                            });
                        } else {
                            await updateDoc(postRef, {
                                likes: increment(1),
                                likedBy: arrayUnion(user.uid)
                            });
                        }
                    }
                } catch (err) { console.error("Ошибка при лайке:", err); }
            }

            // УДАЛЕНИЕ
            const deleteBtn = e.target.closest('.delete-post-btn');
            if (deleteBtn) {
                const postId = deleteBtn.getAttribute('data-id');
                const confirmDelete = confirm("Удалить этот пост? Действие нельзя отменить.");
                
                if (confirmDelete) {
                    try {
                        await deleteDoc(doc(db, "posts", postId));
                    } catch (err) {
                        console.error("Ошибка при удалении:", err);
                        alert("Не удалось удалить пост. Проверьте права доступа.");
                    }
                }
            }
        });
        feedContainer.dataset.listenerAttached = 'true';
    }
}

// ==========================================
// 6. УТИЛИТЫ (Прелоадер)
// ==========================================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 500);
    }
});


document.addEventListener('DOMContentLoaded', () => {
      // 1. Глобальная навигация (Левый сайдбар)
      const mainNavBtns = document.querySelectorAll('.sidebar-left .tab-btn');
      const mainViews = document.querySelectorAll('.view-section');

      mainNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          mainNavBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          mainViews.forEach(view => view.classList.remove('active'));
          const targetId = btn.getAttribute('data-target');
          document.getElementById(targetId).classList.add('active');
        });
      });

      // 2. Вкладки на Главной странице (Для вас, Лента, Подписки)
      const menuTabs = document.querySelectorAll('#view-menu .menu-tab');
      const menuInnerViews = document.querySelectorAll('#view-menu .inner-view');

      menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          menuTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          menuInnerViews.forEach(view => view.classList.remove('active'));
          const targetId = tab.getAttribute('data-menu-target');
          document.getElementById(targetId).classList.add('active');
        });
      });

      // 3. Вкладки в Профиле (Мои курсы, Достижения)
      const profileTabs = document.querySelectorAll('#view-profile .profile-tab');
      const profileInnerViews = document.querySelectorAll('#view-profile .inner-view');

      profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          profileTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          profileInnerViews.forEach(view => view.classList.remove('active'));
          const targetId = tab.getAttribute('data-profile-target');
          document.getElementById(targetId).classList.add('active');
        });
      });
    });

    