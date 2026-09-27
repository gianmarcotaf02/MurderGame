import { useEffect, useRef, useState } from "react";
import { BookOpen, Lock, NotebookPen, ScrollText, Sparkles } from "lucide-react";
import type { Room } from "../types";
import type { Session } from "../session";
import { ACT_LABELS, cn } from "../utils";
import { BlurReveal, Modal, NoticeBanner, OrnamentDivider, SectionTitle } from "../components/ui";
import { CharacterSheet } from "../components/CharacterSheet";
import { Notebook } from "../components/Notebook";

type Tab = "scheda" | "indizi" | "taccuino";

export function PlayerDashboard({ room, session }: { room: Room; session: Session }) {
  const myChar =
    Object.values(room.characters ?? {}).find((c) => c.assignedToPlayerId === session.playerId) ??
    null;

  const [tab, setTab] = useState<Tab>("scheda");

  // ── Notifica nuovo round: vibrazione + modale con l'indizio sbloccato ──
  const prevRound = useRef<number | null>(null);
  const [popupRound, setPopupRound] = useState<number | null>(null);

  useEffect(() => {
    const cr = room.meta.currentRound;
    if (room.meta.status !== "IN_GAME") {
      prevRound.current = cr;
      return;
    }
    if (prevRound.current !== null && cr > prevRound.current) {
      if ("vibrate" in navigator) navigator.vibrate([180, 90, 180]);
      setPopupRound(cr);
    }
    prevRound.current = cr;
  }, [room.meta.currentRound, room.meta.status]);

  if (!myChar) {
    return (
      <div className="py-16 text-center">
        <NoticeBanner
          tone="gold"
          text="Non hai ancora un personaggio assegnato. Chiedi al Game Master di assegnarti un ruolo o un NPC."
        />
      </div>
    );
  }

  const rounds = room.rounds ?? {};
  const currentRound = room.meta.currentRound;
  const popup = popupRound ? rounds[String(popupRound)] : null;

  return (
    <div className="animate-fade-up">
      {/* Contenuto della tab */}
      {tab === "scheda" && (
        <div className="space-y-6">
          <SectionTitle>La Mia Scheda</SectionTitle>
          <CharacterSheet char={myChar} />
        </div>
      )}

      {tab === "indizi" && (
        <div className="space-y-6">
          <SectionTitle>
            <ScrollText size={13} className="mr-1.5 inline" /> Indizi Ricevuti
          </SectionTitle>

          {/* Prologo e vittima: sempre visibili */}
          {room.story && (
            <div className="noir-card space-y-4 p-5">
              <p className="font-display text-xs tracking-[0.25em] text-gold-400 uppercase">
                Il Caso
              </p>
              <p className="text-lg leading-relaxed text-parchment-200">{room.story.prologue}</p>
              <OrnamentDivider />
              <div>
                <p className="font-display text-lg text-parchment-100">
                  {room.story.victim.name}, {room.story.victim.age} anni
                </p>
                <p className="text-base text-gold-400 italic">{room.story.victim.occupation}</p>
                <p className="mt-1 text-base leading-relaxed text-parchment-300">
                  {room.story.victim.causeOfDeath}
                </p>
              </div>
            </div>
          )}

          {/* Round pubblicati finora */}
          {Array.from({ length: room.meta.totalRounds }, (_, i) => i + 1).map((n) => {
            const round = rounds[String(n)];
            const unlocked = !!round && n <= currentRound;
            if (!round) return null;
            const privateClue = round.privateClues?.[myChar.id];
            return (
              <div
                key={n}
                className={cn(
                  "noir-card space-y-4 p-5",
                  !unlocked && "opacity-60",
                  n === currentRound && "border-gold-500/50",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-gold-300">{round.title}</h3>
                  {!unlocked && (
                    <span className="chip shrink-0">
                      <Lock size={11} /> Da svelare
                    </span>
                  )}
                  {unlocked && n === currentRound && (
                    <span className="chip shrink-0 border-gold-500/60">
                      <Sparkles size={11} /> In scena
                    </span>
                  )}
                </div>

                {unlocked ? (
                  <>
                    <div>
                      <p className="mb-1 font-display text-[11px] tracking-[0.22em] text-gold-500 uppercase">
                        Indizio pubblico
                      </p>
                      <p className="text-lg leading-relaxed text-parchment-200">{round.globalClue}</p>
                    </div>
                    {privateClue && (
                      <div className="border-t border-gold-700/25 pt-4">
                        <p className="mb-1 font-display text-[11px] tracking-[0.22em] text-blood-400 uppercase">
                          Il tuo indizio privato
                        </p>
                        <BlurReveal text={privateClue} className="text-lg leading-relaxed text-parchment-200" />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-base text-parchment-400 italic">
                    Questo atto non è ancora stato messo in scena dal Game Master.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "taccuino" && <Notebook />}

      {/* Navigazione a tab persistente (mobile-first) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-700/25 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-3">
          {(
            [
              ["scheda", "La Mia Scheda", BookOpen],
              ["indizi", "Indizi", ScrollText],
              ["taccuino", "Taccuino", NotebookPen],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 py-3 font-display text-[10px] tracking-[0.18em] uppercase transition-colors",
                tab === key ? "text-gold-300" : "text-parchment-400 hover:text-parchment-200",
              )}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Modale di avanzamento round */}
      <Modal
        open={!!popup}
        onClose={() => setPopupRound(null)}
        title={popup ? popup.title : ""}
      >
        {popup && (
          <div className="space-y-4">
            <p className="font-display text-xs tracking-[0.22em] text-gold-400 uppercase">
              È stato messo in scena
            </p>
            <p className="text-lg leading-relaxed text-parchment-200">{popup.globalClue}</p>
            {popup.privateClues?.[myChar.id] && (
              <>
                <OrnamentDivider />
                <p className="font-display text-xs tracking-[0.22em] text-blood-400 uppercase">
                  Il tuo indizio privato
                </p>
                <BlurReveal
                  text={popup.privateClues[myChar.id]}
                  className="text-lg leading-relaxed text-parchment-200"
                />
              </>
            )}
            <button type="button" className="btn btn-gold w-full" onClick={() => setPopupRound(null)}>
              {ACT_LABELS[Math.min(popupRound ?? 1, 5)]} — che la recitazione abbia inizio
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
