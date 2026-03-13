import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type SessionPhase = 'voting' | 'revealed';

export interface Session {
  id: string;
  createdAt: unknown;
  hostId: string;
  /** IDs des co-hôtes (peuvent révéler les cartes et lancer un nouveau tour). */
  coHostIds?: string[];
  currentStory?: string;
  phase: SessionPhase;
}

export type ParticipantRole = 'participant' | 'observer';

export interface Participant {
  id: string;
  participantId: string;
  name: string;
  vote: string | null;
  joinedAt: unknown;
  lastSeen?: unknown;
  role?: ParticipantRole;
}

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setParticipants([]);
      setLoading(false);
      return;
    }

    setSession(null);
    setParticipants([]);
    setLoading(true);
    setError(null);

    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubSession = onSnapshot(
      sessionRef,
      (snap: DocumentSnapshot<DocumentData>) => {
        if (!snap.exists()) {
          setSession(null);
          setError('Session introuvable');
          setLoading(false);
          return;
        }
        const data = snap.data()!;
        setSession({
          id: snap.id,
          createdAt: data.createdAt,
          hostId: data.hostId ?? '',
          coHostIds: Array.isArray(data.coHostIds) ? data.coHostIds : [],
          currentStory: data.currentStory,
          phase: (data.phase as SessionPhase) ?? 'voting',
        });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const participantsRef = collection(db, 'sessions', sessionId, 'participants');
    const unsubParticipants = onSnapshot(
      participantsRef,
      (snap: QuerySnapshot<DocumentData>) => {
        const list: Participant[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            participantId: data.participantId ?? '',
            name: data.name ?? '',
            vote: data.vote ?? null,
            joinedAt: data.joinedAt,
            role: (data.role === 'observer' ? 'observer' : 'participant') as ParticipantRole,
            lastSeen: data.lastSeen,
          };
        });
        const byParticipantId = new Map<string, Participant>();
        for (const p of list) {
          const pid = p.participantId;
          if (!pid) continue;
          const existing = byParticipantId.get(pid);
          if (!existing) byParticipantId.set(pid, p);
          else {
            const ta = existing.joinedAt as { toMillis?: () => number } | null;
            const tb = p.joinedAt as { toMillis?: () => number } | null;
            if (tb?.toMillis && (!ta?.toMillis || tb.toMillis() < ta.toMillis()))
              byParticipantId.set(pid, p);
          }
        }
        const deduped = [...byParticipantId.values()];
        deduped.sort((a, b) => {
          const ta = a.joinedAt as { toMillis?: () => number } | null;
          const tb = b.joinedAt as { toMillis?: () => number } | null;
          if (ta?.toMillis && tb?.toMillis) return ta.toMillis() - tb.toMillis();
          return (a.participantId || a.id).localeCompare(b.participantId || b.id);
        });
        setParticipants(deduped);
        setLoading(false);
      },
      () => {
        setParticipants([]);
        setLoading(false);
      }
    );

    return () => {
      unsubSession();
      unsubParticipants();
    };
  }, [sessionId]);

  return { session, participants, loading, error };
}
