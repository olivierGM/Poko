import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ParticipantSeat } from './ParticipantSeat';
import { EmojiReactionBar } from './EmojiReactionBar';
import { FlyingEmoji } from './FlyingEmoji';
import { sendReaction, useReactions } from '../lib/reactions';

const LOCAL_RATE_LIMIT_COUNT = 5;
const LOCAL_RATE_LIMIT_WINDOW_MS = 2500;
/** Durée de l’animation d’emoji (doit correspondre à FlyingEmoji). On ne retire un emoji de la liste qu’après ce délai. */
const FLY_DURATION_MS = 600;
import type { Participant } from '../hooks/useSession';
import type { SessionPhase } from '../hooks/useSession';

interface FlyingEmojiItem {
  id: string;
  emoji: string;
  fromLeft: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  addedAt: number;
}

interface PokerTableProps {
  participants: Participant[];
  phase: SessionPhase;
  currentParticipantId: string | null;
  /** IDs des participants actuellement connectés (Realtime Database). Absent = déconnecté. */
  connectedParticipantIds?: Set<string>;
  /** Session ID pour synchroniser les réactions (optionnel, ex. mode démo sans RTDB). */
  sessionId?: string | null;
}

export function PokerTable({
  participants,
  phase,
  currentParticipantId,
  connectedParticipantIds = new Set(),
  sessionId = null,
}: PokerTableProps) {
  // À la table : uniquement les participants qui votent (pas les observateurs)
  const voters = participants.filter((p) => p.role !== 'observer');
  const count = voters.length;
  const positions = getSeatPositions(count);
  const manySeats = count >= 8;
  const seatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmojiItem[]>([]);
  const [refResolveTick, setRefResolveTick] = useState(0);
  const addedReactionIdsRef = useRef<Set<string>>(new Set());
  const localSendTimestampsRef = useRef<number[]>([]);

  const { reactions: syncedReactions, markAnimated } = useReactions(sessionId);

  const partiNames = voters
    .filter((p) => {
      const isCurrent = p.participantId === currentParticipantId;
      const hasPresenceData = connectedParticipantIds.size > 0;
      return hasPresenceData && !isCurrent && !connectedParticipantIds.has(p.participantId);
    })
    .map((p) => p.name);
  if (count > 0) {
    console.debug('[Poko presence] PokerTable connectedIds:', [...connectedParticipantIds], '-> affiché (parti):', partiNames);
  }

  const canShowReaction = (participant: Participant) => {
    const isCurrent = participant.participantId === currentParticipantId;
    const hasPresenceData = connectedParticipantIds.size > 0;
    const isDisconnected =
      hasPresenceData && !isCurrent && !connectedParticipantIds.has(participant.participantId);
    return !isCurrent && !isDisconnected;
  };

  const addFlying = (item: Omit<FlyingEmojiItem, 'addedAt'>) => {
    const withTimestamp = { ...item, addedAt: Date.now() };
    setFlyingEmojis((prev) => {
      const next = [...prev, withTimestamp];
      const now = Date.now();
      // Ne retirer que les emojis dont l’animation est terminée (évite disparition en plein vol au spam)
      const stillFlying = next.filter((f) => now - f.addedAt <= FLY_DURATION_MS);
      return stillFlying.length <= 50 ? stillFlying : stillFlying.slice(-50);
    });
  };

  const removeFlying = (id: string) => {
    setFlyingEmojis((prev) => prev.filter((f) => f.id !== id));
    markAnimated(id);
  };

  useEffect(() => {
    const pending: typeof syncedReactions = [];
    const margin = 24;
    for (const r of syncedReactions) {
      if (addedReactionIdsRef.current.has(r.id)) continue;
      // Ne pas réafficher nos propres envois : on les a déjà ajoutés dans handleEmojiSelect, sinon doublon côté expéditeur
      if (currentParticipantId && r.fromParticipantId === currentParticipantId) continue;
      const participant = participants.find((p) => p.participantId === r.toParticipantId);
      if (!participant) continue;
      const wrapper = seatRefs.current[participant.participantId];
      if (!wrapper) {
        pending.push(r);
        continue;
      }
      const targetIndex = voters.indexOf(participant);
      const fromLeft = targetIndex < count / 2;
      const avatarEl = wrapper.querySelector<HTMLElement>('.participant-seat__avatar');
      const rect = avatarEl?.getBoundingClientRect() ?? wrapper.getBoundingClientRect();
      const endX = rect.left + rect.width / 2;
      const endY = rect.top + rect.height / 2;
      // Départ : position de l’émetteur (sur la table) si dispo, sinon bord de l’écran
      let startX: number;
      let startY: number;
      const senderWrapper = seatRefs.current[r.fromParticipantId];
      if (senderWrapper) {
        const senderAvatar = senderWrapper.querySelector<HTMLElement>('.participant-seat__avatar');
        const senderRect = senderAvatar?.getBoundingClientRect() ?? senderWrapper.getBoundingClientRect();
        startX = senderRect.left + senderRect.width / 2;
        startY = senderRect.top + senderRect.height / 2;
      } else {
        startX = fromLeft ? margin : window.innerWidth - margin;
        startY = window.innerHeight / 2;
      }
      addedReactionIdsRef.current.add(r.id);
      addFlying({
        id: r.id,
        emoji: r.emoji,
        fromLeft,
        startX,
        startY,
        endX,
        endY,
      });
    }
    if (pending.length > 0) {
      const t = setTimeout(() => setRefResolveTick((n) => n + 1), 80);
      return () => clearTimeout(t);
    }
  }, [syncedReactions, participants, voters, count, refResolveTick]);

  const handleEmojiSelect = async (participantId: string, index: number, emoji: string) => {
    const wrapper = seatRefs.current[participantId];
    if (!wrapper) return;
    const avatarEl = wrapper.querySelector<HTMLElement>('.participant-seat__avatar');
    const rect = avatarEl?.getBoundingClientRect() ?? wrapper.getBoundingClientRect();
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;
    const fromLeft = index < count / 2;
    const margin = 24;
    // Départ : ma position sur la table (avatar) si dispo, sinon bord de l’écran
    let startX: number;
    let startY: number;
    if (currentParticipantId) {
      const myWrapper = seatRefs.current[currentParticipantId];
      if (myWrapper) {
        const myAvatar = myWrapper.querySelector<HTMLElement>('.participant-seat__avatar');
        const myRect = myAvatar?.getBoundingClientRect() ?? myWrapper.getBoundingClientRect();
        startX = myRect.left + myRect.width / 2;
        startY = myRect.top + myRect.height / 2;
      } else {
        startX = fromLeft ? margin : window.innerWidth - margin;
        startY = window.innerHeight / 2;
      }
    } else {
      startX = fromLeft ? margin : window.innerWidth - margin;
      startY = window.innerHeight / 2;
    }

    if (sessionId && currentParticipantId) {
      const id = await sendReaction(sessionId, currentParticipantId, participantId, emoji, index);
      if (id) {
        addedReactionIdsRef.current.add(id);
        addFlying({ id, emoji, fromLeft, startX, startY, endX, endY });
      }
    } else {
      const now = Date.now();
      const cut = now - LOCAL_RATE_LIMIT_WINDOW_MS;
      localSendTimestampsRef.current = localSendTimestampsRef.current.filter((t) => t >= cut);
      if (localSendTimestampsRef.current.length >= LOCAL_RATE_LIMIT_COUNT) return;
      localSendTimestampsRef.current.push(now);
      addFlying({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        emoji,
        fromLeft,
        startX,
        startY,
        endX,
        endY,
      });
    }
  };

  return (
    <div className={`poker-table-container ${manySeats ? 'poker-table-container--many' : ''}`}>
      <div className="poker-table">
        <div className="poker-table__surface" aria-hidden />
        {voters.map((participant, index) => {
          const isCurrent = participant.participantId === currentParticipantId;
          const hasPresenceData = connectedParticipantIds.size > 0;
          const isDisconnected =
            hasPresenceData &&
            !isCurrent &&
            !connectedParticipantIds.has(participant.participantId);
          const showReaction = canShowReaction(participant);
          const isHovered = hoveredParticipantId === participant.participantId;

          return (
            <div
              key={participant.id}
              ref={(el) => {
                seatRefs.current[participant.participantId] = el;
              }}
              className="participant-seat-wrapper participant-seat-wrapper--reaction"
              style={positions[index]}
            >
              <div
                className="participant-seat-wrapper__hover-zone"
                onMouseEnter={() => showReaction && setHoveredParticipantId(participant.participantId)}
                onMouseLeave={() => setHoveredParticipantId(null)}
              >
                <div className="participant-seat-wrapper__emoji-bar-slot">
                  {showReaction && isHovered && (
                    <div className="participant-seat-wrapper__emoji-bar">
                      <EmojiReactionBar
                        onSelect={(emoji) => handleEmojiSelect(participant.participantId, index, emoji)}
                      />
                    </div>
                  )}
                </div>
                <ParticipantSeat
                  participant={participant}
                  phase={phase}
                  isCurrentUser={isCurrent}
                  isDisconnected={isDisconnected}
                />
              </div>
            </div>
          );
        })}
      </div>
      {createPortal(
        <>
          {flyingEmojis.map((f) => (
            <FlyingEmoji
              key={f.id}
              id={f.id}
              emoji={f.emoji}
              fromLeft={f.fromLeft}
              startX={f.startX}
              startY={f.startY}
              endX={f.endX}
              endY={f.endY}
              onEnd={removeFlying}
            />
          ))}
        </>,
        document.body
      )}
    </div>
  );
}

function getSeatPositions(count: number): CSSProperties[] {
  if (count === 0) return [];
  const positions: CSSProperties[] = [];
  const radius = count >= 10 ? 40 : count >= 8 ? 42 : 42;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    positions.push({
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    });
  }
  return positions;
}
