import type { Session } from "./types";

export type { Session };

// Chiavi di persistenza locale (resistenza totale al refresh)
const K_ROOM = "mm_room_code";
const K_PLAYER_ID = "mm_player_id";
const K_PLAYER_NAME = "mm_player_name";
const K_IS_HOST = "mm_is_host";

export function loadSession(): Session | null {
  const roomCode = localStorage.getItem(K_ROOM);
  const playerId = localStorage.getItem(K_PLAYER_ID);
  if (!roomCode || !playerId) return null;
  return {
    roomCode,
    playerId,
    playerName: localStorage.getItem(K_PLAYER_NAME) ?? "Ospite",
    isHost: localStorage.getItem(K_IS_HOST) === "true",
  };
}

export function saveSession(session: Session): void {
  localStorage.setItem(K_ROOM, session.roomCode);
  localStorage.setItem(K_PLAYER_ID, session.playerId);
  localStorage.setItem(K_PLAYER_NAME, session.playerName);
  localStorage.setItem(K_IS_HOST, String(session.isHost));
}

export function clearSession(): void {
  localStorage.removeItem(K_ROOM);
  localStorage.removeItem(K_PLAYER_ID);
  localStorage.removeItem(K_PLAYER_NAME);
  localStorage.removeItem(K_IS_HOST);
}
