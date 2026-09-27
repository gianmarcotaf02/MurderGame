import { AlertTriangle, Fingerprint, HelpCircle, UserRound } from "lucide-react";
import type { Character } from "../types";
import { BlurReveal } from "./ui";

/**
 * Scheda segreta completa di un personaggio: identità, rapporto con la vittima,
 * alibi ufficiale e segreti inconfessabili (con avviso di recitazione).
 */
export function CharacterSheet({ char }: { char: Character }) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <Fingerprint size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">Identità Segreta</span>
        </div>
        <h3 className="font-display text-2xl text-parchment-100">{char.name}</h3>
        <p className="mb-4 text-lg text-gold-400 italic">{char.role}</p>
        <p className="text-lg leading-relaxed text-parchment-200">{char.publicBio}</p>
      </div>

      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <UserRound size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">
            Rapporto con la Vittima
          </span>
        </div>
        <p className="text-lg leading-relaxed text-parchment-200">{char.relationshipWithVictim}</p>
      </div>

      <div className="noir-card p-5">
        <div className="mb-3 flex items-center gap-2 text-gold-500">
          <HelpCircle size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">Alibi Ufficiale</span>
        </div>
        <p className="text-lg leading-relaxed text-parchment-200">{char.alibi}</p>
      </div>

      <div className="noir-card border-blood-600/40 p-5">
        <div className="mb-3 flex items-center gap-2 text-blood-400">
          <AlertTriangle size={18} />
          <span className="font-display text-xs tracking-[0.25em] uppercase">
            I Tuoi Segreti
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
          Rivela questi segreti solo se messo alle strette! Usali per depistare o negoziare.
        </p>
      </div>
    </div>
  );
}
