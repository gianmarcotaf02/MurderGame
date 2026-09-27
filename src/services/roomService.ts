import { get, ref, remove, set, update } from "firebase/database";
import { db } from "../config/firebase";
import { generateFallbackStory, generateStory, type GeneratedStory } from "./geminiService";
import type { Character, Room, RoomSettings, Round } from "../types";
import { generateRoomCode } from "../utils";

/** Crea una nuova stanza con codice unico e ritorna il codice. */
export async function createRoom(settings: RoomSettings, hostUid: string, hostName: string): Promise<string> {
  let code = generateRoomCode();
  // Evita collisioni di codice stanza
  for (let i = 0; i < 10; i++) {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) break;
    code = generateRoomCode();
  }

  const room = {
    meta: {
      createdAt: Date.now(),
      hostUid,
      status: "LOBBY" as const,
      currentRound: 0,
      totalRounds: 3,
      passcode: generateRoomCode(),
    },
    settings,
    story: null,
    characters: null,
    rounds: null,
    accusations: null,
    players: {
      [hostUid]: {
        name: hostName || "Game Master",
        characterId: null,
        isHost: true,
        isOnline: true,
        lastSeen: Date.now(),
      },
    },
  };

  await set(ref(db, `rooms/${code}`), room);
  return code;
}

export type JoinResult = { ok: true } | { ok: false; error: string };

/**
 * Pre-check del codice stanza: verifica che esista e sia aperta, e ritorna
 * i nomi dei partecipanti ancora disponibili (se l'host li ha configurati).
 */
export async function getJoinInfo(
  code: string,
): Promise<{ ok: true; freeNames: string[]; requirePick: boolean } | { ok: false; error: string }> {
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) return { ok: false, error: "Stanza non trovata. Controlla il codice." };
  const room = snap.val() as Room;
  const status = room.meta?.status;
  if (status !== "LOBBY" && status !== "ASSIGNMENT") {
    return { ok: false, error: "La partita è già iniziata o è terminata." };
  }
  const taken = new Set(Object.values(room.players ?? {}).map((p) => p.name.toLowerCase()));
  const all = room.settings?.participantNames ?? [];
  const freeNames = all.filter((n) => !taken.has(n.toLowerCase()));
  return { ok: true, freeNames, requirePick: all.length > 0 };
}

/** Unisce un giocatore alla stanza (solo in LOBBY o ASSIGNMENT). */
export async function joinRoom(code: string, uid: string, name: string): Promise<JoinResult> {
  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) return { ok: false, error: "Stanza non trovata. Controlla il codice." };
  const room = snap.val() as Room;
  const status = room.meta?.status;
  if (status !== "LOBBY" && status !== "ASSIGNMENT") {
    return { ok: false, error: "La partita è già iniziata o è terminata." };
  }
  const existing = room.players?.[uid];
  await set(ref(db, `rooms/${code}/players/${uid}`), {
    name,
    characterId: existing?.characterId ?? null,
    isHost: false,
    isOnline: true,
    lastSeen: Date.now(),
    joinedAt: Date.now(),
  });

  // Assegnazione automatica: se l'host ha configurato i nomi dei partecipanti,
  // chi sceglie il proprio nome riceve immediatamente la propria scheda.
  const match = Object.values(room.characters ?? {}).find(
    (c) =>
      !c.assignedToPlayerId &&
      (c.assignedPlayerName ?? "").toLowerCase() === name.toLowerCase() &&
      !existing?.characterId,
  );
  if (match) {
    await update(ref(db, `rooms/${code}`), {
      [`characters/${match.id}/assignedToPlayerId`]: uid,
      [`players/${uid}/characterId`]: match.id,
    });
  }
  return { ok: true };
}

/**
 * Genera la trama (Gemini, con fallback offline), la scrive su Firebase
 * e porta la stanza in ASSIGNMENT. Ritorna true se è stata usata la trama di riserva.
 */
export async function generateStoryForRoom(code: string, settings: RoomSettings): Promise<boolean> {
  await update(ref(db, `rooms/${code}/meta`), { status: "GENERATING" });
  try {
    let story: GeneratedStory;
    let usedFallback = false;
    try {
      story = await generateStory(settings);
    } catch {
      story = generateFallbackStory(settings);
      usedFallback = true;
    }

    const characters: Record<string, Character> = {};
    for (const c of story.characters) {
      characters[c.id] = { ...c, assignedToPlayerId: null, assignedPlayerName: null };
    }
    const rounds: Record<string, Round> = {};
    story.rounds.slice(0, 3).forEach((r, i) => {
      rounds[String(i + 1)] = r;
    });

    await update(ref(db, `rooms/${code}`), {
      story: {
        prologue: story.prologue,
        victim: story.victim,
        truth: story.truth,
        culpritCharacterId: story.culpritCharacterId,
      },
      characters,
      rounds,
      "settings/title": story.title,
    });
    await update(ref(db, `rooms/${code}/meta`), {
      status: "ASSIGNMENT",
      currentRound: 0,
      totalRounds: Object.keys(rounds).length,
    });

    // Pre-assegnazione per nome: se l'host ha inserito i nomi dei partecipanti,
    // ogni personaggio è riservato al giocatore con quel nome (e chi è già
    // entrato in stanza riceve la scheda all'istante).
    const names = (settings.participantNames ?? []).map((n) => n.trim()).filter(Boolean);
    const charList = Object.values(characters);
    if (names.length === charList.length && names.length > 0) {
      const updates: Record<string, unknown> = {};
      charList.forEach((c, i) => {
        if (!c.assignedToPlayerId) updates[`characters/${c.id}/assignedPlayerName`] = names[i];
      });
      const roomSnap = await get(ref(db, `rooms/${code}`));
      const current = roomSnap.val() as Room;
      for (const [uid, p] of Object.entries(current.players ?? {})) {
        const idx = names.findIndex((n) => n.toLowerCase() === p.name.toLowerCase());
        const c = idx >= 0 ? charList[idx] : undefined;
        if (c && !c.assignedToPlayerId && !p.characterId) {
          updates[`characters/${c.id}/assignedToPlayerId`] = uid;
          updates[`characters/${c.id}/assignedPlayerName`] = p.name;
          updates[`players/${uid}/characterId`] = c.id;
        }
      }
      await applyAssignments(code, updates);
    }
    return usedFallback;
  } catch (err) {
    await update(ref(db, `rooms/${code}/meta`), { status: "LOBBY" }).catch(() => {});
    throw err;
  }
}

