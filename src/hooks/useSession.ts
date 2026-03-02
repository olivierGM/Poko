import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type SessionPhase = 'voting' | 'revealed';

export interface Session {
  id: string;
  createdAt: unknown;
  hostId: string;
  currentStory?: string;
  phase: SessionPhase;
}

export interface Participant {
  id: string;
  participantId: string;
  name: string;
  vote: string | null;
  joinedAt: unknown;
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
    const q = query(participantsRef, orderBy('joinedAt', 'asc'));
    const unsubParticipants = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list: Participant[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            participantId: data.participantId ?? '',
            name: data.name ?? '',
            vote: data.vote ?? null,
            joinedAt: data.joinedAt,
          };
        });
        setParticipants(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
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
