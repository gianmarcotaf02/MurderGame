# 🗡️ Cena con Delitto — Murder Mystery Party Live

WebApp per organizzare ed eseguire **"Cene con Delitto"** (murder mystery party) dal vivo con gli amici: un Game Master configura la serata, un'AI (Google Gemini) genera trama, personaggi, alibi, segreti e indizi a rilascio progressivo, e i giocatori si uniscono da smartphone con un codice stanza a 6 caratteri (o QR Code).

- **Resilienza totale al refresh**: identità e stato in `localStorage` (`mm_*`) + sincronizzazione realtime via Firebase Realtime Database. Se la pagina si ricarica o va in background, torni esattamente dove eri.
- **Trama AI sempre diversa**, vincolata dai desiderata del Game Master (tono, ambientazione, abbinamenti tra giocatori...).
- **Fasi complete della serata**: Lobby → Generazione → Assegnazione ruoli (self-service / random / manuale) → 3 Atti con indizi pubblici e privati → Fase d'Accusa → Epilogo teatrale con verità e verdetto.
- **100% gratuito**: Firebase Spark Plan + Google AI Studio free tier + Vercel Hobby.

---

## 🛠️ Stack

| Ruolo | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 (palette noir: `#0B0F19`, `#1E293B`, oro `#D97706`, cremisi `#991B1B`) |
| Icone | lucide-react |
| Realtime & Auth | Firebase Realtime Database + Anonymous Authentication |
| AI | Google Gemini (`gemini-2.0-flash`) con fallback a trama predefinita |
| Deploy | Vercel (SPA rewrite incluso in `vercel.json`) |

---

## ⚙️ Setup passo-passo

### 1. Prerequisiti

