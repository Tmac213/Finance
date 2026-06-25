// Import from the centralized firebase config instead of re-initializing
import { db, auth } from '../firebase/firebase';
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// Re-export for compatibility with existing imports
export { auth, db };

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed-precondition', err);
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence unimplemented', err);
    }
});

