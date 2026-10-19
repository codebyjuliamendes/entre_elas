"use client";
import { IconeFaisca } from "@/components/Marca";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Search, Send, MessageCircle } from "lucide-react";
import { useDemo, atualizarDemo } from "@/lib/demo/store";
import { perfisDemo, type PerfilDemo } from "@/lib/demo/catalogo";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
const mensagensIniciais: Record<string, string> = {
  carla:
    "Oi, Ana! Que bom te encontrar por aqui. Vamos trocar experiências no nosso café? ☕",
  daniela:
    "Oi, Ana! Se precisar de uma mão com dados ou indicadores, vamos conversar!",
};
export function ChatsScreen({ com }: { com?: string }) {
  const state = useDemo();
  const [busca, setBusca] = useState("");
  const [contato, setContato] = useState<PerfilDemo | null>(
    perfisDemo.find((p) => p.slug === com && p.slug !== "ana") ?? null,
  );
  const [texto, setTexto] = useState("");
  function enviar(event: FormEvent) {
    event.preventDefault();
    if (!contato || !texto.trim()) return;
    const canal = contato.slug;
    const mensagem = {
      id: crypto.randomUUID(),
      canal,
      texto: texto.trim().slice(0, 1000),
      autora: "ana" as const,
      created_at: new Date().toISOString(),
    };
    atualizarDemo((s) => ({
      ...s,
      mensagens: [...s.mensagens, mensagem].slice(-200),
    }));
    setTexto("");
    setTimeout(() => {
      atualizarDemo((s) => ({
        ...s,
        mensagens: [
          ...s.mensagens,
          {
            id: crypto.randomUUID(),
            canal,
            texto:
              canal === "carla"
                ? "Adorei sua ideia! No nosso café, podemos começar pelo objetivo e construir um próximo passo juntas. 💜"
                : `Vamos aprender juntas! Podemos começar com uma pergunta sobre ${contato.saberes[0].toLowerCase()} e escolher um próximo passo. ✨`,
            autora: "contato" as const,
            created_at: new Date().toISOString(),
          },
        ].slice(-200),
      }));
    }, 850);
  }
  if (contato)
    return (
      <>
        <div className="chat-heading">
          <button
            className="back-button"
            aria-label="Voltar às conversas"
            onClick={() => setContato(null)}
          >
            <ArrowLeft size={17} />
          </button>
          <Avatar nome={contato.nome} src={contato.avatar} size={43} />
          <div>
            <strong>{contato.nome}</strong>
            <small>Conversa simulada · Faísca</small>
          </div>
          <IconeFaisca size={17} color="#b49bc8" style={{ marginLeft: "auto" }} />
        </div>
        <div
          className="chat-messages"
          role="log"
          aria-label={`Mensagens com ${contato.nome}`}
          aria-live="polite"
        >
          <div className="message">
            {mensagensIniciais[contato.slug] ??
              `Oi, Ana! Vamos trocar experiências sobre ${contato.saberes[0].toLowerCase()}?`}
            <small>Exemplo de conversa</small>
          </div>
          {state.mensagens
            .filter((m) => m.canal === contato.slug)
            .map((m) => (
              <div
                className={`message ${m.autora === "ana" ? "mine" : ""}`}
                key={m.id}
              >
                {m.texto}
                <small>
                  {new Intl.DateTimeFormat("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(m.created_at))}
                </small>
              </div>
            ))}
        </div>
        <div className="prompt-chips" style={{ marginBottom: 14 }}>
          <button
            className="tag"
            style={{ border: 0, padding: "8px 10px" }}
            onClick={() =>
              setTexto("O que te ajudou quando você viveu esse desafio?")
            }
          >
            <IconeFaisca size={11} />
            Uma pergunta para começar
          </button>
        </div>
        <form className="chat-composer" onSubmit={enviar}>
          <input
            aria-label="Sua mensagem fictícia"
            value={texto}
            maxLength={1000}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem fictícia…"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensagem"
            disabled={!texto.trim()}
          >
            <Send size={17} />
          </Button>
        </form>
        <p className="chat-local-note">
          Esta conversa é simulada e fica apenas neste navegador. Nenhuma
          mensagem é enviada ao Stream ou usada pela IA.
        </p>
        <button
          className="text-link"
          onClick={() => {
            atualizarDemo((s) => ({
              ...s,
              mensagens: s.mensagens.filter((m) => m.canal !== contato.slug),
            }));
            toast.success("Mensagens da demonstração apagadas.");
          }}
        >
          Limpar conversa simulada
        </button>
      </>
    );
  const contatos = perfisDemo
    .slice(1)
    .filter((p) =>
      `${p.nome} ${p.cargo}`.toLowerCase().includes(busca.toLowerCase()),
    );
  return (
    <>
      <span className="eyebrow" style={{ paddingTop: 16 }}>
        A troca continua por aqui
      </span>
      <h1 className="page-title">
        Boas conversas<span style={{ color: "#a080c9" }}>.</span>
      </h1>
      <p className="page-subtitle">Um “oi” pode ser o começo de muita coisa.</p>
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Buscar conversas"
          placeholder="Buscar uma conversa"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>
      <div className="section-heading">
        <h2>Sua rede, mais perto</h2>
        <span className="pill">
          <IconeFaisca size={10} />
          Faíscas
        </span>
      </div>
      {contatos.map((p) => {
        const ultima = state.mensagens.filter((m) => m.canal === p.slug).at(-1);
        return (
          <button
            key={p.id}
            className="chat-item"
            onClick={() => setContato(p)}
          >
            <Avatar nome={p.nome} src={p.avatar} size={51} />
            <div>
              <strong>{p.nome}</strong>
              <span
                className="tag"
                style={{ marginLeft: 6, padding: "2px 4px", fontSize: 7 }}
              >
                Faísca
              </span>
              <p>
                {ultima?.texto ??
                  mensagensIniciais[p.slug] ??
                  `Vamos conversar sobre ${p.saberes[0].toLowerCase()}?`}
              </p>
            </div>
            <div className="chat-time">
              <small>{ultima ? "Agora" : "Demo"}</small>
              {!ultima && <span className="unread-badge">1</span>}
            </div>
          </button>
        );
      })}
      {!contatos.length && (
        <div className="empty-state">
          <MessageCircle size={26} />
          <h3>Nenhuma conversa com esse nome</h3>
          <p>Tente buscar por Carla ou Daniela.</p>
        </div>
      )}
      <div className="tip-box">
        <MessageCircle size={17} />
        <span>
          Conversas de demonstração, com respostas fictícias. No fluxo real, o
          chat fica no Stream e não alimenta o mapa de saberes.
        </span>
      </div>
    </>
  );
}