/**
 * Calcola gli aggiornamenti per assegnare (o liberare) un personaggio,
 * garantendo la coerenza bidirezionale characters ↔ players.
 */
export function computeAssignUpdates(
  room: Room,
  charId: string,
  targetPlayerId: string | null,
  npc: boolean,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  const chars = room.characters ?? {};
  const players = room.players ?? {};

  // Chi ha ora questo personaggio lo perde, se non è il nuovo assegnatario
  for (const [uid, p] of Object.entries(players)) {
    if (p.characterId === charId && uid !== targetPlayerId) {
      updates[`players/${uid}/characterId`] = null;
    }
  }
  const prevOwner = chars[charId]?.assignedToPlayerId ?? null;
  if (prevOwner && prevOwner !== targetPlayerId) {
    updates[`players/${prevOwner}/characterId`] = null;
  }

  if (targetPlayerId && !npc) {
    // Libera il personaggio precedentemente in mano al giocatore
    const prevChar = players[targetPlayerId]?.characterId ?? null;
    if (prevChar && prevChar !== charId) {
      updates[`characters/${prevChar}/assignedToPlayerId`] = null;
      updates[`characters/${prevChar}/assignedPlayerName`] = null;
    }
    updates[`characters/${charId}/assignedToPlayerId`] = targetPlayerId;
    updates[`characters/${charId}/assignedPlayerName`] = players[targetPlayerId]?.name ?? "Ospite";
    updates[`players/${targetPlayerId}/characterId`] = charId;
  } else {
    updates[`characters/${charId}/assignedToPlayerId`] = null;
    updates[`characters/${charId}/assignedPlayerName`] = npc
      ? "NPC — interpretato dal Game Master"
      : null;
  }
  return updates;
}

export async function applyAssignments(code: string, updates: Record<string, unknown>): Promise<void> {
  if (Object.keys(updates).length > 0) {
    await update(ref(db, `rooms/${code}`), updates);
  }
}

/** Assegnazione random dell'host: i giocatori senza ruolo ricevono un personaggio libero. */
export async function assignRandomCharacters(code: string, room: Room): Promise<void> {
  const players = Object.entries(room.players ?? {}).filter(([, p]) => !p.characterId);
  const freeChars = Object.values(room.characters ?? {}).filter(
    (c) => !c.assignedToPlayerId && !c.assignedPlayerName,
  );
  const pool = [...freeChars];
  const updates: Record<string, unknown> = {};
  for (const [uid, p] of players) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    const c = pool.splice(idx, 1)[0];
    updates[`characters/${c.id}/assignedToPlayerId`] = uid;
    updates[`characters/${c.id}/assignedPlayerName`] = p.name;
    updates[`players/${uid}/characterId`] = c.id;
  }
  await applyAssignments(code, updates);
}

/** I personaggi rimasti liberi diventano NPC interpretati dal Game Master. */
export async function assignRemainingAsNpc(code: string, room: Room): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const c of Object.values(room.characters ?? {})) {
    if (!c.assignedToPlayerId && !c.assignedPlayerName) {
      updates[`characters/${c.id}/assignedPlayerName`] = "NPC — interpretato dal Game Master";
    }
  }
  await applyAssignments(code, updates);
}

/** La partita può iniziare solo se ogni giocatore ha un personaggio. */
export function canStartGame(room: Room): boolean {
  const players = Object.values(room.players ?? {});
  if (players.length === 0) return false;
  return players.every((p) => !!p.characterId);
}

export async function startGame(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}/meta`), { status: "IN_GAME", currentRound: 1 });
}

export async function advanceRound(code: string, next: number): Promise<void> {
  await update(ref(db, `rooms/${code}/meta`), { currentRound: next });
}

export async function openAccusation(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}/meta`), { status: "ACCUSATION" });
}

export async function submitAccusation(
  code: string,
  uid: string,
  accusedCharacterId: string,
  motive: string,
): Promise<void> {
  await set(ref(db, `rooms/${code}/accusations/${uid}`), {
    accusedCharacterId,
    motive: motive.trim(),
    submittedAt: Date.now(),
  });
}

export async function revealTruth(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}/meta`), { status: "REVEAL" });
}

export async function completeGame(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}/meta`), { status: "COMPLETED" });
}

/** Chiude definitivamente la stanza (rimozione dal database). */
export async function closeRoom(code: string): Promise<void> {
  await remove(ref(db, `rooms/${code}`));
}
