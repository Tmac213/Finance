import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

// 🔥 ADD TRANSACTION
export const addTransaction = async (data: any) => {
  return await addDoc(collection(db, "transactions"), data);
};

// 🔥 EDIT TRANSACTION (real-time sync)
export const updateTransaction = async (id: string, data: any) => {
  return await updateDoc(doc(db, "transactions", id), data);
};

// 🔥 DELETE TRANSACTION
export const deleteTransaction = async (id: string) => {
  return await deleteDoc(doc(db, "transactions", id));
};

// 🔥 LISTEN REAL-TIME
export const listenTransactions = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "transactions"), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// -----------------------------------
// FIXED DUE PAYMENTS
// -----------------------------------

export const updateFixedDue = async (id: string, data: any) => {
  return await updateDoc(doc(db, "fixedDue", id), data);
};

export const listenFixedDue = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "fixedDue"), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// -----------------------------------
// SALARIES (VIBES)
// -----------------------------------

export const addSalaryPayment = async (data: any) => {
  return await addDoc(collection(db, "salaries"), data);
};

export const listenSalaries = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "salaries"), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// -----------------------------------
// MONEY TRACKING
// -----------------------------------

export const listenMoneyTracking = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "moneyTracking"), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// -----------------------------------
// BULLION TRACKING
// -----------------------------------

export const listenBullion = (callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, "bullion"), (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};
