import { AlertTriangle, Eye, HelpCircle, ShieldQuestion, UserRound } from "lucide-react";
import type { Character } from "../types";
import { BlurReveal } from "./ui";

/**
 * Scheda personaggio "zero sbatti": puramente funzionale, mezza pagina.
 * Versione pubblica, movente potenziale, segreto inconfessabile,
 * osservazioni sugli altri e domande a bruciapelo.
 */
export function CharacterSheet({
  char,
  victimPersonality,
}: {
  char: Character;
  victimPersonality?: string;
}) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <UserRound size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">Identità</span>
        </div>
        <h3 className="font-display text-2xl text-parchment-100">{char.name}</h3>
        <p className="mb-4 text-lg text-gold-400 italic">{char.role}</p>
        <p className="text-lg leading-relaxed text-parchment-200">{char.publicBio}</p>
      </div>

      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <HelpCircle size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">
            Versione Pubblica — le ultime 2 ore
          </span>
        </div>
        <p className="text-lg leading-relaxed text-parchment-200">{char.alibi}</p>
        <p className="mt-2 text-base text-parchment-400 italic">
          Questa è la versione che dichiari a tutti: reggici finché puoi.
        </p>
      </div>

      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <UserRound size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">
            Il Morto, e il Vostro Rapporto
          </span>
        </div>
        {victimPersonality && (
          <p className="mb-3 text-lg leading-relaxed text-parchment-200">
            <span className="font-display text-sm tracking-[0.18em] text-gold-400 uppercase">
              Come era:{" "}
            </span>
            {victimPersonality}
          </p>
        )}
        <p className="text-lg leading-relaxed text-parchment-200">
          <span className="font-display text-sm tracking-[0.18em] text-gold-400 uppercase">
            Il vostro rapporto e il tuo movente:{" "}
          </span>
          {char.relationshipWithVictim}
        </p>
        <p className="mt-2 text-base text-parchment-400 italic">
          È il motivo per cui la vittima ti danneggiava: se salta fuori, sarai sospettato.
        </p>
      </div>

      <div className="noir-card border-blood-600/40 p-5">
        <div className="mb-3 flex items-center gap-2 text-blood-400">
          <AlertTriangle size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">
            Il Tuo Segreto Inconfessabile
          </span>
        </div>
        <ul className="space-y-4">
          {char.secrets.map((secret, i) => (
            <li key={i} className="border-b border-blood-600/20 pb-4 last:border-0 last:pb-0">
              <BlurReveal text={secret} className="text-lg leading-relaxed text-parchment-200" />
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 border-t border-blood-600/25 pt-3 text-sm text-blood-300/90 italic">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Non c'entra con l'omicidio: è il motivo per cui sei agitato. Non finire nei guai per
          colpa sua — rivela solo se messo alle strette.
        </p>
      </div>

      {char.answers.length > 0 && (
        <div className="noir-card p-5">
          <div className="mb-3 flex items-center gap-2 text-gold-500">
            <ShieldQuestion size={18} />
            <span className="font-display text-xs tracking-[0.25em] uppercase">
              Le Tue Risposte Pronte
            </span>
          </div>
          <ul className="space-y-3">
            {char.answers.map((a, i) => (
              <li key={i} className="text-lg leading-relaxed text-parchment-200">
                <BlurReveal text={a} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base text-parchment-400 italic">
            Se gli altri ti lanciano le loro domande a bruciapelo, ecco come reggere il colpo.
          </p>
        </div>
      )}

      {char.observations.length > 0 && (
        <div className="noir-card p-5">
          <div className="mb-3 flex items-center gap-2 text-gold-500">
            <Eye size={18} />
            <span className="font-display text-xs tracking-[0.25em] uppercase">
              Cosa Sai su un Altro Giocatore
            </span>
          </div>
          <ul className="space-y-3">
            {char.observations.map((obs, i) => (
              <li key={i} className="text-lg leading-relaxed text-parchment-200">
                <BlurReveal text={obs} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base text-parchment-400 italic">
            Usa questa informazione al momento giusto: è merce rara.
          </p>
        </div>
      )}

      {char.questions.length > 0 && (
        <div className="noir-card p-5">
          <div className="mb-3 flex items-center gap-2 text-gold-500">
            <HelpCircle size={18} />
            <span className="font-display text-xs tracking-[0.25em] uppercase">
              Le Tue Domande a Bruciapelo
            </span>
          </div>
          <ol className="list-decimal space-y-3 pl-5">
            {char.questions.map((q, i) => (
              <li key={i} className="text-lg leading-relaxed text-parchment-200">
                {q}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-base text-parchment-400 italic">
            Falle durante la discussione, senza pietà: le risposte (o le esitazioni) sono indizi.
          </p>
        </div>
      )}
    </div>
  );
}
