import { useEffect, useRef, useState } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { rtdb } from './firebase';

const REACTIONS_PATH = 'reactions';

/** Max réactions envoyables dans la fenêtre de temps. */
const RATE_LIMIT_COUNT = 5;
/** Fenêtre en ms (ex. 2,5 s). */
const RATE_LIMIT_WINDOW_MS = 2500;

const sentTimestampsBySession: Record<string, number[]> = {};

function sessionReactionsRef(sessionId: string) {
  return ref(rtdb!, `${REACTIONS_PATH}/${sessionId.toLowerCase()}`);
}

export interface ReactionPayload {
  fromParticipantId: string;
  toParticipantId: string;
  emoji: string;
  /** Index du siège cible (pour calculer fromLeft et position). */
  targetSeatIndex: number;
  timestamp: number;
}

function trimOldTimestamps(sessionId: string, now: number): void {
  const list = sentTimestampsBySession[sessionId] ?? [];
  const cut = now - RATE_LIMIT_WINDOW_MS;
  sentTimestampsBySession[sessionId] = list.filter((t) => t >= cut);
}

/**
 * Envoie une réaction emoji (rate limité). No-op si RTDB non configuré ou limite atteinte.
 * @returns L’id de la réaction (clé RTDB) ou null si pas envoyé.
 */
export async function sendReaction(
  sessionId: string,
  fromParticipantId: string,
  toParticipantId: string,
  emoji: string,
  targetSeatIndex: number
): Promise<string | null> {
  if (!rtdb) return null;

  const now = Date.now();
  trimOldTimestamps(sessionId, now);
  const list = sentTimestampsBySession[sessionId] ?? [];
  if (list.length >= RATE_LIMIT_COUNT) return null;

  const r = sessionReactionsRef(sessionId);
  const payload: ReactionPayload = {
    fromParticipantId,
    toParticipantId,
    emoji,
    targetSeatIndex,
    timestamp: now,
  };
  const newRef = push(r, payload);
  list.push(now);
  sentTimestampsBySession[sessionId] = list;
  return newRef.key;
}

export interface ReactionMessage extends ReactionPayload {
  id: string;
}

/**
 * S’abonne aux réactions de la session. Retourne la liste des réactions en attente d’animation
 * et une fonction pour retirer une réaction une fois animée.
 */
export function useReactions(
  sessionId: string | null
): { reactions: ReactionMessage[]; markAnimated: (id: string) => void } {
  const [reactions, setReactions] = useState<ReactionMessage[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const prevSnapshotRef = useRef<Record<string, ReactionPayload>>({});

  useEffect(() => {
    if (!rtdb || !sessionId) {
      setReactions([]);
      return undefined;
    }

    const r = sessionReactionsRef(sessionId);
    const unsubscribe = onValue(r, (snapshot) => {
      const val = snapshot.val();
      if (val == null || typeof val !== 'object') return;

      const current = val as Record<string, ReactionPayload>;
      const newReactions: ReactionMessage[] = [];

      const now = Date.now();
      const minTimestamp = now - 4000; /* ignorer les réactions de plus de 4 s au chargement */

      for (const [id, payload] of Object.entries(current)) {
        if (seenIdsRef.current.has(id)) continue;
        if (!payload || typeof payload !== 'object' || !payload.emoji || payload.targetSeatIndex == null) continue;
        seenIdsRef.current.add(id);
        if ((payload.timestamp ?? 0) < minTimestamp) continue; /* trop vieille, ne pas animer */
        newReactions.push({ ...payload, id });
      }

      prevSnapshotRef.current = current;

      if (newReactions.length > 0) {
        setReactions((prev) => {
          const next = [...prev, ...newReactions];
          const max = 30;
          return next.slice(-max);
        });
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const markAnimated = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  };

  return { reactions, markAnimated };
}
