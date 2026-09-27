import { useLocalStorage } from "../hooks/useLocalStorage";
import { Check, NotebookPen } from "lucide-react";
import { SectionTitle } from "./ui";

/**
 * Taccuino investigativo personale del giocatore.
 * Salvataggio automatico continuo in localStorage (`mm_player_notes`):
 * gli appunti sopravvivono anche se la rete vacilla o la pagina si ricarica.
 */
export function Notebook() {
  const [notes, setNotes] = useLocalStorage<string>("mm_player_notes", "");

  return (
    <div className="animate-fade-up">
      <SectionTitle>Taccuino Sospetti</SectionTitle>
      <p className="mb-3 text-base text-parchment-400 italic">
        Annota chi mentiva, chi è stato visto vicino alla scena, i dettagli che nessun altro sa.
        I tuoi appunti restano sul dispositivo, al sicuro da ogni interruzione di rete.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={12}
        className="input resize-y leading-relaxed"
        placeholder="Chi si è allontanato dopo mezzanotte? Chi mentiva sull'alibi?..."
      />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-gold-400/80">
        <Check size={13} /> Salvataggio automatico locale attivo
      </p>
      <div className="mt-4 flex items-center gap-2 text-parchment-400/70">
        <NotebookPen size={15} />
        <span className="text-sm italic">Solo tu puoi leggere questa pagina.</span>
      </div>
    </div>
  );
}
