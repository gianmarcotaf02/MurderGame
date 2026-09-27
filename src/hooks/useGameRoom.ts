import { useEffect, useState } from "react";
import { onDisconnect, onValue, ref, update } from "firebase/database";
import { db } from "../config/firebase";
import type { Room } from "../types";

/**
 * Sottoscrizione realtime alla stanza + gestione della presenza online.
 * `loaded` diventa true al primo snapshot: permette all'app di capire
 * se la stanza esiste ancora (resistenza al refresh).
 */
export function useGameRoom(roomCode: string | null, playerId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Stato della stanza in tempo reale
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const unsub = onValue(
      ref(db, `rooms/${roomCode}`),
      (snap) => {
        setRoom(snap.exists() ? (snap.val() as Room) : null);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, [roomCode]);

  // Presenza (badge verde = online), con onDisconnect per i irtir di rete improvvisi
  useEffect(() => {
    if (!roomCode || !playerId) return;
    const connRef = ref(db, ".info/connected");
    const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
    const unsub = onValue(connRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(playerRef)
          .update({ isOnline: false, lastSeen: Date.now() })
          .then(() => update(playerRef, { isOnline: true, lastSeen: Date.now() }).catch(() => {}))
          .catch(() => {});
      }
    });
    return () => unsub();
  }, [roomCode, playerId]);

  return { room, loaded };
}