- Node.js 18+ e npm
- Un account Google (per Firebase e Gemini)
- Un account [Vercel](https://vercel.com) (per il deploy, facoltativo in fase di sviluppo)

### 2. Installa le dipendenze

```bash
npm install
cp .env.example .env   # poi compila .env come descritto sotto
```

### 3. Crea il progetto Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e clicca **Aggiungi progetto**.
   - Nome: es. `cena-con-delitto` — Google Analytics: **disattivalo** (non serve).
2. **Registra una Web App**:
   - Nella panoramica del progetto, clicca sull'icona **`</>`** (Web).
   - Nickname: `murdergame-web` — **NON** attivare Firebase Hosting (usiamo Vercel).
   - Al termine, ti verrà mostrato l'oggetto `firebaseConfig`: copia i valori nel tuo `.env` (vedi sotto).
3. **Attiva Realtime Database**:
   - Menu laterale → **Realtime Database** → **Crea database**.
   - Località: `europe-west1` (Belgio) o la più vicina.
   - Modalità: **Avvia in modalità di test** (aggiorniamo subito le regole al punto 4).
   - Copia l'**URL del database** (`https://<progetto>-default-rtdb.europe-west1.firebasedatabase.app`) in `VITE_FIREBASE_DATABASE_URL`.
4. **Regole di sicurezza** — nella scheda **Regole** di Realtime Database incolla:

   ```json
   {
     "rules": {
       "rooms": {
         "$roomCode": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```

   > ⚠️ Le regole richiedono l'autenticazione anonima (punto 5) ma non limitano chi può scrivere: è una scelta volontaria per un gioco tra amici. Chi ha il codice stanza può entrare, ma chiunque abbia l'URL del progetto potrebbe in teoria leggere le trame. Per serate private va benissimo; non inserire dati sensibili.
5. **Attiva Anonymous Authentication**:
   - Menu laterale → **Authentication** → **Iniziamo**.
   - Scheda **Sign-in method** → **Anonimo** → **Abilita** → Salva.
6. Clicca su **Authentication → Impostazioni → Domini autorizzati**: per il deploy Vercel aggiungerai il dominio del sito (punto 7).

### 4. Compila il file `.env`

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=cena-con-delitto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://cena-con-delitto-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=cena-con-delitto
VITE_FIREBASE_STORAGE_BUCKET=cena-con-delitto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_GEMINI_API_KEY=AIza...
```

### 5. Chiave API Google Gemini (opzionale ma consigliata)

1. Vai su [Google AI Studio](https://aistudio.google.com/apikey).
2. **Crea API key** (con lo stesso account Google del progetto Firebase, oppure uno qualsiasi: il free tier è indipendente).
3. Copia la chiave in `VITE_GEMINI_API_KEY`.

> ℹ️ **Senza chiave Gemini l'app funziona comunque**: viene usata una **trama di riserva predefinita** ("Delitto alla Villa Nera"), adattata all'ambientazione e al numero di giocatori, con un banner di avviso per il Game Master.

### 6. Sviluppo locale

```bash
npm run dev
```

Apri `http://localhost:5173` sul PC (Game Master) e sul telefono (giocatori, stessa rete Wi-Fi oppure usa il QR Code in Lobby che punta all'URL di deploy).

### 7. Deploy su Vercel

1. **Push su GitHub**:
   ```bash
   git init && git add . && git commit -m "Cena con Delitto"
   git branch -M main
   git remote add origin https://github.com/<tuo-user>/murdergame.git
   git push -u origin main
   ```
2. Su [vercel.com](https://vercel.com) → **Add New Project** → importa la repo.
   - Framework preset: **Vite** (rilevato automaticamente).
   - **Environment Variables**: aggiungi **tutte** le variabili di `.env` (le 7 Firebase + `VITE_GEMINI_API_KEY`).
   - Deploy.
3. Torna su **Firebase Console → Authentication → Domini autorizzati** e aggiungi il dominio Vercel (es. `murdergame.vercel.app`), altrimenti l'anonymous auth fallirà in produzione.

> `vercel.json` è già incluso con il rewrite SPA: l'app è un'unica pagina, nessuna route da configurare.

---

## 📂 Struttura del progetto

```
├── .env.example              # Template variabili d'ambiente
├── vercel.json               # Rewrite SPA per Vercel
├── index.html                # Font (Cinzel + Cormorant Garamond) e root
├── src/
│   ├── main.tsx              # Bootstrap React
│   ├── App.tsx               # Router di stato: reidrata la sessione e instrada per status/ruolo
│   ├── index.css             # Tema noir (Tailwind v4, token @theme)
│   ├── types.ts              # Tipi Room, Character, Round, PlayerEntry, Accusation...
│   ├── session.ts            # Persistenza locale (chiavi mm_*)
│   ├── utils.ts              # cn(), codici stanza, etichette status
│   ├── config/
│   │   └── firebase.ts       # Init Firebase + signInAnonymously
│   ├── services/
│   │   ├── geminiService.ts  # Prompt engineering, pulizia JSON, fallback offline
│   │   └── roomService.ts    # Tutte le scritture RTDB (crea, join, genera, assegna, accuse...)
│   ├── hooks/
│   │   ├── useGameRoom.ts    # onValue realtime + presenza online (onDisconnect)
│   │   └── useLocalStorage.ts # Stato persistito (taccuino)
│   ├── components/
│   │   ├── Navbar.tsx        # Header: titolo, status, codice, QR, presenza
│   │   ├── QRCodeModal.tsx   # QR Code d'invito (qrcode.react)
│   │   ├── Notebook.tsx      # Taccuino sospetti con autosave
│   │   ├── CharacterSheet.tsx# Scheda segreta del personaggio
│   │   └── ui.tsx            # Grain/vignette, modal, blur-reveal, banner
│   └── views/
│       ├── HomeView.tsx          # Menu, crea o unisciti
│       ├── CreateGameWizard.tsx  # Wizard di configurazione (3-15 giocatori, vincoli AI)
│       ├── LobbyView.tsx         # Lobby + generazione + assegnazione ruoli
│       ├── PlayerDashboard.tsx   # Tab giocatore: Scheda / Indizi / Taccuino + notifica round
│       ├── HostConsole.tsx       # Console GM: regia, verità, panoramica compagnia
│       ├── AccusationView.tsx    # Fase d'accusa + riepilogo voti live
│       └── EpilogueView.tsx      # Epilogo teatrale a schede progressive
```

---

## 🎭 Come si gioca (flusso)

1. **Game Master**: *Crea una Partita* → wizard (ambientazione, tono, complessità, 3–15 ospiti, vincoli liberi) → riceve il **codice stanza**.
2. **Giocatori**: *Unisciti* inserendo codice o scansionando il QR → inseriscono il nome.
3. Il GM preme **Genera il Mistero**: l'AI crea prologo, vittima, `N` personaggi (uno è il colpevole), 3 atti con indizio pubblico + un indizio privato per personaggio.
4. **Assegnazione**: self-service (ognuno reclama), random dell'host, manuale con select per personaggio; i ruoli rimasti possono diventare **NPC** interpretati dal GM.
5. **In Scena**: i giocatori vedono il prologo, la vittima e i propri segreti (sfocati finché non rivelati). Ad ogni avanzamento di atto: **vibrazione + modale** con il nuovo indizio. Il taccuino salva gli appunti in locale.
6. Il GM apre la **Fase d'Accusa**: ognuno accusa con motivazione; il GM vede i voti in tempo reale.
7. **Rivelazione Finale**: epilogo a schede progressive — verità, assassino, verdetto, riepilogo accuse e tutti i segreti svelati.

---

## 🧯 Risoluzione dei problemi

| Problema | Causa / Soluzione |
|---|---|
| `auth/configuration-not-found` o schermata bloccata su "Si accendono le candele" | Anonymous Auth non abilitato → Firebase Console → Authentication → Sign-in method → **Anonimo**. In produzione controlla anche i **domini autorizzati**. |
| `permission_denied` su Firebase | Regole RTDB non applicate → incolla le regole del punto 3.3 e pubblica. |
| La stanza "non esiste" dopo il deploy | `VITE_FIREBASE_DATABASE_URL` mancante o errata: è l'URL completo del Realtime Database, non del progetto. |
| Banner "trama di riserva" | `VITE_GEMINI_API_KEY` assente/non valida, quota free tier esaurita, o risposta AI non valida → l'app degrada con grazia e resta giocabile. |
| Il codice a 6 cifre si genera ma il secondo giocatore non vede la lobby | Verifica che entrambi puntino allo stesso deploy/URL e che ilDB sia nella stessa regione indicata nell'URL. |
| Rigenerare tutto | Ricaricare la pagina **non** serve: per ripartire da zero il GM chiude la stanza dall'epilogo (o elimina `rooms/<codice>` da Firebase Console). |

---

## 📜 Note di privacy

Tutti i dati di una partita vivono nel Realtime Database sotto `/rooms/{codice}` e in `localStorage` dei partecipanti. Nessuna analytics, nessun costo, nessun dato personale richiesto: basta un nome d'arte.
