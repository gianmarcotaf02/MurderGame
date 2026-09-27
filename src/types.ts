export type RoomStatus =
  | "LOBBY"
  | "GENERATING"
  | "ASSIGNMENT"
  | "IN_GAME"
  | "ACCUSATION"
  | "REVEAL"
  | "COMPLETED";

export interface PlayerEntry {
  name: string;
  characterId: string | null;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: number;
  joinedAt: number;
}

export interface Victim {
  name: string;
  age: number;
  occupation: string;
  causeOfDeath: string;
  isSuicideOrAccident: boolean;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  publicBio: string;
  relationshipWithVictim: string;
  secrets: string[];
  alibi: string;
  assignedToPlayerId: string | null;
  assignedPlayerName: string | null;
}

export interface Round {
  title: string;
  globalClue: string;
  privateClues: Record<string, string>;
}

export interface Story {
  prologue: string;
  victim: Victim;
  truth: string;
  culpritCharacterId: string;
}

export interface RoomSettings {
  title: string;
  setting: string;
  tone: string;
  allowSuicideOrAccident: boolean;
  complexity: string;
  playerCount: number;
  customNotes: string;
}

export interface RoomMeta {
  createdAt: number;
  hostUid: string;
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
  passcode: string;
}

export interface Accusation {
  accusedCharacterId: string;
  motive: string;
  submittedAt: number;
}

export interface Room {
  meta: RoomMeta;
  settings: RoomSettings;
  story: Story | null;
  characters: Record<string, Character> | null;
  rounds: Record<string, Round> | null;
  players: Record<string, PlayerEntry> | null;
  accusations: Record<string, Accusation> | null;
}

export interface Session {
  roomCode: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}
