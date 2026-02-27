import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import { K, type Extension } from "./constants";
import type { Rapport } from "./state";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is provided
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initFirebase() {
  if (app) return;
  
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
    }
  }
}

initFirebase();

/**
 * Save extension to Firebase Firestore
 */
export async function saveExtToFirebase(ext: Extension): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "extensions", ext.id), ext);
    return true;
  } catch (e) {
    console.error("Error saving extension to Firebase:", e);
    return false;
  }
}

/**
 * Delete extension from Firebase Firestore
 */
export async function deleteExtFromFirebase(extId: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "extensions", extId));
    return true;
  } catch (e) {
    console.error("Error deleting extension from Firebase:", e);
    return false;
  }
}

/**
 * Save rapport to Firebase Firestore
 */
export async function saveRapToFirebase(rap: Rapport): Promise<boolean> {
  if (!db) return false;
  try {
    await setDoc(doc(db, "rapports", rap.id), rap);
    return true;
  } catch (e) {
    console.error("Error saving rapport to Firebase:", e);
    return false;
  }
}

/**
 * Delete rapport from Firebase Firestore
 */
export async function deleteRapFromFirebase(rapId: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "rapports", rapId));
    return true;
  } catch (e) {
    console.error("Error deleting rapport from Firebase:", e);
    return false;
  }
}

/**
 * Subscribe to real-time extension changes
 */
export function subscribeToExtensions(
  onExtChange: (ext: Extension | null, action: "INSERT" | "UPDATE" | "DELETE") => void
): (() => void) | null {
  if (!db) return null;

  return onSnapshot(
    collection(db, "extensions"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          onExtChange(null, "DELETE");
        } else {
          const data = change.doc.data() as Extension;
          onExtChange(data, change.type === "added" ? "INSERT" : "UPDATE");
        }
      });
    },
    (error) => {
      console.error("Error listening to extensions:", error);
    }
  );
}

/**
 * Subscribe to real-time rapport changes
 */
export function subscribeToRapports(
  onRapChange: (rap: Rapport | null, action: "INSERT" | "UPDATE" | "DELETE") => void
): (() => void) | null {
  if (!db) return null;

  return onSnapshot(
    collection(db, "rapports"),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "removed") {
          onRapChange(null, "DELETE");
        } else {
          const data = change.doc.data() as Rapport;
          onRapChange(data, change.type === "added" ? "INSERT" : "UPDATE");
        }
      });
    },
    (error) => {
      console.error("Error listening to rapports:", error);
    }
  );
}

/**
 * Sync data from Firebase to localStorage
 */
export async function syncFromFirebase(showError?: (msg: string) => void): Promise<void> {
  if (!db) return;
  
  try {
    // Get extensions
    const extSnapshot = await getDocs(collection(db, "extensions"));
    const exts: Extension[] = [];
    extSnapshot.forEach((doc) => {
      exts.push(doc.data() as Extension);
    });
    if (exts.length) {
      localStorage.setItem(K.EXT, JSON.stringify(exts));
    }

    // Get rapports
    const rapSnapshot = await getDocs(collection(db, "rapports"));
    const raps: Rapport[] = [];
    rapSnapshot.forEach((doc) => {
      raps.push(doc.data() as Rapport);
    });
    if (raps.length) {
      localStorage.setItem(K.RAP, JSON.stringify(raps));
    }
  } catch (e) {
    console.error("Firebase sync error", e);
    if (showError) showError("Erreur de synchronisation Firebase, données locales utilisées");
  }
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return db !== null;
}
