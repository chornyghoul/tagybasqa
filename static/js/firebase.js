// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvj75AoP4YWRNdz6ec4JMtJkw2QpkqNxw",
  authDomain: "learnplay-5b470.firebaseapp.com",
  projectId: "learnplay-5b470",
  storageBucket: "learnplay-5b470.firebasestorage.app",
  messagingSenderId: "75847585068",
  appId: "1:75847585068:web:0c17038fe5ed69adbd3089",
  measurementId: "G-GDC68987W2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.auth = auth;
window.db = db;
window.currentUser = null;

// Синхронизация с localStorage
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || (docSnap.exists() ? docSnap.data().name : user.email.split('@')[0]),
      role: docSnap.exists() ? docSnap.data().role : 'student'
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    window.currentUser = userData;
  } else {
    localStorage.removeItem('currentUser');
    window.currentUser = null;
  }
  if (typeof updateAuthUI === 'function') updateAuthUI();
});

// Глобальный выход
window.logout = () => signOut(auth);