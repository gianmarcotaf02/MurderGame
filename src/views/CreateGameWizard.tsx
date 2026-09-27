import { useState } from "react";
import { LoaderCircle, Minus, Plus, Sparkles } from "lucide-react";
import { createRoom } from "../services/roomService";
import type { RoomSettings } from "../types";
import { NoticeBanner } from "../components/ui";
import { cn } from "../utils";

const SETTING_PRESETS = [
  "Orient Express, 1934",
  "Villa sul Lago di Como, anni '20",
  "Base lunare Selene, 2088",
  "Convento medievale isolato",
  "Maniero scozzese durante una tempesta",
  "Teatro dell'opera, prima della prima",
];

const TONES = ["Giallo deduttivo", "Noir", "Gotico", "Commedia degli equivoci"];
const COMPLEXITIES = ["Facile", "Media", "Difficile"];

export function CreateGameWizard({
  uid,
  onCreated,
  onCancel,
}: {
  uid: string;
  onCreated: (code: string, hostName: string) => void;
  onCancel: () => void;
}) {
  const [hostName, setHostName] = useState("");
  const [title, setTitle] = useState("");
  const [setting, setSetting] = useState(SETTING_PRESETS[1]);
  const [tone, setTone] = useState(TONES[0]);
  const [complexity, setComplexity] = useState("Media");
  const [playerCount, setPlayerCount] = useState(6);
  const [participantNames, setParticipantNames] = useState<string[]>(Array(6).fill(""));
  const [allowSuicideOrAccident, setAllowSuicideOrAccident] = useState(true);
  const [externalNarrator, setExternalNarrator] = useState(true);
  const [customNotes, setCustomNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCount = (n: number) => {
    setPlayerCount(n);
    setParticipantNames((prev) => {
      const next = [...prev];
      while (next.length < n) next.push("");
      return next.slice(0, n);
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!setting.trim()) return setError("Scegli o digita un'ambientazione.");
    setBusy(true);
    try {
      const settings: RoomSettings = {
        title: title.trim(),
        setting: setting.trim(),
        tone,
        allowSuicideOrAccident,
        complexity,
        playerCount,
        customNotes: customNotes.trim(),
        participantNames: participantNames.map((n) => n.trim()).filter(Boolean),
        externalNarrator,
      };
      const code = await createRoom(settings, uid, hostName.trim());
      onCreated(code, hostName.trim() || "Game Master");
    } catch {
      setError("Errore di connessione a Firebase. Verifica la configurazione e riprova.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8 text-center">
        <Sparkles className="mx-auto mb-3 text-gold-500" size={30} />
        <h1 className="font-display text-3xl tracking-[0.12em] text-gold-300 uppercase">
          Crea la Serata
        </h1>
        <p className="mt-2 text-lg text-parchment-400 italic">
          Configura i parametri: l'AI tesserà la trama attorno ai tuoi vincoli.
        </p>
      </div>

      {error && <NoticeBanner text={error} />}

      <div className="noir-card mt-6 space-y-6 p-6">
        <div>
          <label className="label" htmlFor="host-name">
            Il tuo nome (Game Master)
          </label>
          <input
            id="host-name"
            className="input"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="Es. Marco"
            maxLength={24}
          />
        </div>

        <div>
          <label className="label" htmlFor="game-title">
            Titolo della serata (opzionale)
          </label>
          <input
            id="game-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Morte alla Tenuta Blackwood"
            maxLength={60}
          />
        </div>

        <div>
          <label className="label">Ambientazione</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {SETTING_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSetting(preset)}
                className={cn(
                  "chip cursor-pointer transition-colors",
                  setting === preset
                    ? "border-gold-500 bg-gold-500/15 text-gold-300"
                    : "hover:border-gold-500/50",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            className="input"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="Oppure scrivi la tua ambientazione..."
            maxLength={120}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tone">
              Tono narrativo
            </label>
            <select id="tone" className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t} className="bg-ink-900">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="complexity">
              Complessità del mistero
            </label>
            <select
              id="complexity"
              className="input"
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
            >
              {COMPLEXITIES.map((c) => (
                <option key={c} value={c} className="bg-ink-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Numero di partecipanti</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="btn btn-gold px-4"
              onClick={() => setCount(Math.max(3, playerCount - 1))}
              disabled={playerCount <= 3}
              aria-label="Riduci partecipanti"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-16 text-center font-display text-3xl text-gold-300">
              {playerCount}
            </span>
            <button
              type="button"
              className="btn btn-gold px-4"
              onClick={() => setCount(Math.min(15, playerCount + 1))}
              disabled={playerCount >= 15}
              aria-label="Aumenta partecipanti"
            >
              <Plus size={16} />
            </button>
            <span className="text-base text-parchment-400 italic">da 3 a 15 ospiti</span>
          </div>
        </div>

        <div>
          <label className="label">Nomi dei partecipanti (opzionale, consigliato)</label>
          <p className="mb-3 text-base text-parchment-400 italic">
            Inserendo i nomi, l'AI creerà una scheda su misura per ciascuno e basterà selezionare
            il proprio nome al momento dell'ingresso per riceverla. Lascia vuoto per l'assegnazione libera.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {participantNames.map((value, i) => (
              <input
                key={i}
                className="input py-2"
                value={value}
                onChange={(e) =>
                  setParticipantNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                }
                placeholder={`Partecipante ${i + 1}`}
                maxLength={24}
                autoComplete="off"
              />
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={externalNarrator}
            onChange={(e) => setExternalNarrator(e.target.checked)}
            className="mt-1.5 size-4 accent-blood-500"
          />
          <span className="text-lg text-parchment-200">
            Con narratore esterno (Game Master)
            <span className="block text-base text-parchment-400 italic">
              Il GM introduce le fasi e legge i reperti a voce, senza interpretare un personaggio.
              Deseleziona se tutti vogliono giocare un personaggio.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={allowSuicideOrAccident}
            onChange={(e) => setAllowSuicideOrAccident(e.target.checked)}
            className="mt-1.5 size-4 accent-blood-500"
          />
          <span className="text-lg text-parchment-200">
            Ammetti colpi di scena
            <span className="block text-base text-parchment-400 italic">
              L'AI potrà strutturare un suicidio simulato o un incidente insabbiato.
            </span>
          </span>
        </label>

        <div>
          <label className="label" htmlFor="custom-notes">
            Vincoli e desiderata (opzionale)
          </label>
          <textarea
            id="custom-notes"
            className="input resize-y"
            rows={3}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder={'Es. "Marco interpreta un banchiere corrotto; Chiara e Simone devono essere acerrimi rivali."'}
            maxLength={500}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel} disabled={busy}>
          Annulla
        </button>
        <button
          type="button"
          className="btn btn-solid flex-1"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? <LoaderCircle className="animate-spin" size={16} /> : null}
          {busy ? "Preparo la scena..." : "Crea la Stanza"}
        </button>
      </div>
    </div>
  );
}
