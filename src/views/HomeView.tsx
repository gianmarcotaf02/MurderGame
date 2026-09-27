import { useState, type FormEvent } from "react";
import { Crown, LoaderCircle, Skull, Users } from "lucide-react";
import { joinRoom } from "../services/roomService";
import { NoticeBanner, OrnamentDivider } from "../components/ui";
import { CreateGameWizard } from "./CreateGameWizard";

export function HomeView({
  uid,
  notice,
  onHost,
  onJoin,
}: {
  uid: string;
  notice: string | null;
  onHost: (code: string, name: string) => void;
  onJoin: (code: string, name: string) => void;
}) {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanName) return setError("Inserisci il tuo nome per la serata.");
    if (cleanCode.length !== 6) return setError("Il codice stanza è di 6 caratteri.");
    setBusy(true);
    try {
      const result = await joinRoom(cleanCode, uid, cleanName);
      if (!result.ok) setError(result.error);
      else onJoin(cleanCode, cleanName);
    } catch {
      setError("Errore di connessione a Firebase. Riprova.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "create") {
    return <CreateGameWizard uid={uid} onCreated={(c, n) => onHost(c, n)} onCancel={() => setMode("menu")} />;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Titolo */}
        <div className="animate-fade-up text-center">
          <Skull className="animate-flicker mx-auto mb-5 text-blood-500" size={56} strokeWidth={1.4} />
          <h1 className="font-display text-4xl leading-tight tracking-[0.12em] text-gold-300 uppercase sm:text-5xl">
            Cena con
            <br />
            Delitto
          </h1>
          <p className="mt-3 text-lg text-parchment-400 italic">
            Un murder mystery party da vivere dal vivo, con trame tessute dall'AI.
          </p>
        </div>

        <OrnamentDivider />

        {notice && <NoticeBanner text={notice} tone="gold" />}
        {error && <NoticeBanner text={error} />}

        {mode === "menu" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="noir-card group flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-all hover:border-gold-500/60 hover:bg-ink-800"
            >
              <span className="rounded border border-gold-700/40 bg-gold-500/10 p-3 text-gold-400">
                <Crown size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-base tracking-[0.14em] text-gold-300 uppercase">
                  Crea una Partita
                </span>
                <span className="block text-base text-parchment-400">
                  Sei il Game Master: configura e dirige la serata.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("join")}
              className="noir-card group flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-all hover:border-gold-500/60 hover:bg-ink-800"
            >
              <span className="rounded border border-gold-700/40 bg-gold-500/10 p-3 text-gold-400">
                <Users size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-base tracking-[0.14em] text-gold-300 uppercase">
                  Unisciti a una Partita
                </span>
                <span className="block text-base text-parchment-400">
                  Hai un codice stanza? Entra e scopri il tuo destino.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="noir-card animate-fade-up space-y-5 p-6">
            <div>
              <label className="label" htmlFor="player-name">
                Il tuo nome
              </label>
              <input
                id="player-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Giulia"
                maxLength={24}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="room-code">
                Codice stanza
              </label>
              <input
                id="room-code"
                className="input text-center font-display text-2xl tracking-[0.4em] uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="XK92D1"
                autoComplete="off"
                inputMode="text"
              />
            </div>
            <button type="submit" disabled={busy} className="btn btn-gold w-full">
              {busy ? <LoaderCircle className="animate-spin" size={16} /> : null}
              {busy ? "Valico le porte..." : "Entra nella Stanza"}
            </button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setMode("menu")}>
              Torna indietro
            </button>
          </form>
        )}

        <p className="text-center text-sm text-parchment-400/60 italic">
          Ogni serata è un delitto diverso. Nessuna scusa è troppo meschina.
        </p>
      </div>
    </div>
  );
}
