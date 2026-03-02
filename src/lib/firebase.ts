import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.projectId &&
      firebaseConfig.apiKey &&
      typeof firebaseConfig.projectId === 'string' &&
      firebaseConfig.projectId.length > 0
  );
}

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.warn('Poko: Firebase non configuré (VITE_FIREBASE_* manquant dans .env). Création de session désactivée.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/** Realtime Database (présence). Nécessite VITE_FIREBASE_DATABASE_URL dans .env. */
export const rtdb = firebaseConfig.databaseURL
  ? getDatabase(app, firebaseConfig.databaseURL)
  : (null as unknown as ReturnType<typeof getDatabase>);

export function isRtdbConfigured(): boolean {
  return Boolean(firebaseConfig.databaseURL && String(firebaseConfig.databaseURL).length > 0);
}
