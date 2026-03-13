import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { createSessionId } from './sessionId';

const PARTICIPANT_ID_KEY = 'pokoqc_participant_id';

export function getOrCreateParticipantId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}

export type SessionPhase = 'voting' | 'revealed';

export async function createSession(hostId: string): Promise<string> {
  const sessionId = createSessionId();
  const sessionRef = doc(db, 'sessions', sessionId);
  await setDoc(sessionRef, {
    createdAt: serverTimestamp(),
    hostId,
    phase: 'voting' as SessionPhase,
    currentStory: '',
  });
  return sessionId;
}

export type ParticipantRole = 'participant' | 'observer';

export async function addParticipant(
  sessionId: string,
  participantId: string,
  name: string,
  role: ParticipantRole = 'participant'
): Promise<string> {
  const participantRef = doc(db, 'sessions', sessionId, 'participants', participantId);
  const now = serverTimestamp();
  const snap = await getDoc(participantRef);
  const exists = snap.exists();
  // Préserver le rôle existant (ex. observateur) pour ne pas le réinitialiser à chaque refresh/reconnexion
  const currentRole = exists && snap.data()?.role === 'observer' ? 'observer' : role;
  await setDoc(
    participantRef,
    {
      participantId,
      name,
      joinedAt: now,
      lastSeen: now,
      role: currentRole,
      ...(exists ? {} : { vote: null }),
    },
    { merge: true }
  );
  return participantId;
}

export async function updateParticipantRole(
  sessionId: string,
  participantId: string,
  role: ParticipantRole
): Promise<void> {
  const docId = await getParticipantDocId(sessionId, participantId);
  if (!docId) return;
  const participantRef = doc(db, 'sessions', sessionId, 'participants', docId);
  await updateDoc(participantRef, role === 'observer' ? { role, vote: null } : { role });
}

export async function getParticipantDocId(
  sessionId: string,
  participantId: string
): Promise<string | null> {
  const refById = doc(db, 'sessions', sessionId, 'participants', participantId);
  if ((await getDoc(refById)).exists()) return participantId;
  const participantsRef = collection(db, 'sessions', sessionId, 'participants');
  const q = query(participantsRef, where('participantId', '==', participantId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function updateVote(
  sessionId: string,
  participantId: string,
  vote: string | null
): Promise<void> {
  const docId = await getParticipantDocId(sessionId, participantId);
  if (!docId) return;
  const participantRef = doc(db, 'sessions', sessionId, 'participants', docId);
  const snap = await getDoc(participantRef);
  if (snap.exists() && snap.data()?.role === 'observer') return; // Les observateurs ne votent pas
  await updateDoc(participantRef, { vote });
}

/** Met à jour la liste des co-hôtes (participantIds). Réservé à l’hôte. */
export async function updateCoHosts(sessionId: string, coHostIds: string[]): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, { coHostIds });
}

export async function revealCards(sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, { phase: 'revealed' });
}

export async function resetToVoting(sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const participantsRef = collection(db, 'sessions', sessionId, 'participants');
  const batch = writeBatch(db);
  batch.update(sessionRef, { phase: 'voting' });
  const snap = await getDocs(participantsRef);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { vote: null });
  });
  await batch.commit();
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  return snap.exists();
}
