import { useEffect, useState } from "react";
import { Crown, Dices, Feather, LoaderCircle, QrCode, Sparkles, UserRound, Users } from "lucide-react";
import type { Character, Room } from "../types";
import type { Session } from "../session";
import {
  applyAssignments,
  assignRandomCharacters,
  assignRemainingAsNpc,
  canStartGame,
  computeAssignUpdates,
  generateStoryForRoom,
  startGame,
} from "../services/roomService";
import { NoticeBanner, OrnamentDivider, SectionTitle } from "../components/ui";
import { QRCodeModal } from "../components/QRCodeModal";
import { cn } from "../utils";

const GENERATING_MESSAGES = [
  "L'AI sta nascondendo il corpo...",
  "Falsificazione degli alibi in corso...",
  "Le candele vengono accese una a una...",
  "Un colpo di scena si intrufola sotto il tappeto...",
  "Intreccio dei moventi in agitazione...",
  "La polvere azzurrognola viene spruzzata sul calice...",
  "Il maggiordomo studia la sua peggior bugia...",
];

function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % GENERATING_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
      <Feather className="animate-flicker text-gold-500" size={52} strokeWidth={1.4} />
      <p className="animate-pulse-soft font-display text-sm tracking-[0.28em] text-gold-300 uppercase">
        Il destino sta tessendo il mistero
      </p>
      <p key={msgIndex} className="animate-fade-in text-xl text-parchment-200 italic">
        {GENERATING_MESSAGES[msgIndex]}
      </p>
      <p className="text-sm text-parchment-400/70">
        Questa operazione richiede qualche decina di secondi. Non chiudere la pagina.
      </p>
    </div>
  );
}

