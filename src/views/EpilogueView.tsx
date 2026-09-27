import { useState } from "react";
import { Crown, Drama, Gavel, Skull } from "lucide-react";
import type { Room } from "../types";
import type { Session } from "../session";
import { closeRoom, completeGame } from "../services/roomService";
import { cn } from "../utils";
import { NoticeBanner, OrnamentDivider } from "../components/ui";

/**
 * Grande Epilogo: rivelazione teatrale a schede progressive.
 * Svela la verità, il colpevole, il verdetto del gruppo e tutti i segreti.
 */
export function EpilogueView({
  room,
  session,
  onLeave,
}: {
  room: Room;
  session: Session;
  onLeave: () => void;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const isHost = session.isHost;
  const completed = room.meta.status === "COMPLETED";

  const story = room.story;
  const chars = Object.values(room.characters ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  const accusations = Object.entries(room.accusations ?? {});
  const culprit = story ? room.characters?.[story.culpritCharacterId] : null;
  const culpritCaught = accusations.some(([, a]) => a.accusedCharacterId === story?.culpritCharacterId);

  if (!story) {
    return <NoticeBanner text="Errore: la storia non è presente nel database." />;
  }

  const sections = [
    // 1 — Vittima
    <div key="victim" className="noir-card space-y-3 p-6">
      <div className="flex items-center gap-2 text-gold-500">
        <Skull size={18} />
        <span className="font-display text-xs tracking-[0.25em] uppercase">La Vittima</span>
      </div>
      <h3 className="font-display text-2xl text-parchment-100">
        {story.victim.name}, {story.victim.age} anni
      </h3>
      <p className="text-lg text-gold-400 italic">{story.victim.occupation}</p>
      <p className="text-lg leading-relaxed text-parchment-200">{story.victim.causeOfDeath}</p>
      {story.victim.isSuicideOrAccident && (
        <p className="text-base text-blood-300 italic">
          Attenzione: il delitto nascondeva un colpo di scena — non era un omicidio come sembrava.
        </p>
      )}
    </div>,

    // 2 — La verità
    <div key="truth" className="noir-card space-y-3 p-6">
      <div className="flex items-center gap-2 text-gold-500">
        <Drama size={18} />
        <span className="font-display text-xs tracking-[0.25em] uppercase">La Verità dei Fatti</span>
      </div>
      <p className="text-xl leading-relaxed text-parchment-100">{story.truth}</p>
    </div>,

    // 3 — Colpevole
    <div key="culprit" className="noir-card border-blood-500/60 bg-blood-600/10 space-y-3 p-6">
      <div className="flex items-center gap-2 text-blood-400">
        <Crown size={18} />
        <span className="font-display text-xs tracking-[0.25em] uppercase">L'Assassino</span>
      </div>
      {culprit && (
        <>
          <h3 className="font-display text-3xl text-blood-300">{culprit.name}</h3>
          <p className="text-lg text-gold-400 italic">{culprit.role}</p>
          <p className="text-lg leading-relaxed text-parchment-200">{culprit.relationshipWithVictim}</p>
          <p className="text-base text-parchment-300 italic">
            Interpretato da: {culprit.assignedPlayerName ?? "NPC"}
          </p>
        </>
      )}
    </div>,

    // 4 — Verdetto
    <div key="verdict" className="noir-card space-y-3 p-6 text-center">
      <p className="font-display text-xs tracking-[0.25em] text-gold-400 uppercase">Il Verdetto</p>
      <p
        className={cn(
          "font-display text-2xl leading-snug",
          culpritCaught ? "text-gold-300" : "text-blood-300",
        )}
      >
        {culpritCaught
          ? "Giustizia fatta: la compagnia ha individuato il colpevole!"
          : "Il colpevole ha fatto franca: la verità è morta con la vittima..."}
      </p>
    </div>,

    // 5 — Riepilogo accuse
    <div key="votes" className="noir-card space-y-4 p-6">
      <div className="flex items-center gap-2 text-gold-500">
        <Gavel size={18} />
        <span className="font-display text-xs tracking-[0.25em] uppercase">Le Accuse del Gruppo</span>
      </div>
      {accusations.length === 0 ? (
        <p className="text-lg text-parchment-400 italic">Nessuna accusa è stata espressa.</p>
      ) : (
        <ul className="space-y-2">
          {accusations.map(([uid, a]) => {
            const accusedChar = room.characters?.[a.accusedCharacterId];
            const correct = a.accusedCharacterId === story.culpritCharacterId;
            return (
              <li
                key={uid}
                className="flex flex-wrap items-baseline gap-2 rounded border border-gold-700/20 bg-ink-850/60 px-4 py-2.5"
              >
                <span className="text-lg text-parchment-100">
                  {room.players?.[uid]?.name ?? "Ospite"}
                </span>
                <span className="text-parchment-400">ha accusato</span>
                <span className="text-lg text-gold-300">{accusedChar?.name ?? "?"}</span>
                {a.motive && <span className="w-full text-base text-parchment-400 italic">“{a.motive}”</span>}
                <span
                  className={cn(
                    "ml-auto font-display text-sm tracking-widest uppercase",
                    correct ? "text-emerald-300" : "text-blood-300",
                  )}
                >
                  {correct ? "✓ Colto nel segno" : "✗ Bersaglio errato"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>,

    // 6 — Tutti i segreti
    <div key="secrets" className="noir-card space-y-5 p-6">
      <p className="font-display text-xs tracking-[0.25em] text-gold-400 uppercase">
        Tutti i Segreti, Svelati
      </p>
      {chars.map((c) => (
        <div key={c.id} className="border-b border-gold-700/20 pb-4 last:border-0 last:pb-0">
          <p className="text-lg text-parchment-100">
            {c.name} <span className="text-base text-gold-400 italic">— {c.role}</span>
          </p>
          <p className="text-base text-parchment-400">
            Alibi: <span className="italic">{c.alibi}</span>
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {c.secrets.map((s, i) => (
              <li key={i} className="text-base leading-relaxed text-parchment-300">
                {s}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>,
  ];

  const visible = completed ? sections.length : step;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-[0.12em] text-gold-300 uppercase">
          L'Epilogo
        </h2>
        <p className="mt-2 text-lg text-parchment-400 italic">
          Le candele si consumano: è tempo di svelare ogni carta.
        </p>
      </div>

      {error && <NoticeBanner text={error} />}

      {sections.slice(0, visible).map((section, i) => (
        <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
          {section}
        </div>
      ))}

      {!completed && step < sections.length && (
        <div className="text-center">
          <button type="button" className="btn btn-gold px-8" onClick={() => setStep((s) => s + 1)}>
            Continua la narrazione
          </button>
        </div>
      )}

      {step >= sections.length && (
        <>
          <OrnamentDivider />
          <div className="flex flex-col gap-3 sm:flex-row">
            {isHost && !completed && (
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={() =>
                  completeGame(session.roomCode).catch(() =>
                    setError("Errore di connessione: riprova."),
                  )
                }
              >
                Termina la sessione
              </button>
            )}
            {isHost && (
              <button
                type="button"
                className="btn btn-blood flex-1"
                onClick={() =>
                  closeRoom(session.roomCode)
                    .then(onLeave)
                    .catch(() => setError("Errore di connessione: riprova."))
                }
              >
                Sciogli la compagnia (chiudi la stanza)
              </button>
            )}
            <button type="button" className="btn btn-gold flex-1" onClick={onLeave}>
              Torna alla soglia di casa
            </button>
          </div>
          {completed && (
            <p className="text-center text-base text-parchment-400 italic">
              Sessione conclusa: la stanza può essere chiusa definitivamente.
            </p>
          )}
        </>
      )}
    </div>
  );
}
