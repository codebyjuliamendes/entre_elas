"use client";
import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from "lucide-react";
import type { PerfilDemo } from "@/lib/demo/catalogo";
import { ana } from "@/lib/demo/catalogo";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
export function CallRoom({
  perfil,
  inicio,
  onEncerrar,
}: {
  perfil: PerfilDemo;
  inicio: number;
  onEncerrar: () => void;
}) {
  const [remaining, setRemaining] = useState(1200);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setRemaining(
          Math.max(0, 1200 - Math.floor((Date.now() - inicio) / 1000)),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [inicio]);
  const tempo = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return (
    <section className="call-room" aria-label="Videochamada simulada">
      <div className="call-top">
        <span className="call-live">
          <i />
          ENCONTRO DEMONSTRATIVO
        </span>
        <span className="call-timer" aria-label="Tempo restante">
          {tempo}
        </span>
      </div>
      <div className="call-person">
        <Avatar nome={perfil.nome} src={perfil.avatar} size={114} />
        <strong>{perfil.nome}</strong>
        <small>{perfil.cargo}</small>
        <div className="call-self">
          {camera ? (
            <Avatar nome={ana.nome} src={ana.avatar} size={43} />
          ) : (
            <VideoOff size={31} />
          )}
          <span>Você {muted ? "· sem áudio" : ""}</span>
        </div>
      </div>
      <p className="call-topic">
        Um café. Duas experiências.
        <br />
        Um mundo de possibilidades.
      </p>
      <div className="call-controls">
        <button
          className={`call-control ${muted ? "off" : ""}`}
          aria-label={muted ? "Ativar microfone" : "Desativar microfone"}
          aria-pressed={muted}
          onClick={() => setMuted((x) => !x)}
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          className={`call-control ${!camera ? "off" : ""}`}
          aria-label={camera ? "Desativar câmera" : "Ativar câmera"}
          aria-pressed={camera}
          onClick={() => setCamera((x) => !x)}
        >
          {camera ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <span className="call-control" aria-hidden="true">
          <Volume2 size={20} />
        </span>
      </div>
      <Button variant="danger" className="full-width" onClick={onEncerrar}>
        <PhoneOff size={17} />
        Encerrar encontro
      </Button>
      <p className="call-disclaimer">
        Simulação visual. Câmera e microfone não são acessados.
      </p>
      {remaining === 0 && (
        <p className="call-disclaimer" role="status">
          Os 20 minutos terminaram. Registre seu aprendizado quando estiver
          pronta.
        </p>
      )}
    </section>
  );
}
