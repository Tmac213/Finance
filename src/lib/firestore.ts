import { collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export async function saveUserData(userId: string, data: any) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, data, { merge: true });
}

export async function getUserData(userId: string) {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export function subscribeToUserData(userId: string, callback: (data: any) => void) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    callback(doc.exists() ? doc.data() : null);
  });
}
