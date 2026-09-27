import { useState } from "react";
import { ArrowRight, Eye, Gavel, UserRound, Users } from "lucide-react";
import type { Room } from "../types";
import type { Session } from "../session";
import { advanceRound, openAccusation } from "../services/roomService";
import { ACT_LABELS, cn } from "../utils";
import { BlurReveal, ConfirmModal, NoticeBanner, OrnamentDivider, SectionTitle } from "../components/ui";
import { CharacterSheet } from "../components/CharacterSheet";

export function HostConsole({ room, session }: { room: Room; session: Session }) {
  const [error, setError] = useState<string | null>(null);
  const [confirmRound, setConfirmRound] = useState(false);
  const [confirmAccusation, setConfirmAccusation] = useState(false);

  const chars = Object.values(room.characters ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  const players = Object.entries(room.players ?? {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  const currentRound = room.meta.currentRound;
  const round = room.rounds?.[String(currentRound)];
  const hostChar = chars.find((c) => c.assignedToPlayerId === session.playerId) ?? null;
  const isLastRound = currentRound >= room.meta.totalRounds;

  const doAction = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di connessione.");
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      {error && <NoticeBanner text={error} />}

      {/* Controlli di regia */}
      <section className="noir-card space-y-4 p-5">
        <SectionTitle>Controlli di Regia</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn btn-gold flex-1"
            disabled={isLastRound}
            onClick={() => setConfirmRound(true)}
          >
            <ArrowRight size={16} />
            {isLastRound ? "Ultimo atto concluso" : "Avanza al Prossimo Round"}
          </button>
          <button
            type="button"
            className="btn btn-blood flex-1"
            onClick={() => setConfirmAccusation(true)}
          >
            <Gavel size={16} /> Apri la Fase d'Accusa
          </button>
        </div>
        {isLastRound && (
          <p className="text-center text-base text-parchment-400 italic">
            Il terzo atto è in scena: quando la discussione sarà matura, apri l'accusa.
          </p>
        )}
      </section>

      {/* Round corrente: indizi pubblici e privati (visibili solo al GM) */}
      {round && (
        <section className="noir-card space-y-4 p-5">
          <SectionTitle>{round.title}</SectionTitle>
          <div>
            <p className="mb-1 font-display text-[11px] tracking-[0.22em] text-gold-500 uppercase">
              Indizio pubblico (in scena)
            </p>
            <p className="text-lg leading-relaxed text-parchment-200">{round.globalClue}</p>
          </div>
          <OrnamentDivider />
          <div>
            <p className="mb-2 font-display text-[11px] tracking-[0.22em] text-blood-400 uppercase">
              Indizi privati di questo atto
            </p>
            <ul className="space-y-3">
              {chars.map((c) => {
                const clue = round.privateClues?.[c.id];
                if (!clue) return null;
                return (
                  <li key={c.id} className="border-b border-gold-700/15 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-gold-400">
                      {c.name} <span className="text-parchment-400 italic">({c.role})</span>
                    </p>
                    <BlurReveal text={clue} className="text-base leading-relaxed text-parchment-300" />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Stato della verità: riservato al Game Master */}
      {room.story && (
        <section className="noir-card border-blood-600/40 p-5">
          <SectionTitle>
            <Eye size={13} className="mr-1.5 inline" /> Stato della Verità
          </SectionTitle>
          <p className="mb-4 text-base text-parchment-400 italic">
            Guardala solo se gli ospiti si bloccano: la verità va custodita fino all'epilogo.
          </p>
          <BlurReveal text={room.story.truth} className="text-lg leading-relaxed text-parchment-200" />
          <OrnamentDivider />
          <p className="mt-4 text-base text-parchment-400">
            Colpevole:{" "}
            <span className="text-blood-300">
              {room.characters?.[room.story.culpritCharacterId]?.name ?? "?"} —{" "}
              {room.characters?.[room.story.culpritCharacterId]?.role ?? ""}
            </span>
          </p>
        </section>
      )}

      {/* Panoramica compagnia */}
      <section>
        <SectionTitle>
          <Users size={13} className="mr-1.5 inline" /> La Compagnia
        </SectionTitle>
        <ul className="space-y-2">
          {players.map(([uid, p]) => {
            const char = p.characterId ? room.characters?.[p.characterId] : null;
            return (
              <li
                key={uid}
                className="flex items-center gap-3 rounded border border-gold-700/20 bg-ink-850/60 px-4 py-2.5"
              >
                <span
                  title={p.isOnline ? "Online" : "Offline"}
                  className={cn("size-2 shrink-0 rounded-full", p.isOnline ? "bg-emerald-400" : "bg-ink-400")}
                />
                <span className="flex-1 truncate text-lg text-parchment-100">{p.name}</span>
                <span className="truncate text-base text-parchment-400 italic">
                  {char ? `${char.name} — ${char.role}` : "senza ruolo"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* La scheda del GM, se ha reclamato un personaggio */}
      {hostChar && (
        <section>
          <SectionTitle>
            <UserRound size={13} className="mr-1.5 inline" /> La Tua Scheda ({hostChar.name})
          </SectionTitle>
          <CharacterSheet
            char={hostChar}
            victimPersonality={room.story?.victim.personality}
          />
        </section>
      )}

      <ConfirmModal
        open={confirmRound}
        title="Avanzare di Atto"
        message={
          isLastRound
            ? "Sei già nell'ultimo atto."
            : `Mettere in scena l'atto successivo? Tutti i giocatori riceveranno una notifica con il nuovo indizio (${
                ACT_LABELS[Math.min(currentRound + 1, 5)] ?? `Atto ${currentRound + 1}`
              }).`
        }
        confirmLabel="Avanza"
        onConfirm={() => {
          setConfirmRound(false);
          void doAction(() => advanceRound(session.roomCode, currentRound + 1));
        }}
        onCancel={() => setConfirmRound(false)}
      />

      <ConfirmModal
        open={confirmAccusation}
        title="Aprire la Fase d'Accusa"
        message="Tutti i giocatori saranno chiamati ad accusare un sospettato e a motivare l'accusa. La fase d'indizi terminerà."
        confirmLabel="Apri l'Accusa"
        danger
        onConfirm={() => {
          setConfirmAccusation(false);
          void doAction(() => openAccusation(session.roomCode));
        }}
        onCancel={() => setConfirmAccusation(false)}
      />
    </div>
  );
}
