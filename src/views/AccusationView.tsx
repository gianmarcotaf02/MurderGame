import { useState, type FormEvent } from "react";
import { Gavel, Hourglass, LoaderCircle } from "lucide-react";
import type { Room } from "../types";
import type { Session } from "../session";
import { submitAccusation } from "../services/roomService";
import { cn } from "../utils";
import { NoticeBanner, OrnamentDivider, SectionTitle } from "../components/ui";

export function AccusationView({ room, session }: { room: Room; session: Session }) {
  const [accused, setAccused] = useState("");
  const [motive, setMotive] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chars = Object.values(room.characters ?? {}).sort((a, b) => a.id.localeCompare(b.id));
  const accusations = room.accusations ?? {};
  const myAccusation = accusations[session.playerId];
  const isHost = session.isHost;
  const totalPlayers = Object.keys(room.players ?? {}).length;
  const votesCast = Object.keys(accusations).length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accused) return setError("Seleziona il sospettato da accusare.");
    setBusy(true);
    setError(null);
    try {
      await submitAccusation(session.roomCode, session.playerId, accused, motive);
    } catch {
      setError("Errore di connessione: riprova.");
    } finally {
      setBusy(false);
    }
  };

  // ── Griglia riepilogo voti (host) ──
  const tally = chars
    .map((c) => {
      const voters = Object.entries(accusations)
        .filter(([, a]) => a.accusedCharacterId === c.id)
        .map(([uid]) => room.players?.[uid]?.name ?? "Ospite");
      return { char: c, voters };
    })
    .sort((a, b) => b.voters.length - a.voters.length);
  const maxVotes = Math.max(1, ...tally.map((t) => t.voters.length));

  return (
    <div className="animate-fade-up space-y-8">
      <div className="text-center">
        <Gavel className="mx-auto mb-3 text-blood-400" size={34} />
        <h2 className="font-display text-2xl tracking-[0.12em] text-gold-300 uppercase">
          La Fase d'Accusa
        </h2>
        <p className="mt-2 text-lg text-parchment-400 italic">
          {isHost
            ? "La compagnia sta sciogliendo gli ultimi nodi. Raccogli le accuse, poi rivela la verità."
            : "Il momento supremo: accusa un sospettato e motiva la tua scelta davanti alla corte."}
        </p>
      </div>

      {error && <NoticeBanner text={error} />}

      {/* Form d'accusa del giocatore (e del GM se vuole accusare) */}
      {!myAccusation && (
        <form onSubmit={handleSubmit} className="noir-card space-y-5 p-5">
          <SectionTitle>Il tuo verdetto</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {chars.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAccused(c.id)}
                className={cn(
                  "cursor-pointer rounded border p-3 text-left transition-all",
                  accused === c.id
                    ? "border-blood-500 bg-blood-600/15"
                    : "border-gold-700/25 bg-ink-850/60 hover:border-gold-500/50",
                )}
              >
                <span className="block font-display text-base text-parchment-100">{c.name}</span>
                <span className="block text-sm text-gold-400 italic">{c.role}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="motive">
              Motivazione dell'accusa
            </label>
            <textarea
              id="motive"
              className="input resize-y"
              rows={3}
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              placeholder="Es. La sua finestra era accesa a quell'ora impossibile..."
              maxLength={300}
            />
          </div>
          <button type="submit" className="btn btn-blood w-full" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Gavel size={16} />}
            Sigilla la Tua Accusa
          </button>
        </form>
      )}

      {/* Attesa dopo il voto */}
      {myAccusation && !isHost && (
        <div className="noir-card p-6 text-center">
          <Hourglass className="animate-pulse-soft mx-auto mb-3 text-gold-500" size={28} />
          <p className="font-display text-lg tracking-[0.14em] text-gold-300 uppercase">
            Il tuo verdetto è sigillato
          </p>
          <p className="mt-2 text-lg text-parchment-300">
            Hai accusato{" "}
            <span className="text-blood-300">
              {room.characters?.[myAccusation.accusedCharacterId]?.name ?? "un fantasma"}
            </span>
            .
          </p>
          <OrnamentDivider />
          <p className="mt-3 text-base text-parchment-400 italic">
            Voti raccolti: {votesCast} su {totalPlayers} — attendi la rivelazione finale.
          </p>
        </div>
      )}

      {/* Riepilogo voti in tempo reale per l'host */}
      {isHost && (
        <section className="noir-card p-5">
          <SectionTitle>Riepilogo delle Accuse ({votesCast}/{totalPlayers})</SectionTitle>
          <div className="space-y-3">
            {tally.map(({ char, voters }) => (
              <div key={char.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <p className="text-lg text-parchment-100">
                    {char.name} <span className="text-sm text-gold-400 italic">{char.role}</span>
                  </p>
                  <p
                    className={cn(
                      "font-display text-lg",
                      voters.length > 0 ? "text-blood-300" : "text-parchment-400",
                    )}
                  >
                    {voters.length}
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-ink-700">
                  <div
                    className="h-full rounded bg-gradient-to-r from-blood-700 to-blood-500 transition-all duration-500"
                    style={{ width: `${(voters.length / maxVotes) * 100}%` }}
                  />
                </div>
                {voters.length > 0 && (
                  <p className="mt-1 text-sm text-parchment-400 italic">{voters.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
