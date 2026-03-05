import { ref, set, remove, onDisconnect, onValue, goOffline, goOnline } from 'firebase/database';
import { rtdb } from './firebase';
import { useEffect, useState } from 'react';

const PRESENCE_PATH = 'presence';

function presenceKey(sessionId: string): string {
  return sessionId.toLowerCase();
}

function presenceRef(sessionId: string, participantId: string) {
  return ref(rtdb!, `${PRESENCE_PATH}/${presenceKey(sessionId)}/${participantId}`);
}

function sessionPresenceRef(sessionId: string) {
  return ref(rtdb!, `${PRESENCE_PATH}/${presenceKey(sessionId)}`);
}

/**
 * Marque le participant comme présent. Quand la connexion est coupée (onglet fermé, etc.),
 * Firebase supprime automatiquement l'entrée via onDisconnect().
 * No-op si la Realtime Database n'est pas configurée (VITE_FIREBASE_DATABASE_URL manquant).
 */
export async function setPresence(
  sessionId: string,
  participantId: string,
  name: string
): Promise<void> {
  if (!rtdb) {
    console.debug('[Poko presence] setPresence skip: RTDB not configured');
    return;
  }
  const r = presenceRef(sessionId, participantId);
  await onDisconnect(r).remove();
  await set(r, { participantId, name, lastSeen: Date.now() });
  console.debug('[Poko presence] setPresence ok:', sessionId, participantId, name);
}

/**
 * Met à jour lastSeen pour le heartbeat (à appeler toutes les 10 s tant que l’utilisateur est là).
 */
export async function updatePresenceHeartbeat(
  sessionId: string,
  participantId: string,
  name: string
): Promise<void> {
  if (!rtdb) return;
  const r = presenceRef(sessionId, participantId);
  await set(r, { participantId, name, lastSeen: Date.now() });
}

/**
 * Retire le participant de la présence (quand il quitte volontairement la session).
 */
export async function removePresence(sessionId: string, participantId: string): Promise<void> {
  if (!rtdb) return;
  await remove(presenceRef(sessionId, participantId));
  console.debug('[Poko presence] removePresence ok:', sessionId, participantId);
}

/**
 * Déconnecte le client de la Realtime Database. Le serveur détecte la déconnexion
 * et exécute immédiatement les handlers onDisconnect() (ex. remove de la présence).
 * À appeler en pagehide/beforeunload pour que « parti » s’affiche tout de suite.
 */
export function disconnectPresence(): void {
  if (rtdb) {
    console.debug('[Poko presence] disconnectPresence (goOffline)');
    goOffline(rtdb);
  }
}

/** Réactive la connexion RTDB (après un goOffline). À appeler au montage de la page session. */
export function connectPresence(): void {
  if (rtdb) goOnline(rtdb);
}

/** Délai avant de considérer un participant « parti » (évite les « parti » qui clignotent). */
const STALE_AFTER_MS = 60_000; // 1 minute

/**
 * Retourne l'ensemble des participantId actuellement connectés à la session.
 * On considère « connecté » si lastSeen est à jour (dans les STALE_AFTER_MS), pour gérer
 * les fermetures d’onglet où le navigateur n’exécute pas nos handlers.
 */
export function usePresence(sessionId: string | null): Set<string> {
  const [presenceData, setPresenceData] = useState<Record<string, { lastSeen?: number }>>({});
  const [now, setNow] = useState(() => Date.now());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!rtdb || !sessionId) {
      console.debug('[Poko presence] usePresence: no subscribe (rtdb=', !!rtdb, 'sessionId=', sessionId, ')');
      setPresenceData({});
      return undefined;
    }
    console.debug('[Poko presence] usePresence: subscribing to session', sessionId);
    const r = sessionPresenceRef(sessionId);
    const unsubscribe = onValue(r, (snapshot) => {
      const val = snapshot.val();
      if (val == null || typeof val !== 'object') {
        console.log('[Poko presence] RTDB session presence:', sessionId, '-> empty');
        setPresenceData({});
        return;
      }
      const data = val as Record<string, { lastSeen?: number; name?: string }>;
      console.log('[Poko presence] RTDB session presence:', sessionId, '->', Object.keys(data), data);
      setPresenceData(data);
    });
    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const next = new Set<string>();
    for (const [key, entry] of Object.entries(presenceData)) {
      const lastSeen = entry?.lastSeen ?? 0;
      const fresh = lastSeen > 0 && now - lastSeen <= STALE_AFTER_MS;
      const legacy = lastSeen === 0;
      if (fresh || legacy) next.add(key);
    }
    console.debug('[Poko presence] connectedIds (sessionId, now, STALE_AFTER_MS):', sessionId, now, STALE_AFTER_MS, '->', [...next]);
    setConnectedIds(next);
  }, [presenceData, now, sessionId]);

  return connectedIds;
}
