import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmAR18Om3c4EnjAGY0W3p0lD0cJ3urMEQ",
  authDomain: "spck-jsi08-lhp-9244e.firebaseapp.com",
  projectId: "spck-jsi08-lhp-9244e",
  storageBucket: "spck-jsi08-lhp-9244e.firebasestorage.app",
  messagingSenderId: "397092011380",
  appId: "1:397092011380:web:e1ab4ae11b62fe412d8021",
  measurementId: "G-KPH1Y52J7M",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

console.log(app.name);

export { auth, provider, db };
export const API_KEY = "c3769802f2ab2e1d8578e1770d90ca47";
