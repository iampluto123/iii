// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUp__xcJNnQM2Bk6R7GD2tPLyQEDp2-zs",
  authDomain: "login-293d0.firebaseapp.com",
  projectId: "login-293d0",
  storageBucket: "login-293d0.firebasestorage.app",
  messagingSenderId: "657838704633",
  appId: "1:657838704633:web:b88700dbdf7d3958dd9f28",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
