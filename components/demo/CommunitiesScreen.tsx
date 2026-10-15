"use client";
import { useState } from "react";
import {
  Search,
  Code2,
  Sparkles,
  Zap,
  Heart,
  ArrowLeft,
  ArrowUpRight,
  Check,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { comunidadesDemo, perfisDemo } from "@/lib/demo/catalogo";
import { useDemo, alternarLista } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
const icons = { code: Code2, sparkles: Sparkles, zap: Zap, heart: Heart };
export function CommunitiesScreen() {
  const state = useDemo();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"explorar" | "minhas">("explorar");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [curtidas, setCurtidas] = useState<string[]>([]);
  const comunidade = comunidadesDemo.find((c) => c.id === selecionada);
  function toggle(id: string) {
    const member = state.comunidades.includes(id);
    alternarLista("comunidades", id);
    toast.success(
      member
        ? "Você saiu desta comunidade na demonstração."
        : "Você faz parte desta comunidade na demonstração.",
    );
  }
  if (comunidade) {
    const Icon = icons[comunidade.icon];
    const membro = state.comunidades.includes(comunidade.id);
    return (
      <>
        <div className="page-topline">
          <button
            className="back-button"
            aria-label="Voltar às comunidades"
            onClick={() => setSelecionada(null)}
          >
            <ArrowLeft size={17} />
          </button>
          <span className="eyebrow">Uma rede dentro da rede</span>
        </div>
        <div
          className={`community-cover ${comunidade.cor}`}
          style={{ borderRadius: 18, height: 135 }}
        >
          <span className="icon-tile">
            <Icon size={26} />
          </span>
          <span className="tag">{comunidade.tag}</span>
        </div>
        <h1 className="page-title" style={{ fontSize: 26 }}>
          {comunidade.nome}
        </h1>
        <p className="page-subtitle">{comunidade.descricao}</p>
        <Button
          variant={membro ? "secondary" : "default"}
          className="full-width"
          onClick={() => toggle(comunidade.id)}
        >
          {membro ? (
            <>
              <Check size={16} />
              Participando · sair
            </>
          ) : (
            <>
              <UsersRound size={16} />
              Quero fazer parte
            </>
          )}
        </Button>
        <p className="community-topic">
          Conversas fictícias para inspirar novas trocas
        </p>
        {perfisDemo.slice(1).map((p, i) => {
          const id = `${comunidade.id}-${p.slug}`;
          return (
            <article className="community-post" key={id}>
              <div className="community-post-author">
                <Avatar nome={p.nome} src={p.avatar} size={35} />
                <div>
                  <strong>{p.nome}</strong>
                  <small>{p.cargo} · Exemplo</small>
                </div>
              </div>
              <p>
                {i === 0
                  ? "Qual foi o melhor conselho que você recebeu no começo da carreira? O meu foi: não espere saber tudo para compartilhar o que já sabe. 💜"
                  : "Tem algum conhecimento que parece simples para você, mas faria diferença na rotina de outra pessoa? Vamos fazer esse saber circular! ✨"}
              </p>
              <div className="community-post-actions">
                <button
                  aria-label={`Curtir publicação de ${p.nome}`}
                  aria-pressed={curtidas.includes(id)}
                  onClick={() =>
                    setCurtidas((s) =>
                      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
                    )
                  }
                >
                  <Heart
                    size={15}
                    fill={curtidas.includes(id) ? "currentColor" : "none"}
                  />
                  {(i === 0 ? 12 : 8) + Number(curtidas.includes(id))}
                </button>
                <button
                  onClick={() =>
                    toast.info(
                      "As conversas completas estarão disponíveis na integração real. Nesta apresentação, experimente o chat simulado.",
                    )
                  }
                >
                  <MessageCircle size={15} />
                  Conversar sobre isso
                </button>
              </div>
            </article>
          );
        })}
      </>
    );
  }
  const lista = comunidadesDemo.filter(
    (c) =>
      (filtro === "explorar" || state.comunidades.includes(c.id)) &&
      `${c.nome} ${c.descricao}`.toLowerCase().includes(busca.toLowerCase()),
  );
  return (
    <>
      <span className="eyebrow" style={{ paddingTop: 16 }}>
        Encontre a sua turma
      </span>
      <h1 className="page-title">
        Muitas vozes.
        <br />
        Uma rede<span style={{ color: "#a080c9" }}>.</span>
      </h1>
      <p className="page-subtitle">
        Interesses em comum. Experiências para somar.
      </p>
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Buscar comunidades"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Explore um interesse ou comunidade"
        />
      </label>
      <div className="tabs-list" role="group" aria-label="Filtrar comunidades">
        <button
          className="tabs-trigger"
          data-state={filtro === "explorar" ? "active" : "inactive"}
          aria-pressed={filtro === "explorar"}
          onClick={() => setFiltro("explorar")}
        >
          Explorar a rede
        </button>
        <button
          className="tabs-trigger"
          data-state={filtro === "minhas" ? "active" : "inactive"}
          aria-pressed={filtro === "minhas"}
          onClick={() => setFiltro("minhas")}
        >
          Minhas comunidades ({state.comunidades.length})
        </button>
      </div>
      {lista.map((c) => {
        const Icon = icons[c.icon];
        const membro = state.comunidades.includes(c.id);
        return (
          <article className="community-card" key={c.id}>
            <div className={`community-cover ${c.cor}`}>
              <span className="icon-tile">
                <Icon size={25} strokeWidth={1.4} />
              </span>
              <span className="tag" style={{ background: "#ffffff80" }}>
                {c.tag}
              </span>
            </div>
            <div className="community-body">
              <button
                style={{ padding: 0, background: "none", textAlign: "left" }}
                onClick={() => setSelecionada(c.id)}
              >
                <h2>{c.nome}</h2>
              </button>
              <p>{c.descricao}</p>
              <div className="community-bottom">
                <span className="community-members">
                  <span className="avatar-stack">
                    {c.avatares.map((slug) => (
                      <Avatar
                        key={slug}
                        nome={slug}
                        src={`/avatars/${slug}.svg`}
                        size={22}
                      />
                    ))}
                  </span>
                  {c.membros + Number(membro)} mulheres
                </span>
                <Button
                  variant={membro ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => toggle(c.id)}
                >
                  {membro ? (
                    <>
                      <Check size={12} />
                      Participando
                    </>
                  ) : (
                    "Fazer parte"
                  )}
                </Button>
              </div>
              <button
                className="text-link"
                style={{ marginTop: 16 }}
                onClick={() => setSelecionada(c.id)}
              >
                Ver a comunidade
                <ArrowUpRight size={12} />
              </button>
            </div>
          </article>
        );
      })}
      {!lista.length && (
        <div className="empty-state">
          <UsersRound size={26} />
          <h3>A sua comunidade está por aí</h3>
          <p>
            {filtro === "minhas"
              ? "Explore a rede e faça parte das conversas que combinam com você."
              : "Tente buscar por tecnologia, liderança ou campo."}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setBusca("");
              setFiltro("explorar");
            }}
          >
            Explorar todas
          </Button>
        </div>
      )}
    </>
  );
}
