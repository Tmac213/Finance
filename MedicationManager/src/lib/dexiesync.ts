import { db as dexieDb } from './dexie';
import { db as firestoreDb, auth } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  getDoc,
  writeBatch,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';

// Types matched to previous implementation
type EntityStats = { sent: number; updated: number; deleted: number; received: number };
type SyncStats = {
  transactions: EntityStats;
  fixedDues: EntityStats;
  testItems: EntityStats;
  vibesSalary: EntityStats;
  bullionHoldings: EntityStats;
  moneyHoldings: EntityStats;
  userSettings: EntityStats;
  recurringTransactions: EntityStats;
  historyLogs: EntityStats;
  medicationProfiles: EntityStats;
  medications: EntityStats;
};

const createStats = (): SyncStats => ({
  transactions: { sent: 0, updated: 0, deleted: 0, received: 0 },
  fixedDues: { sent: 0, updated: 0, deleted: 0, received: 0 },
  testItems: { sent: 0, updated: 0, deleted: 0, received: 0 },
  vibesSalary: { sent: 0, updated: 0, deleted: 0, received: 0 },
  bullionHoldings: { sent: 0, updated: 0, deleted: 0, received: 0 },
  moneyHoldings: { sent: 0, updated: 0, deleted: 0, received: 0 },
  userSettings: { sent: 0, updated: 0, deleted: 0, received: 0 },
  recurringTransactions: { sent: 0, updated: 0, deleted: 0, received: 0 },
  historyLogs: { sent: 0, updated: 0, deleted: 0, received: 0 },
  medicationProfiles: { sent: 0, updated: 0, deleted: 0, received: 0 },
  medications: { sent: 0, updated: 0, deleted: 0, received: 0 },
});

// Helper to get current user ID strictly from Firebase
function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

// Helper to sanitize data for Firestore (undefined -> null) recursive
const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object') {
    const clean: any = {};
    Object.keys(data).forEach(key => {
      clean[key] = sanitizeData(data[key]);
    });
    return clean;
  }
  return data;
};

