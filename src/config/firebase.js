import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdvjRfPdbgqSM3Zz4ySq6AMPPURBDMKCA",
  authDomain: "jeopardy-73676.firebaseapp.com",
  projectId: "jeopardy-73676",
  storageBucket: "jeopardy-73676.firebasestorage.app",
  messagingSenderId: "533172195207",
  appId: "1:533172195207:web:ecca830d8d1aeb61580d22",
  measurementId: "G-LLBQB2LZS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
