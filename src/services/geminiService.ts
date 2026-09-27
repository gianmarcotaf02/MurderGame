import type { RoomSettings } from "../types";

export interface GeneratedCharacter {
  id: string;
  name: string;
  role: string;
  publicBio: string;
  relationshipWithVictim: string;
  secrets: string[];
  alibi: string;
  observations: string[];
  questions: string[];
  answers: string[];
}

export interface GeneratedRound {
  title: string;
  globalClue: string;
  privateClues: Record<string, string>;
  evidence?: string[];
}

export interface GeneratedStory {
  title: string;
  prologue: string;
  victim: {
    name: string;
    age: number;
    occupation: string;
    personality: string;
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
  const names = (settings.participantNames ?? []).map((x) => x.trim()).filter(Boolean);
  const namesBlock =
    names.length === n
      ? `
- I personaggi sono interpretati dai seguenti partecipanti REALI: ${names
          .map((x) => `"${x}"`)
          .join(", ")}.
  * Usa i loro nomi ESATTAMENTE come campo "name" di ciascun personaggio (uno a uno, nello stesso ordine in cui li hai elencati).
  * Adatta ruoli, legami e segreti a chi li interpreta, coerentemente con i vincoli dell'organizzatore.`
      : "";
  const narratorBlock = settings.externalNarrator
    ? `
- C'è un NARRATORE ESTERNO (il Game Master): introduce le fasi, legge i reperti a voce o li condivide in chat, e guida la serata. I globalClue e i reperti sono scritti come testo DA LEGGERE AD ALTA VOCE dal narratore; prologo e regole si aprono con la voce del narratore che spiega che lui/lei non interpreta nessun personaggio.`
    : `
- Formato senza narratore esterno: tutti giocano un personaggio; il colpevole mente per salvarsi, gli altri dicono la verità ma proteggono i propri segreti.`;
  return `Sei un game designer specializzato in giochi investigativi e Murder Mystery da tavolo/salotto, in italiano.
Progetta un caso per un gioco "zero sbatti": NIENTE dress-code, NIENTE costumi, NIENTE descrizioni fisiche o interpretazione teatrale.
Il gioco si regge interamente su conversazione, alibi incrociati, bluff e logica deduttiva.${narratorBlock}

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, senza testo fuori dal JSON, conforme a questo schema:
{
  "title": "titolo evocativo del mistero",
  "prologue": "premessa rapida da leggere a inizio serata (max 15 righe): chi è la vittima, dove si trovano tutti, quando è avvenuto il delitto",
  "victim": {
    "name": "nome della vittima",
    "age": 45,
    "occupation": "professione o ruolo della vittima",
    "personality": "presentazione precisa del CARATTERE della vittima: com'era, come trattava le persone, le sue abitudini e i suoi lati oscuri (2-3 frasi: ogni giocatore deve poterla citare)",
    "causeOfDeath": "dettaglio della morte come appare alla scoperta (1-2 frasi)",
    "isSuicideOrAccident": false
  },
  "truth": "busta della soluzione: nome del colpevole, cronologia reale degli eventi MINUTO PER MINUTO e la 'prova schiacciante': l'incongruenza logica precisa che smonta matematicamente l'alibi dell'assassino (5-8 frasi)",
  "culpritCharacterId": "char_X (esattamente uno dei personaggi)",
  "characters": [
    {
      "id": "char_1",
      "name": "nome del personaggio",
      "role": "legame con la vittima o ruolo breve, es. 'L'ex collega che non l'ha mai perdonata'",
      "publicBio": "cosa tutti gli altri sanno di lui/lei (1-2 frasi)",
      "relationshipWithVictim": "il rapporto PRECISO col morto, citandone il carattere (es. 'era lui che si prendeva sempre i miei giochi di carte e non li restituiva mai'), più il movente potenziale: perché la vittima lo/la danneggiava o minacciava (2-3 frasi)",
      "secrets": ["il segreto inconfessabile: NON c'entra con l'omicidio, ma è il motivo per cui è agitato/a e reticente"],
      "alibi": "versione pubblica: cosa dichiara di aver fatto nelle ultime 2 ore prima del ritrovamento del corpo (usa riferimenti vaghi e qualitativi, tipo 'dopo che abbiamo finito di mangiare' o 'mentre qualcuno accendeva il fuoco', NON orari precisi)",
      "observations": ["un dettaglio scomodo che ha visto o sentito su un ALTRO giocatore (indicalo per nome)"],
      "questions": ["domanda investigativa specifica da fare a bruciapelo a un altro partecipante", "seconda domanda a bruciapelo rivolta a un altro partecipante diverso"],
      "answers": ["risposta pronta da dare se qualcuno ti chiede dell'osservazione che ha su di te o del tuo alibi: cosa ammettere, cosa negare, come deviare", "seconda risposta pronta per la domanda più pericolosa che potresti ricevere"]
    }
  ],
  "rounds": [
    {
      "title": "Fase 1: Il Giro degli Alibi",
      "globalClue": "testo di regia per la fase: nessun reperto ancora, si dichiarano gli alibi e iniziano i primi attriti (1-2 frasi di istruzioni)",
      "privateClues": { "char_1": "promemoria privato: un dettaglio del TUO alibi da rafforzare o una tensione da nascondere in questa fase" }
    },
    {
      "title": "Fase 2: Il Rilascio dei Reperti",
      "globalClue": "introduzione breve al rilascio dei reperti (1 frase, da leggere a voce se c'è il narratore)",
      "evidence": ["reperto materiale 1: testo PRONTO da condividere via chat o foglietto (es. cronologia messaggi, scontrino, appunto, referto). Nettissimo e logico", "reperto 2: smentisce apertamente la versione di un giocatore", "reperto 3: ne smentisce un altro", "reperto 4: l'ultimo che costringe qualcuno a vuotare il sacco sui propri segreti"],
      "privateClues": { "char_1": "istruzione riservata: quale reperto ti riguarda e come vuotare il sacco parzialmente senza confessare" }
    },
    {
      "title": "Fase 3: Il Confronto Finale",
      "globalClue": "l'ultimo elemento decisivo (smoking gun): il dettaglio che smonta l'alibi principale e apre il confronto finale",
      "privateClues": { "char_1": "istruzione riservata per il confronto finale: cosa ammettere, cosa negare, cosa giocarsi" }
    }
  ]
}

VINCOLI IMPERATIVI:
- Esattamente ${n} personaggi, con id "char_1" ... "char_${n}".${namesBlock}
- Uno solo è il colpevole (culpritCharacterId). TUTTI hanno un movente plausibile, ma solo gli indizi reali convergono incontrovertibilmente verso la soluzione.
- Solo il colpevole può mentire spudoratamente su alibi e orari; gli innocenti dicono la verità se messi alle strette ma hanno segreti da proteggere.
- I segreti inconfessabili NON sono la soluzione del delitto: creano imbarazzo e sospetto, niente di più.
- Ogni personaggio ha UNA observation su un altro giocatore e DUE domande a bruciapelo rivolte a due partecipanti DIVERSI: sono il carburante della conversazione.
- Esattamente 3 fasi/round; ogni round ha un globalClue e un privateClue per OGNI personaggio (chiavi = id dei personaggi).
- La FASE 2 deve avere ESATTAMENTE 4 reperti materiali nell'array "evidence": testi netti, logici, pronti da condividere via chat/WhatsApp o stampare su foglietti. Devono smentire apertamente la versione di 2-3 giocatori e costringerli a vuotare il sacco sui loro segreti.
- IMPORTANTE: NON riempire il gioco di orari precisi da incrociare. Usa POCI orari (solo 1-2, quelli del reperto decisivo) e alibi vaghi/qualitativi ('dopo che abbiamo smontato la tavola', 'mentre qualcuno andava a prendere la legna'). La deduzione deve poggiare su comportamenti, osservazioni e reperti, non su cronometri.
- Tono: ${settings.tone}. Ambientazione: ${settings.setting}. Complessità: ${settings.complexity}.
- Colpi di scena suicidio simulato/incidente ammessi: ${settings.allowSuicideOrAccident ? "SÌ, puoi usarli se rendono il caso migliore" : "NO, deve essere un omicidio volontario"}.
${settings.customNotes ? `- Note e vincoli speciali dell'organizzatore (OBBLIGATORI): ${settings.customNotes}` : ""}
- Scrivi tutto in italiano, prosa concisa e funzionale: le schede devono restare "di mezza pagina", puramente giocabili.`;
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
  // Normalizza i campi opzionali del nuovo formato
  for (const c of story.characters) {
    if (!Array.isArray(c.observations)) c.observations = [];
    if (!Array.isArray(c.questions)) c.questions = [];
    if (!Array.isArray(c.answers)) c.answers = [];
    if (!Array.isArray(c.secrets) || c.secrets.length === 0) {
      c.secrets = ["Un segreto che preferiresti non svelare."];
    }
  }
  if (!story.victim.personality) {
    story.victim.personality = "Carismatico/a e dominante: prendeva tutto troppo sul personale e non perdonava uno smacco.";
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
const OBSERVATIONS = [
  "Hai visto {ALTRO} uscire dallo studio in fretta, poco prima della scoperta del corpo.",
  "{ALTRO} ha mentito sul proprio orario: ha detto di essere in giardino, ma l'hai incontrato/a in corridoio alle 2:30.",
  "Hai notato {ALTRO} nascondere qualcosa in una tasca mentre tutti accorrevano verso lo studio.",
];
const QUESTIONS = [
  "{ALTRO}: perché la tua candela era ancora accesa, se dici di essere a letto dalle 2:00?",
  "{ALTRO}: chi ti ha visto tra le 2:00 e le 3:00, esattamente?",
  "{ALTRO}: cosa discutevate a voce bassa in serra, prima di cena?",
];


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
  const names = (settings.participantNames ?? []).map((x) => x.trim()).filter(Boolean);

  const characters: GeneratedCharacter[] = Array.from({ length: n }, (_, i) => {
    const other = names.length === n ? names[(i + 1) % n] : NAMES[(i + 1) % NAMES.length].split(" ")[0];
    const other2 = names.length === n ? names[(i + 2) % n] : NAMES[(i + 2) % NAMES.length].split(" ")[0];
    return {
      id: `char_${i + 1}`,
      name: names.length === n ? names[i] : NAMES[i % NAMES.length],
      role: ROLES[i % ROLES.length],
      publicBio: BIOS[i % BIOS.length],
      relationshipWithVictim: RELATIONS[i % RELATIONS.length],
      secrets: [SECRETS[i % SECRETS.length]],
      alibi: ALIBIS[i % ALIBIS.length],
      observations: [OBSERVATIONS[i % OBSERVATIONS.length].replace("{ALTRO}", other)],
      questions: [
        QUESTIONS[i % QUESTIONS.length].replace("{ALTRO}", other),
        QUESTIONS[(i + 1) % QUESTIONS.length].replace("{ALTRO}", other2),
      ],
      answers: [
        i === culpritIndex
          ? "Se ti chiedono del messaggio: dì che la vittima ti aveva chiesto un favore banale e devia in fretta su un altro argomento. Non inventare orari: resta vago."
          : "Se ti chiedono dell'osservazione che hanno su di te: ammetti il dettaglio di minore importanza e spiega che cercavi solo di riprenderti ciò che ti spettava. Non mentire spudoratamente: devia.",
        "Se le domande si fanno insistenti: ammetti il tuo segreto piuttosto che l'accusa principale. Meglio uscire imbarazzati che colpevoli.",
      ],
    };
  });

  const culprit = characters[culpritIndex];
  const victimName = "Sir Reginald Ashworth";
  const settingLine = settings.setting || "una villa isolata, durante una tempesta di fine secolo";
  const isTwist = settings.allowSuicideOrAccident && Math.random() < 0.4;

  const rounds: GeneratedRound[] = [
    {
      title: "Fase 1: Il Giro degli Alibi",
      globalClue:
        "Nessun reperto, per ora. Ciascuno dichiari dove si trovava tra le 1:30 e le 3:00: partiamo dagli attriti, non dai sospetti.",
      privateClues: Object.fromEntries(
        characters.map((c, i) => [
          c.id,
          i === culpritIndex
            ? "Nessuno può confermare il tuo alibi: eri esattamente dove non dovevi essere. Rafforza la tua versione e devia i sospetti."
            : "Un dettaglio del tuo alibi è debole: chiudilo prima che qualcuno lo noti, e proteggi il tuo segreto.",
        ]),
      ),
    },
    {
      title: "Fase 2: Il Rilascio dei Reperti",
      globalClue: "La polizia ha finito le prime verifiche: è il momento dei reperti.",
      evidence: [
        "REPERTO 1 — Cronologia messaggi del telefono della vittima: il suo ultimo messaggio, poco prima del ritrovamento, dice “Ti vedo tra dieci minuti, sei l'unica persona che sa tutto”. Il destinatario è salvato solo con un soprannome.",
        "REPERTO 2 — Scontrino della stazione di servizio del bosco: benzina e un pacchetto di ghiaccio, comprati da uno di voi poco prima della cena. Il cassiere ricorda il volto, non il motivo.",
        "REPERTO 3 — Appunto sul taccuino della vittima: “Se continua così, lo dico a tutti. L'ultima parola è mia”. Calligrafia furiosa; la frase era rivolta a qualcuno che era lì stasera.",
        "REPERTO 4 — Referto: morte tra la fine della cena e il momento in cui il gruppo si è riunito attorno al fuoco. In quel lasso nessuno ricorda di aver visto la vittima viva.",
      ],
      privateClues: Object.fromEntries(
        shuffle(characters).map((c, i) => [
          c.id,
          i === culpritIndex
            ? "Il messaggio era per te e lo scontrino è tuo. Preparati a spiegare entrambi senza confessare: devia, contraffà, accusa."
            : "Uno dei reperti tocca anche te: preparati a spiegare il tuo passaggio con precisione, senza fare la figura del colpevole.",
        ]),
      ),
    },
    {
      title: "Fase 3: Il Confronto Finale",
      globalClue: `REPERTO FINALE — Accanto alla porta dello studio, un'orma di scarpa con la suola crepata; vicino, un filo di lana grigia identica a quella dell'abito di una persona presente. Il soprannome nel telefono corrisponde al vezzeggiativo che una sola persona usava con la vittima. È ora del confronto finale.`,
      privateClues: Object.fromEntries(
        shuffle(characters).map((c, i) => [
          c.id,
          i === culpritIndex
            ? "È finita: gli indizi convergono su di te. Ammetti qualcosa di minore per coprire l'essenziale, o contrattacca accusando un altro."
            : "Nel confronto finale gioca le tue osservazioni: chiedi spiegazioni precise e non mollare finché la versione regge.",
        ]),
      ),
    },
  ];

  return {
    title: settings.title || "Delitto alla Villa Nera",
    prologue: `${victimName}, magnate senza eredi dichiarati, ha riunito ${n} ospiti a ${settingLine}. Alle 2:47 di notte, uno sparo fa accorrere tutti nello studio: ${victimName} giace senza vita. La tempesta ha bloccato ogni via d'uscita. Il colpevole è necessariamente uno di voi. Regole: solo il colpevole può mentire su alibi e orari; gli innocenti dicono la verità se messi alle strette, ma proteggeranno i propri segreti.`,
    victim: {
      name: victimName,
      age: 58,
      occupation: "Magnate dell'acciaio e collezionista d'arte",
      personality:
        "Era un uomo trascendente e vendicativo: teneva i conti con tutti, non restituiva mai i favori e si godeva nel far pesare i propri debiti, anche a un bicchiere di vino. Con gli amici era generoso in apparenza, ma ogni gentilezza aveva una contropartita.",
      causeOfDeath: "Colpo d'arma da fuoco nello studio, eseguito a breve distanza. Nessun segno di lotta.",
      isSuicideOrAccident: isTwist,
    },
    truth: isTwist
      ? `CRONOLOGIA — 2:05 ${culprit.name} sale allo studio; 2:12 la vittima scrive il messaggio; 2:20 la vittima, che aveva inscenato la propria morte per sfuggire ai creditori, viene sorpresa da ${culprit.name} durante la messinscena; 2:47 il colpo. PROVA SCHIACCIANTE — ${culprit.name} dichiara di essere in biblioteca dalle 2:00, ma il messaggio delle 2:12 era indirizzato a lui/lei e la fibra grigia sul tappeto corrisponde al suo abito: l'alibi è matematicamente impossibile.`
      : `CRONOLOGIA — 2:12 la vittima scrive il messaggio "sei l'unica persona che sa tutto"; 2:30 la chiamata interrotta; 2:41 ${culprit.name} entra nello studio con la chiave rubata al maggiordomo; 2:47 il colpo; 2:55 ${culprit.name} ripassa dal corridoio nord (l'impronta sul davanzale). PROVA SCHIACCIANTE — ${culprit.name} dichiara di essere in biblioteca dalle 2:00, ma la biblioteca è al piano di sotto e lo studio al primo: chi scrive alle 2:12 di incontrare qualcuno "tra dieci minuti" lì sopra non poteva non essere ${culprit.name}. L'alibi è matematicamente impossibile.`,
    culpritCharacterId: culprit.id,
    characters,
    rounds,
  };
}