export const dexieSync = {
  async sendAll(): Promise<SyncStats> {
    const stats = createStats();
    const userId = getCurrentUserId();

    if (!userId) {
      console.warn('[Sync] No user logged in, skipping sendAll');
      return stats;
    }

    console.log('[Sync] Starting Firestore push for user:', userId);

    try {
      // --- TRANSACTIONS ---
      const dirtyTxns = await dexieDb.transactions.where('dirty').equals(1).toArray();
      for (const txn of dirtyTxns) {
        const ref = doc(firestoreDb, 'users', userId, 'transactions', txn.id);
        if (txn.deleted) {
          await deleteDoc(ref);
          await dexieDb.transactions.delete(txn.id);
          stats.transactions.deleted++;
        } else {
          const { dirty, synced, ...data } = txn;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.transactions.update(txn.id, { dirty: 0, synced: 1 });
          stats.transactions.sent++;
        }
      }

      // --- FIXED DUES ---
      const dirtyDues = await dexieDb.fixed_dues.where('dirty').equals(1).toArray();
      for (const due of dirtyDues) {
        const ref = doc(firestoreDb, 'users', userId, 'fixed_dues', due.id);
        if (due.deleted) {
          await deleteDoc(ref);
          await dexieDb.fixed_dues.delete(due.id);
          stats.fixedDues.deleted++;
        } else {
          const { dirty, synced, ...data } = due;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.fixed_dues.update(due.id, { dirty: 0, synced: 1 });
          stats.fixedDues.sent++;
        }
      }

      // --- MEDICATION PROFILES ---
      const dirtyProf = await dexieDb.medication_profiles.where('dirty').equals(1).toArray();
      for (const prof of dirtyProf) {
        const ref = doc(firestoreDb, 'users', userId, 'medication_profiles', prof.id);
        if (prof.deleted) {
          await deleteDoc(ref);
          await dexieDb.medication_profiles.delete(prof.id);
          stats.medicationProfiles.deleted++;
        } else {
          const { dirty, synced, ...data } = prof;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.medication_profiles.update(prof.id, { dirty: 0, synced: 1 });
          stats.medicationProfiles.sent++;
        }
      }

      // --- MEDICATIONS ---
      const dirtyMeds = await dexieDb.medications.where('dirty').equals(1).toArray();
      for (const med of dirtyMeds) {
        const ref = doc(firestoreDb, 'users', userId, 'medications', med.id);
        if (med.deleted) {
          await deleteDoc(ref);
          await dexieDb.medications.delete(med.id);
          stats.medications.deleted++;
        } else {
          const { dirty, synced, ...data } = med;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.medications.update(med.id, { dirty: 0, synced: 1 });
          stats.medications.sent++;
        }
      }

      // --- VIBES SALARY ---
      const dirtyVibes = await dexieDb.vibes_salary.where('dirty').equals(1).toArray();
      if (dirtyVibes.length > 0) {
        const vibe = dirtyVibes[0];
        const ref = doc(firestoreDb, 'users', userId, 'vibes_salary', 'main');
        const { dirty, synced, ...data } = vibe;
        await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
        await dexieDb.vibes_salary.update(vibe.id, { dirty: 0, synced: 1 });
        stats.vibesSalary.sent++;
      }

      // --- BULLION HOLDINGS ---
      const dirtyBullion = await dexieDb.bullion_holdings.where('dirty').equals(1).toArray();
      if (dirtyBullion.length > 0) {
        const item = dirtyBullion[0];
        const ref = doc(firestoreDb, 'users', userId, 'bullion_holdings', 'main');
        const { dirty, synced, ...data } = item;
        await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
        await dexieDb.bullion_holdings.update(item.id, { dirty: 0, synced: 1 });
        stats.bullionHoldings.sent++;
      }

      // --- MONEY HOLDINGS ---
      const dirtyMoney = await dexieDb.money_holdings.where('dirty').equals(1).toArray();
      if (dirtyMoney.length > 0) {
        const item = dirtyMoney[0];
        const ref = doc(firestoreDb, 'users', userId, 'money_holdings', 'main');
        const { dirty, synced, ...data } = item;
        await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
        await dexieDb.money_holdings.update(item.id, { dirty: 0, synced: 1 });
        stats.moneyHoldings.sent++;
      }

      // --- USER SETTINGS ---
      const dirtySettings = await dexieDb.user_settings.where('dirty').equals(1).toArray();
      if (dirtySettings.length > 0) {
        const item = dirtySettings[0];
        const ref = doc(firestoreDb, 'users', userId, 'user_settings', 'main');
        const { dirty, synced, ...data } = item;
        await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
        await dexieDb.user_settings.update(item.user_id, { dirty: 0, synced: 1 });
        stats.userSettings.sent++;
      }

      // --- RECURRING TRANSACTIONS ---
      const dirtyRecurring = await dexieDb.recurring_transactions.where('dirty').equals(1).toArray();
      for (const rt of dirtyRecurring) {
        const ref = doc(firestoreDb, 'users', userId, 'recurring_transactions', rt.id);
        if (rt.deleted) {
          await deleteDoc(ref);
          await dexieDb.recurring_transactions.delete(rt.id);
          stats.recurringTransactions.deleted++;
        } else {
          const { dirty, synced, ...data } = rt;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.recurring_transactions.update(rt.id, { dirty: 0, synced: 1 });
          stats.recurringTransactions.sent++;
        }
      }

      // --- HISTORY LOGS ---
      const dirtyHistory = await dexieDb.history_logs.where('dirty').equals(1).toArray();
      for (const log of dirtyHistory) {
        const ref = doc(firestoreDb, 'users', userId, 'history_logs', log.id);
        if (log.deleted) {
          await deleteDoc(ref);
          await dexieDb.history_logs.delete(log.id);
          stats.historyLogs.deleted++;
        } else {
          const { dirty, synced, ...data } = log;
          await setDoc(ref, { ...sanitizeData(data), updatedAt: Timestamp.now() }, { merge: true });
          await dexieDb.history_logs.update(log.id, { dirty: 0, synced: 1 });
          stats.historyLogs.sent++;
        }
      }

    } catch (error: any) {
      if (error?.message?.includes('offline') || error?.code === 'unavailable') {
        console.warn('[Sync] Firestore Push Skipped (Offline/Unavailable):', error.message);
      } else {
        console.error('[Sync] Firestore Push Failed:', error);
      }
    }

    return stats;
  },

  async receiveAll(): Promise<SyncStats> {
    const stats = createStats();
    const userId = getCurrentUserId();
    if (!userId) return stats;

    console.log('[Sync] Starting Firestore pull for user:', userId);

    try {
      // Helper for collection pulls
      const pullCollection = async (colName: string, dbTable: any, stat: any) => {
        const snap = await getDocs(collection(firestoreDb, 'users', userId, colName));
        for (const d of snap.docs) {
          const remote: any = d.data();
          const recordId = d.id;
          const local = await dbTable.get(recordId);
          if (local && local.dirty === 1) continue;

          const record = { ...remote, id: recordId, user_id: userId, synced: 1, dirty: 0 };
          delete record.updatedAt;
          await dbTable.put(record);
          stat.received++;
        }
      };

      await pullCollection('transactions', dexieDb.transactions, stats.transactions);
      await pullCollection('fixed_dues', dexieDb.fixed_dues, stats.fixedDues);
      await pullCollection('recurring_transactions', dexieDb.recurring_transactions, stats.recurringTransactions);
      await pullCollection('history_logs', dexieDb.history_logs, stats.historyLogs);
      await pullCollection('medication_profiles', dexieDb.medication_profiles, stats.medicationProfiles);
      await pullCollection('medications', dexieDb.medications, stats.medications);

      // --- SINGLETONS ---
      const singletons = [
        { key: 'vibes_salary', dbTable: dexieDb.vibes_salary, stat: stats.vibesSalary },
        { key: 'bullion_holdings', dbTable: dexieDb.bullion_holdings, stat: stats.bullionHoldings },
        { key: 'money_holdings', dbTable: dexieDb.money_holdings, stat: stats.moneyHoldings },
        { key: 'user_settings', dbTable: dexieDb.user_settings, stat: stats.userSettings },
      ];

      for (const s of singletons) {
        const ref = doc(firestoreDb, 'users', userId, s.key, 'main');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const remote: any = snap.data();
          const id = remote.id || remote.user_id || userId;
          const local = await s.dbTable.get(id);
          if (local && local.dirty === 1) continue;

          const record = { ...remote, user_id: userId, synced: 1, dirty: 0 };
          delete record.updatedAt;
          if (s.key === 'user_settings') record.user_id = userId;
          else record.id = record.id || userId;

          await s.dbTable.put(record);
          s.stat.received++;
        }
      }

    } catch (error: any) {
      if (error?.message?.includes('offline') || error?.code === 'unavailable') {
        console.warn('[Sync] Firestore Pull Skipped (Offline/Unavailable):', error.message);
      } else {
        console.error('[Sync] Firestore Pull Failed:', error);
      }
    }

    return stats;
  },

  async syncAll(): Promise<SyncStats> {
    await this.sendAll();
    return await this.receiveAll();
  },

  subscribeToChanges(userId: string, onChange: () => void): () => void {
    if (!navigator.onLine) return () => { };

    const unsubscribes: Array<() => void> = [];
    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedOnChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { onChange(); }, 1000);
    };

    const collections = ['transactions', 'fixed_dues', 'recurring_transactions', 'medication_profiles', 'medications'];
    collections.forEach(colName => {
      const q = collection(firestoreDb, 'users', userId, colName);
      unsubscribes.push(onSnapshot(q, (snapshot) => {
        if (snapshot.docChanges().length > 0) debouncedOnChange();
      }));
    });

    const singletons = ['vibes_salary', 'bullion_holdings', 'money_holdings', 'user_settings'];
    singletons.forEach(docName => {
      const ref = doc(firestoreDb, 'users', userId, docName, 'main');
      unsubscribes.push(onSnapshot(ref, (doc) => {
        if (!doc.metadata.hasPendingWrites) debouncedOnChange();
      }));
    });

    return () => { unsubscribes.forEach(unsub => unsub()); };
  }
};
