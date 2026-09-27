import type { RoomSettings } from "../types";

export interface GeneratedCharacter {
  id: string;
  name: string;
  role: string;
  publicBio: string;
  relationshipWithVictim: string;
  secrets: string[];
  alibi: string;
}

export interface GeneratedRound {
  title: string;
  globalClue: string;
  privateClues: Record<string, string>;
}

export interface GeneratedStory {
  title: string;
  prologue: string;
  victim: {
    name: string;
    age: number;
    occupation: string;
    causeOfDeath: string;
    isSuicideOrAccident: boolean;
  };
  truth: string;
  culpritCharacterId: string;
  characters: GeneratedCharacter[];
  rounds: GeneratedRound[];
}

const MODEL = "gemini-2.0-flash";

function buildPrompt(settings: RoomSettings): string {
  const n = settings.playerCount;
  return `Sei un maestro di giochi esperto nella creazione di murder mystery party ("cene con delitto") in italiano, da interpretare dal vivo con gli amici.
Genera un caso d'investigazione COMPLETO, originale, coerente e avvincente, con una logica a prova di bomba ("ironclad logic").

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo fuori dal JSON, conforme a questo schema:
{
  "title": "titolo evocativo del mistero",
  "prologue": "incipit narrativo: chi è la vittima, dove e quando avviene il delitto, perché tutti gli invitati sono presenti (3-5 frasi)",
  "victim": {
    "name": "nome della vittima",
    "age": 58,
    "occupation": "professione o titolo della vittima",
    "causeOfDeath": "dettaglio della morte come appare alla scoperta del corpo (1-2 frasi)",
    "isSuicideOrAccident": false
  },
  "truth": "spiegazione inequivocabile dell'accaduto: cronologia precisa degli eventi, arma, movente reale e confutazione di ogni falso alibi (4-6 frasi)",
  "culpritCharacterId": "char_X (esattamente uno dei personaggi)",
  "characters": [
    {
      "id": "char_1",
      "name": "nome completo del personaggio",
      "role": "archetipo breve, es. 'L'ereditiera decaduta'",
      "publicBio": "cosa tutti gli ospiti vedono e sanno di lui/lei all'inizio della serata (1-2 frasi)",
      "relationshipWithVictim": "rapporto con la vittima, con una tensione o un'ombra (1-2 frasi)",
      "secrets": ["segreto inconfessabile o movente", "secondo segreto"],
      "alibi": "cosa dichiara di aver fatto al momento della morte"
    }
  ],
  "rounds": [
    {
      "title": "Atto I: <sottotitolo evocativo>",
      "globalClue": "indizio pubblico rivelato a tutti gli invitati (1-2 frasi)",
      "privateClues": { "char_1": "indizio personale riservato a char_1", "char_2": "...", ... }
    }
  ]
}

VINCOLI IMPERATIVI:
- Esattamente ${n} personaggi, con id "char_1" ... "char_${n}".
- Uno solo è il colpevole (culpritCharacterId). TUTTI i personaggi devono avere motivi plausibili per essere sospettati (depistaggi), ma solo gli indizi reali devono convergere incontrovertibilmente verso la soluzione.
- Il falso alibi principale deve essere smontabile da un indizio preciso.
- Esattamente 3 round; ogni round ha un globalClue e un privateClue per OGNI personaggio (chiavi = id dei personaggi).
- Bilanciamento degli indizi nei round:
  * Round 1: indizi ambientali, relazioni iniziali, moventi superficiali.
  * Round 2: contraddizioni negli alibi, prove fisiche nascoste, segreti parzialmente svelati.
  * Round 3: la prova decisiva (smoking gun) e l'elemento che smonta il falso alibi principale.
- I privateClues devono dare a ogni giocatore un pezzo unico del puzzle: indizi che si completano a vicenda tra i giocatori.
- Tono: ${settings.tone}. Ambientazione: ${settings.setting}. Complessità del mistero: ${settings.complexity}.
- L'organizzatore ammette colpi di scena come suicidio simulato o incidente insabbiato: ${settings.allowSuicideOrAccident ? "SÌ, puoi strutturare facoltativamente un caso dove non c'è omicidio volontario (es. suicidio fatto apparire come delitto per incastrare un rivale, o incidente coperto per paura)" : "NO, deve trattarsi di un omicidio volontario"}.
${settings.customNotes ? `- Note e vincoli speciali dell'organizzatore (OBBLIGATORI): ${settings.customNotes}` : ""}
- Scrivi tutto in italiano, con prosa evocativa ma concisa (massimo 2-3 frasi per campo).`;
}

/** Ripulisce l'output AI da eventuali backtick o testo extra e restituisce JSON puro. */
function cleanJson(raw: string): string {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON non trovato nella risposta AI");
  return text.slice(start, end + 1);
}

function validateStory(story: GeneratedStory, n: number): GeneratedStory {
  if (!story || !Array.isArray(story.characters) || story.characters.length !== n) {
    throw new Error("Struttura della trama incompleta");
  }
  if (!story.victim || !story.truth || !story.prologue || !Array.isArray(story.rounds) || story.rounds.length === 0) {
    throw new Error("Campi narrativi mancanti");
  }
  if (!story.characters.some((c) => c.id === story.culpritCharacterId)) {
    throw new Error("Colpevole non valido");
  }
  return story;
}

/** Genera la trama con Gemini. Lancia un errore se la chiave manca o la chiamata fallisce. */
export async function generateStory(settings: RoomSettings): Promise<GeneratedStory> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(settings) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 1.0,
          maxOutputTokens: 8192,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Errore Gemini (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Risposta AI vuota");

  const parsed = JSON.parse(cleanJson(text)) as GeneratedStory;
  return validateStory(parsed, settings.playerCount);
}

// ─────────────────────────────────────────────────────────────────────────────
// Trama di riserva: usata quando la chiave AI manca o l'API fallisce.
// Garantisce che la serata sia comunque giocabile.
// ─────────────────────────────────────────────────────────────────────────────

const NAMES = ["Lord Henry Ashworth", "Lady Vivienne Cross", "Dott. Edmund Marlowe", "Miss Rosalind Fairchild", "Colonnello Alistair Stone", "Madame Seraphine Duval", "Sig. Julian Quill", "Contessa Beatrice von Falkenrath", "Fra' Anselmo da Bergamo", "Sig.na Agatha Plum", "Dott.ssa Miriam Kessler", "Capitano Yuri Volkov", "Sig. Raffaele Corsini", "Miss Lily Winterbourne", "Prof. Achilles Webb"];
const ROLES = ["Il Maggiordomo", "La Contessa", "Il Medico di Famiglia", "L'Attrice", "Il Colonnello in pensione", "La Veggente", "Lo Scrittore", "La Governante", "Il Giardiniere", "La Segretaria", "Il Banchiere", "La Candidata al trono", "Il Critico d'arte", "La Sarta", "L'Archivista"];
const BIOS = [
  "Serve la famiglia da vent'anni. Silenzioso, puntuale, onnipresente.",
  "Vicina di casa dalla bellezza fredda e dalle finanze dissestate.",
  "Cura la salute degli ospiti da decenni. Nessuno gli chiede mai due volte il parere.",
  "Star del palcoscenico, accettata in società per il suo fascino nonostante le origini umili.",
  "Veterano decorato, schivo, con una passione inconfessabile per la caccia.",
  "Legge le palme e i turbamenti altrui. Troppi segreti le sono stati confessati.",
  "Romanziere di successi passati, in cerca di una storia che lo rilanci.",
  "Gestisce la casa con rigore ferreo e conosce ogni armadio, ogni cavo, ogni lettera.",
  "Custodisce le chiavi di ogni porta e i rancori di ogni stagione.",
  "Trascrive ogni parola, anche quelle pronunciate a bassa voce.",
];
const RELATIONS = [
  "Fedele servitore della vittima, ma ricattato per un errore del passato.",
  "Creditrice insoddisfatta: la vittima le doveva una cifra considerevole.",
  "I suoi farmaci dipendevano da lui, e un errore di dosaggio rischiava lo scandalo.",
  "L'ha amato in segreto, per poi essere umiliato/a pubblicamente.",
  "La vittima minacciava di rivelare la sua diserzione durante la guerra.",
  "La vittima l'aveva smascherata come truffatrice davanti a tutti gli invitati.",
  "La vittima gli aveva rubato il manoscritto che l'avrebbe consacrato.",
  "Ha scoperto il testamento: erediterà solo se la vittima morisse entro la settimana.",
];
const SECRETS = [
  "Ha intascato una somma di denaro dalla cassaforte la sera del delitto.",
  "Porta sempre addosso una fiala di veleno per ratti, 'per precauzione'.",
  "Ha una doppia identità sotto richiesta di pagamento di un debito di gioco.",
  "È stato visto litigare con la vittima oltre mezzanotte, fuori dalla serra.",
  "Ha distrutto una lettera compromettente trovata nello studio della vittima.",
  "Soffre di sonnambulismo e non ricorda dove è finito dopo le tre di notte.",
  "Ha fissato un incontro segreto con la vittima per l'indomani: 'avrei tutto da perdere'.",
  "Ha rubato una chiave dello studio dalla tasca del cappotto del maggiordomo.",
];
const ALIBIS = [
  "Dichiara di essere in cantina a inventariare le bottiglie.",
  "Giura di essere rimasto/a in biblioteca a leggere fino allo scoccare delle tre.",
  "Dice di aver fumato sulla terrazza, ma nessuno lo ha visto.",
  "Afferma di essersi ritirato/a in camera per una forte emicrania.",
  "Era 'in giardino a respirare l'aria fresca': nessuno ricorda di averlo incrociato.",
  "Dice di aver ballato in salotto con gli altri, ma la musica era già finita.",
  "Sostiene di essere andato/a a letto presto; la candela della sua camera, però, era ancora accesa.",
  "Afferma di aver preparato la cioccolata calda in cucina, ma il cuoco era già andato via.",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function generateFallbackStory(settings: RoomSettings): GeneratedStory {
  const n = settings.playerCount;
  const culpritIndex = Math.floor(Math.random() * n);

  const characters: GeneratedCharacter[] = Array.from({ length: n }, (_, i) => ({
    id: `char_${i + 1}`,
    name: NAMES[i % NAMES.length],
    role: ROLES[i % ROLES.length],
    publicBio: BIOS[i % BIOS.length],
    relationshipWithVictim: RELATIONS[i % RELATIONS.length],
    secrets: [SECRETS[i % SECRETS.length], pick(SECRETS)],
    alibi: ALIBIS[i % ALIBIS.length],
  }));

  const culprit = characters[culpritIndex];
  const victimName = "Sir Reginald Ashworth";
  const settingLine = settings.setting || "una villa isolata, durante una tempesta di fine secolo";
  const isTwist = settings.allowSuicideOrAccident && Math.random() < 0.4;

  const rounds: GeneratedRound[] = [
    {
      title: "Atto I: La Scoperta del Corpo",
      globalClue: `Il corpo di ${victimName} è stato trovato nello studio, la finestra aperta e la cassaforte intatta. Sul tappeto, un'impronta di scarpa piccola, quasi cancellata.`,
      privateClues: Object.fromEntries(
        shuffle(characters).map((c, i) => [
          c.id,
          i === culpritIndex
            ? "Sai che nessuno può confermare il tuo alibi: eri esattamente dove non dovevi essere. Occorre deviare i sospetti."
            : "Hai sentito uno scricchiolio di legno dietro la porta dello studio verso mezzanotte, ma hai avuto troppa paura di guardare.",
        ]),
      ),
    },
    {
      title: "Atto II: I Debiti del Passato",
      globalClue: `Nel cestino dello studio, una lettera strappata: "Conosco ciò che hai fatto. Presto tutti lo sapranno." La calligrafia è elegante, difficile da attribuire.`,
      privateClues: Object.fromEntries(
        shuffle(characters).map((c, i) => [
          c.id,
          i === culpritIndex
            ? "La lettera non parla di te: sai chi l'ha scritta. Chiudi il cerchio prima che lo facciano gli altri."
            : "Hai visto qualcuno uscire dallo studio con un foglio in mano. Il volto era in ombra, ma l'andatura ti è familiare.",
        ]),
      ),
    },
    {
      title: "Atto III: La Verità in Agguato",
      globalClue: `L'orologio da taschino della vittima si è fermato alle 2:47. Il medico conferma che l'ora della morte è compatibile. Quell'orario, per qualcuno, è un problema serio.`,
      privateClues: Object.fromEntries(
        shuffle(characters).map((c, i) => [
          c.id,
          i === culpritIndex
            ? "È finita: gli indizi convergono su di te. Puoi solo sperare che l'accusa cada su un altro."
            : `Un dettaglio dell'alibi di ${culprit.name} non torna. Sei pronto/a ad accusarlo davanti a tutti.`,
        ]),
      ),
    },
  ];

  return {
    title: settings.title || "Delitto alla Villa Nera",
    prologue: `${victimName}, magnate senza eredi dichiarati, ha riunito ${n} ospiti a ${settingLine}. Alle 2:47 di notte, uno sparo inquieto fa accorrere tutti nello studio: ${victimName} giace senza vita. La tempesta ha bloccato ogni via d'uscita. Il colpevole è necessariamente uno di voi.`,
    victim: {
      name: victimName,
      age: 58,
      occupation: "Magnate dell'acciaio e collezionista d'arte",
      causeOfDeath: "Colpo d'arma da fuoco nello studio, eseguito a breve distanza. Nessun segno di lotta.",
      isSuicideOrAccident: isTwist,
    },
    truth: isTwist
      ? `La verità è più strana dell'omicidio: ${victimName} aveva inscenato la propria morte per sfuggire ai creditori, ma ${culprit.name} (${culprit.role}) l'ha sorpreso durante la messinscena e ne ha approfittato per compiere il delitto davvero, facendolo passare per farsa. Gli indizi del II e III Atto confermano la sua presenza nello studio all'ora fatale.`
      : `L'assassino è ${culprit.name} (${culprit.role}). Motivo: ${culprit.relationshipWithVictim} Ha agito alle 2:47, sfruttando l'orario in cui gli alibi degli altri erano solo apparenti. L'impronta sul tappeto e la lettera strappata lo indicano senza riserve: ${culprit.secrets[0]}`,
    culpritCharacterId: culprit.id,
    characters,
    rounds,
  };
}
