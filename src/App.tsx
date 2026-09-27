import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ensureAuth } from "./config/firebase";
import { clearSession, loadSession, saveSession } from "./session";
import { useGameRoom } from "./hooks/useGameRoom";
import type { Session } from "./session";
import { GrainOverlay, LoadingScreen } from "./components/ui";
import { HomeView } from "./views/HomeView";
import { Navbar } from "./components/Navbar";
import { LobbyView } from "./views/LobbyView";
import { PlayerDashboard } from "./views/PlayerDashboard";
import { HostConsole } from "./views/HostConsole";
import { AccusationView } from "./views/AccusationView";
import { EpilogueView } from "./views/EpilogueView";

export default function App() {
  // Reidratazione immediata della sessione dal localStorage (zero state loss)
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [uid, setUid] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { room, loaded } = useGameRoom(session?.roomCode ?? null, session?.playerId ?? null);

  // Autenticazione anonima: UID stabile e gratuito
  useEffect(() => {
    ensureAuth()
      .then(setUid)
      .catch(() =>
        setNotice(
          "Errore di autenticazione Firebase: verifica la configurazione e che Anonymous Auth sia attivo.",
        ),
      );
  }, []);

  // Se la stanza non esiste più, la sessione locale viene ripulita in modo controllato
  useEffect(() => {
    if (session && loaded && !room) {
      clearSession();
      setSession(null);
      setNotice("Sessione scaduta: la stanza non è più attiva o è stata chiusa.");
    }
  }, [session, loaded, room]);

  const leave = useCallback(() => {
    clearSession();
    setSession(null);
    setNotice(null);
  }, []);

  let content: ReactNode;

  if (!session) {
    content =
      uid === null ? (
        <LoadingScreen text="Si accendono le candele..." />
      ) : (
        <HomeView
          uid={uid}
          notice={notice}
          onHost={(code, name) => {
            const s: Session = { roomCode: code, playerId: uid, playerName: name, isHost: true };
            saveSession(s);
            setSession(s);
          }}
          onJoin={(code, name) => {
            const s: Session = { roomCode: code, playerId: uid, playerName: name, isHost: false };
            saveSession(s);
            setSession(s);
          }}
        />
      );
  } else if (!loaded || !room) {
    // Reindirizzamento istantaneo alla stanza in corso di ripristino
    content = <LoadingScreen text="Si riprende la scena..." />;
  } else {
    const status = room.meta.status;
    content = (
      <div className="min-h-full">
        <Navbar room={room} session={session} onLeave={leave} />
        <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-28">
          {(status === "LOBBY" || status === "GENERATING" || status === "ASSIGNMENT") && (
            <LobbyView room={room} session={session} />
          )}
          {status === "IN_GAME" &&
            (session.isHost ? (
              <HostConsole room={room} session={session} />
            ) : (
              <PlayerDashboard room={room} session={session} />
            ))}
          {status === "ACCUSATION" && <AccusationView room={room} session={session} />}
          {(status === "REVEAL" || status === "COMPLETED") && (
            <EpilogueView room={room} session={session} onLeave={leave} />
          )}
        </main>
      </div>
    );
  }

  return (
    <>
      <GrainOverlay />
      {content}
    </>
  );
}
