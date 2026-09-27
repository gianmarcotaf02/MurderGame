import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RoomStatus } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const STATUS_LABELS: Record<RoomStatus, string> = {
  LOBBY: "Vestibolo",
  GENERATING: "Generazione del Mistero",
  ASSIGNMENT: "Assegnazione dei Ruoli",
  IN_GAME: "In Scena",
  ACCUSATION: "Fase d'Accusa",
  REVEAL: "La Verità",
  COMPLETED: "Sessione Conclusa",
};

export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const ACT_LABELS = ["", "Atto I", "Atto II", "Atto III", "Atto IV", "Atto V"];