function PlayerList({ room }: { room: Room }) {
  const players = Object.entries(room.players ?? {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  return (
    <ul className="space-y-2">
      {players.map(([uid, p]) => {
        const char = p.characterId ? room.characters?.[p.characterId] : null;
        return (
          <li
            key={uid}
            className="flex items-center gap-3 rounded border border-gold-700/20 bg-ink-850/60 px-4 py-2.5"
          >
            <span
              className={cn("size-2 shrink-0 rounded-full", p.isOnline ? "bg-emerald-400" : "bg-ink-400")}
            />
            <span className="flex-1 truncate text-lg text-parchment-100">
              {p.name}
              {p.isHost && <Crown size={13} className="mb-1 ml-1 inline text-gold-500" />}
            </span>
            <span className="truncate text-base text-parchment-400 italic">
              {char ? `${char.name} — ${char.role}` : "in attesa di un ruolo"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RoomCodeCard({ code, onShowQr }: { code: string; onShowQr: () => void }) {
  return (
    <div className="noir-card flex flex-col items-center gap-3 p-6 text-center">
      <p className="font-display text-xs tracking-[0.3em] text-gold-400 uppercase">Codice Stanza</p>
      <p className="font-display text-5xl tracking-[0.35em] text-gold-300 select-all">{code}</p>
      <button type="button" className="btn btn-gold mt-1" onClick={onShowQr}>
        <QrCode size={16} /> Invita con QR Code
      </button>
    </div>
  );
}

// ── Vista lobby completa (LOBBY | GENERATING | ASSIGNMENT) ──────────────────

export function LobbyView({ room, session }: { room: Room; session: Session }) {
  const status = room.meta.status;
  if (status === "GENERATING") return <GeneratingScreen />;
  if (status === "ASSIGNMENT") return <AssignmentSection room={room} session={session} />;
  return <WaitingSection room={room} session={session} />;
}

function WaitingSection({ room, session }: { room: Room; session: Session }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const isHost = session.isHost;

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      await generateStoryForRoom(session.roomCode, room.settings);
      // lo status passa a GENERATING → la schermata cambia da sola via realtime
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante la generazione.");
      setBusy(false);
    }
  };

  const players = Object.values(room.players ?? {});

  return (
    <div className="animate-fade-up space-y-8">
      <RoomCodeCard code={session.roomCode} onShowQr={() => setQrOpen(true)} />

      {error && <NoticeBanner text={error} />}

      <section>
        <SectionTitle>
          <Users size={13} className="mr-1.5 inline" /> Compagnia dei Sospettati
        </SectionTitle>
        <PlayerList room={room} />
        <p className="mt-3 text-center text-base text-parchment-400 italic">
          {players.length} su {room.settings.playerCount} ospiti — condividi il codice o il QR per
          riunire tutti.
        </p>
      </section>

      <OrnamentDivider />

      <section className="noir-card p-5">
        <p className="font-display text-xs tracking-[0.25em] text-gold-400 uppercase">
          Impostazioni della Serata
        </p>
        <dl className="mt-3 grid gap-2 text-lg sm:grid-cols-2">
          <div>
            <dt className="inline text-parchment-400">Ambientazione: </dt>
            <dd className="inline text-parchment-100">{room.settings.setting}</dd>
          </div>
          <div>
            <dt className="inline text-parchment-400">Tono: </dt>
            <dd className="inline text-parchment-100">{room.settings.tone}</dd>
          </div>
          <div>
            <dt className="inline text-parchment-400">Complessità: </dt>
            <dd className="inline text-parchment-100">{room.settings.complexity}</dd>
          </div>
          <div>
            <dt className="inline text-parchment-400">Colpi di scena: </dt>
            <dd className="inline text-parchment-100">
              {room.settings.allowSuicideOrAccident ? "ammessi" : "esclusi"}
            </dd>
          </div>
        </dl>
      </section>

      {isHost ? (
        <div className="text-center">
          <button type="button" className="btn btn-solid px-8" onClick={handleGenerate} disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Genera il Mistero
          </button>
          <p className="mt-3 text-base text-parchment-400 italic">
            L'AI creerà {room.settings.playerCount} personaggi, 3 atti e indizi intrecciati.
          </p>
        </div>
      ) : (
        <p className="text-center text-xl text-parchment-200 italic">
          In attesa che il Game Master generi il mistero...
        </p>
      )}

      <QRCodeModal open={qrOpen} code={session.roomCode} onClose={() => setQrOpen(false)} />
    </div>
  );
}

// ── Assegnazione personaggi (ASSIGNMENT) ─────────────────────────────────────

function AssignmentSection({ room, session }: { room: Room; session: Session }) {
  const [error, setError] = useState<string | null>(null);
  const isHost = session.isHost;
  const chars = Object.values(room.characters ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  const players = Object.entries(room.players ?? {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const myChar = chars.find((c) => c.assignedToPlayerId === session.playerId) ?? null;

  const safeApply = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di connessione.");
    }
  };

  const claimSelf = (char: Character) =>
    safeApply(() =>
      applyAssignments(session.roomCode, computeAssignUpdates(room, char.id, session.playerId, false)),
    );

  const hostAssign = (char: Character, target: string) =>
    safeApply(() => {
      // target: "" = libero, "npc" = NPC, altrimenti uid del giocatore
      const updates = computeAssignUpdates(
        room,
        char.id,
        target && target !== "npc" ? target : null,
        target === "npc",
      );
      return applyAssignments(session.roomCode, updates);
    });

  return (
    <div className="animate-fade-up space-y-8">
      {error && <NoticeBanner text={error} />}

      <div className="text-center">
        <h2 className="font-display text-2xl tracking-[0.12em] text-gold-300 uppercase">
          Scelta dei Personaggi
        </h2>
        <p className="mt-2 text-lg text-parchment-400 italic">
          {isHost
            ? "Assegna i ruoli a mano, distribuiscili a sorte, o lascia che ciascuno scelga il proprio destino."
            : "Scegli il tuo alter ego: leggi la bio pubblica e reclama il personaggio che ti ispira."}
        </p>
      </div>

      {!isHost && myChar && (
        <div className="noir-card border-gold-500/50 p-5 text-center">
          <p className="font-display text-xs tracking-[0.25em] text-gold-400 uppercase">
            Il tuo personaggio
          </p>
          <p className="mt-1 font-display text-2xl text-parchment-100">{myChar.name}</p>
          <p className="text-lg text-gold-400 italic">{myChar.role}</p>
          <p className="mt-2 text-base text-parchment-400">
            La scheda completa con i segreti sarà rivelata all'inizio della serata.
          </p>
        </div>
      )}

      <section>
        <SectionTitle>Gli Invitati di Questa Notte</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {chars.map((char) => {
            const isMine = char.assignedToPlayerId === session.playerId;
            const taken = !!char.assignedToPlayerId || !!char.assignedPlayerName;
            return (
              <div
                key={char.id}
                className={cn(
                  "noir-card p-4 transition-colors",
                  isMine && "border-gold-500/70 bg-gold-500/5",
                  !isMine && taken && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg text-parchment-100">{char.name}</h3>
                    <p className="text-base text-gold-400 italic">{char.role}</p>
                  </div>
                  {isMine && <span className="chip shrink-0 border-gold-500/60">Tuo</span>}
                </div>
                <p className="mt-2 text-base leading-relaxed text-parchment-300">{char.publicBio}</p>

                {taken && char.assignedPlayerName && !isMine && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-parchment-400">
                    <UserRound size={13} /> Riservato a: {char.assignedPlayerName}
                  </p>
                )}

                {/* Self-Service per i giocatori */}
                {!isHost && !taken && (
                  <button type="button" className="btn btn-gold mt-3 w-full" onClick={() => claimSelf(char)}>
                    Reclama questo ruolo
                  </button>
                )}

                {/* Assegnazione manuale dell'host */}
                {isHost && (
                  <select
                    className="input mt-3 py-2 text-base"
                    value={
                      char.assignedToPlayerId ??
                      (char.assignedPlayerName?.startsWith("NPC") ? "npc" : "")
                    }
                    onChange={(e) => hostAssign(char, e.target.value)}
                    aria-label={`Assegna ${char.name}`}
                  >
                    <option value="" className="bg-ink-900">
                      — Libero —
                    </option>
                    <option value="npc" className="bg-ink-900">
                      NPC (Game Master)
                    </option>
                    {players.map(([uid, p]) => (
                      <option key={uid} value={uid} className="bg-ink-900">
                        {p.name}
                        {p.characterId && p.characterId !== char.id ? " (già assegnato)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {isHost && (
        <div className="noir-card space-y-4 p-5">
          <SectionTitle>Controlli di Assegnazione</SectionTitle>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn btn-gold flex-1"
              onClick={() => safeApply(() => assignRandomCharacters(session.roomCode, room))}
            >
              <Dices size={16} /> Assegnazione Random
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={() => safeApply(() => assignRemainingAsNpc(session.roomCode, room))}
            >
              Restanti come NPC
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold-700/25 pt-4">
            <p className="flex items-center gap-2 text-base text-parchment-400">
              <span
                className={cn("size-2 rounded-full", canStartGame(room) ? "bg-emerald-400" : "bg-blood-500")}
              />
              {canStartGame(room)
                ? "Ogni ospite ha un ruolo: la scena è pronta."
                : `Mancano ancora ruoli a ${
                    players.filter(([, p]) => !p.characterId).length
                  } ospiti.`}
            </p>
            <button
              type="button"
              className="btn btn-solid"
              disabled={!canStartGame(room)}
              onClick={() => safeApply(() => startGame(session.roomCode))}
            >
              Inizia la Serata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
