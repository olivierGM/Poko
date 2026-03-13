import { useEffect, useRef, useState } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { rtdb } from './firebase';

const REACTIONS_PATH = 'reactions';

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 2500;

const sentTimestampsBySession: Record<string, number[]> = {};

function sessionReactionsRef(sessionId: string) {
  return ref(rtdb!, `${REACTIONS_PATH}/${sessionId.toLowerCase()}`);
}

export interface ReactionPayload {
  fromParticipantId: string;
  toParticipantId: string;
  emoji: string;
  targetSeatIndex: number;
  timestamp: number;
}

function trimOldTimestamps(sessionId: string, now: number): void {
  const list = sentTimestampsBySession[sessionId] ?? [];
  const cut = now - RATE_LIMIT_WINDOW_MS;
  sentTimestampsBySession[sessionId] = list.filter((t) => t >= cut);
}

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
      const minTimestamp = now - 4000;

      for (const [id, payload] of Object.entries(current)) {
        if (seenIdsRef.current.has(id)) continue;
        if (!payload || typeof payload !== 'object' || !payload.emoji || payload.targetSeatIndex == null) continue;
        seenIdsRef.current.add(id);
        if ((payload.timestamp ?? 0) < minTimestamp) continue;
        newReactions.push({ ...payload, id });
      }

      prevSnapshotRef.current = current;

      if (newReactions.length > 0) {
        setReactions((prev) => {
          const next = [...prev, ...newReactions];
          return next.slice(-30);
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
