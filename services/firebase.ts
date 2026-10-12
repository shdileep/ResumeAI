import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { ResumeData } from '../types';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isConfigured = Boolean(rawApiKey && rawApiKey !== 'your_api_key');

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Fallback state management when Firebase credentials are not provided
type AuthListener = (user: any) => void;
const listeners: Set<AuthListener> = new Set();

const DEMO_USER_KEY = 'resumeai_demo_user';
const DEMO_RESUME_KEY = 'resumeai_resume_';

const getStoredMockUser = () => {
  const stored = localStorage.getItem(DEMO_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  const defaultUser = {
    uid: 'demo-user-123',
    displayName: 'Demo User',
    email: 'demo@resumeai.local',
    photoURL: ''
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultUser));
  return defaultUser;
};

let realApp: any = null;
let realAuth: any = null;
let realDb: any = null;

if (isConfigured) {
  try {
    realApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    realAuth = getAuth(realApp);
    realDb = getDatabase(realApp);
  } catch (e) {
    console.warn("Failed to initialize Firebase with provided credentials, falling back to local demo mode:", e);
    realAuth = null;
    realDb = null;
  }
}

export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;

export const auth: any = realAuth || {
  get currentUser() {
    return getStoredMockUser();
  }
};

export const onAuthStateChanged = (
  authInstance: any,
  callback: (user: any) => void
) => {
  if (realAuth) {
    return firebaseOnAuthStateChanged(authInstance, callback);
  }
  listeners.add(callback);
  callback(getStoredMockUser());
  return () => {
    listeners.delete(callback);
  };
};

export const signInWithGoogle = async () => {
  if (realAuth) {
    try {
      await signInWithPopup(realAuth, googleProvider!);
      return;
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  }

  const user = {
    uid: 'demo-user-' + Date.now(),
    displayName: 'Demo User',
    email: 'demo@resumeai.local',
    photoURL: ''
  };
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  listeners.forEach(cb => cb(user));
};

export const logout = async () => {
  if (realAuth) {
    try {
      await signOut(realAuth);
      return;
    } catch (error) {
      console.error("Error signing out", error);
    }
  }

  localStorage.removeItem(DEMO_USER_KEY);
  listeners.forEach(cb => cb(null));
};

export const saveResume = async (userId: string, resumeData: ResumeData) => {
  if (realDb) {
    try {
      await set(ref(realDb, 'users/' + userId + '/resume'), resumeData);
      return;
    } catch (error) {
      console.error("Error saving resume to Firebase", error);
      throw error;
    }
  }

  try {
    localStorage.setItem(DEMO_RESUME_KEY + userId, JSON.stringify(resumeData));
  } catch (error) {
    console.error("Error saving resume locally", error);
    throw error;
  }
};

export const getResume = async (userId: string): Promise<ResumeData | null> => {
  if (realDb) {
    try {
      const dbRef = ref(realDb);
      const snapshot = await get(child(dbRef, `users/${userId}/resume`));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error("Error getting resume from Firebase", error);
      return null;
    }
  }

  try {
    const raw = localStorage.getItem(DEMO_RESUME_KEY + userId);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Error reading local resume", error);
    return null;
  }
};
