import { useState } from "react";
import { Check, Copy, Crown, LogOut, QrCode, Users, Wifi, WifiOff } from "lucide-react";
import type { Room } from "../types";
import type { Session } from "../session";
import { STATUS_LABELS, cn } from "../utils";
import { QRCodeModal } from "./QRCodeModal";

export function Navbar({
  room,
  session,
  onLeave,
}: {
  room: Room;
  session: Session;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const players = Object.values(room.players ?? {});
  const online = players.filter((p) => p.isOnline).length;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponibile: il codice resta comunque visibile
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gold-700/25 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm tracking-[0.16em] text-gold-300 uppercase">
              {room.settings.title || "Cena con Delitto"}
            </p>
            <p className="flex items-center gap-2 text-sm text-parchment-400">
              {STATUS_LABELS[room.meta.status]}
              {room.meta.status === "IN_GAME" && room.meta.currentRound > 0 && (
                <span className="text-gold-500">
                  · Atto {room.meta.currentRound}/{room.meta.totalRounds}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={copyCode}
            title="Copia il codice stanza"
            className="chip cursor-pointer hover:border-gold-500/60"
          >
            {copied ? <Check size={12} className="text-gold-400" /> : <Copy size={12} />}
            {session.roomCode}
          </button>

          <span
            className="chip hidden sm:inline-flex"
            title={`${online} giocatori online su ${players.length}`}
          >
            <Users size={12} />
            {online}/{players.length}
          </span>

          <span
            className={cn("chip", online > 0 && "text-emerald-300/90")}
            title="Stato connessione della compagnia"
          >
            {online > 0 ? <Wifi size={12} /> : <WifiOff size={12} />}
          </span>

          <button
            type="button"
            onClick={() => setQrOpen(true)}
            title="Mostra QR Code di invito"
            className="rounded p-2 text-gold-400 transition-colors hover:text-gold-300"
          >
            <QrCode size={18} />
          </button>

          {session.isHost && (
            <span className="chip border-gold-500/60 text-gold-300" title="Game Master">
              <Crown size={12} />
              <span className="hidden sm:inline">GM</span>
            </span>
          )}

          <button
            type="button"
            onClick={onLeave}
            title="Abbandona la stanza"
            className="rounded p-2 text-parchment-400 transition-colors hover:text-blood-300"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <QRCodeModal open={qrOpen} code={session.roomCode} onClose={() => setQrOpen(false)} />
    </>
  );
}
