import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
