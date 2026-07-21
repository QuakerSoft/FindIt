import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOCpLFrBpgej9sBR8KCmyiio1c75Kd2IU",
  authDomain: "findit-csun.firebaseapp.com",
  projectId: "findit-csun",
  storageBucket: "findit-csun.firebasestorage.app",
  messagingSenderId: "342993552133",
  appId: "1:342993552133:web:a378e860c650163364ad6c",
  measurementId: "G-MP4NLJ4BKE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);