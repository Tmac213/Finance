import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLU2aBeRMBMg46rHltj4RcoGRZzy3-Op4",
  authDomain: "misthub-696e9.firebaseapp.com",
  projectId: "misthub-696e9",
  storageBucket: "misthub-696e9.firebasestorage.app",
  messagingSenderId: "1050054620250",
  appId: "1:1050054620250:web:9e14ce1b271ab9e8f6d463",
  measurementId: "G-ED1RWMVSLH"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
