import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    setDoc,
} from "firebase/firestore";
import { db, auth } from "./firebaseNative";

// Adapter implementation: Using Web SDK (v9 Modular) to provide the requested helpers
// Updated to use USER-SCOPED collections to match the main app's structure
// Collection paths: users/{userId}/transactions, users/{userId}/fixed_dues, etc.

// Helper to get current user ID
const getCurrentUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

// Transactions (User-scoped)
export const addTransaction = async (data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await addDoc(collection(db, "users", userId, "transactions"), data);
};

export const updateTransaction = async (id: string, data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await updateDoc(doc(db, "users", userId, "transactions", id), data);
};

export const deleteTransaction = async (id: string) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await deleteDoc(doc(db, "users", userId, "transactions", id));
};

export const listenTransactions = (callback: (list: any[]) => void) => {
    const userId = getCurrentUserId();
    if (!userId) {
        console.warn("listenTransactions: User not authenticated, returning empty array");
        callback([]);
        return () => { }; // Return empty unsubscribe function
    }

    return onSnapshot(collection(db, "users", userId, "transactions"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// Fixed Dues (User-scoped)
export const addFixedDue = async (data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await addDoc(collection(db, "users", userId, "fixed_dues"), data);
};

export const updateFixedDue = async (id: string, data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await updateDoc(doc(db, "users", userId, "fixed_dues", id), data);
};

export const deleteFixedDue = async (id: string) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await deleteDoc(doc(db, "users", userId, "fixed_dues", id));
};

export const listenFixedDues = (callback: (list: any[]) => void) => {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    return onSnapshot(collection(db, "users", userId, "fixed_dues"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// Salaries (User-scoped - using setDoc for singleton pattern)
export const addSalaryPayment = async (data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    // Vibes salary is a singleton document, so we use 'main' as the ID
    return await setDoc(doc(db, "users", userId, "vibes_salary", "main"), data, { merge: true });
};

export const updateSalaryPayment = async (id: string, data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await updateDoc(doc(db, "users", userId, "vibes_salary", id), data);
};

export const deleteSalaryPayment = async (id: string) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await deleteDoc(doc(db, "users", userId, "vibes_salary", id));
};

export const listenSalaries = (callback: (list: any[]) => void) => {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    return onSnapshot(collection(db, "users", userId, "vibes_salary"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// Money Tracking (User-scoped singleton)
export const updateMoneyHolding = async (id: string, data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await updateDoc(doc(db, "users", userId, "money_holdings", id), data);
};

export const listenMoneyHoldings = (callback: (list: any[]) => void) => {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    return onSnapshot(collection(db, "users", userId, "money_holdings"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// Bullion (User-scoped singleton)
export const updateBullion = async (id: string, data: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    return await updateDoc(doc(db, "users", userId, "bullion_holdings", id), data);
};

export const listenBullion = (callback: (list: any[]) => void) => {
    const userId = getCurrentUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    return onSnapshot(collection(db, "users", userId, "bullion_holdings"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        callback(list);
    });
};
