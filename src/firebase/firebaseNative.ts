import { db as webDb, auth as webAuth } from "./firebase";

// Re-export the Web SDK Firestore instance and Auth
// Note: This does not have the same API as @react-native-firebase/firestore (chaining).
// If direct usage of 'db' is needed with chaining, use the Compat SDK or the helpers in firestoreNative.ts
export const db = webDb;
export const auth = webAuth;
