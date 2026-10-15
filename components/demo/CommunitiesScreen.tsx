"use client";
import { useState, type FormEvent } from "react";
import {
  Search,
  Code2,
  Sparkles,
  Zap,
  Heart,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Plus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { comunidadesDemo } from "@/lib/demo/catalogo";
import { useDemo, alternarLista, criarPostDemo } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
import { postsIniciais } from "@/lib/demo/conteudo";
import { CommunityPost } from "./CommunityPost";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
const icons = { code: Code2, sparkles: Sparkles, zap: Zap, heart: Heart };
export function CommunitiesScreen() {
  const state = useDemo();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"explorar" | "minhas">("explorar");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [escrevendo, setEscrevendo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  function publicar(e: FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 5 || corpo.trim().length < 10) {
      toast.error("Use pelo menos 5 caracteres no título e 10 no texto.");
      return;
    }
    try {
      criarPostDemo({ comunidade_id: selecionada, titulo, corpo });
      setEscrevendo(false);
      setTitulo("");
      setCorpo("");
      toast.success("Sua publicação foi salva nesta demonstração.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível publicar.",
      );
    }
  }

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
        {membro && (
          <Button
            className="full-width"
            style={{ margin: "16px 0" }}
            onClick={() => setEscrevendo(true)}
          >
            <Plus size={17} />
            Compartilhar uma experiência
          </Button>
        )}
        <div className="posts-feed">
          {[...state.posts, ...postsIniciais]
            .filter((p) => p.comunidade_id === comunidade.id)
            .map((post) => (
              <CommunityPost key={post.id} post={post} />
            ))}
        </div>
        <Dialog open={escrevendo} onOpenChange={setEscrevendo}>
          <DialogContent>
            <DialogTitle>Seu saber pode abrir caminhos</DialogTitle>
            <DialogDescription>
              Compartilhe uma experiência fictícia com a comunidade. A
              publicação fica apenas neste dispositivo.
            </DialogDescription>
            <form onSubmit={publicar}>
              <label className="form-label" htmlFor="post-titulo">
                Título da publicação
              </label>
              <input
                id="post-titulo"
                value={titulo}
                maxLength={160}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
              <label
                className="form-label"
                htmlFor="post-corpo"
                style={{ marginTop: 17 }}
              >
                O que você quer compartilhar?
              </label>
              <textarea
                id="post-corpo"
                value={corpo}
                maxLength={5000}
                rows={6}
                onChange={(e) => setCorpo(e.target.value)}
                required
              />
              <Button
                className="full-width"
                style={{ marginTop: 18 }}
                type="submit"
              >
                Publicar na comunidade
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
      <div className="communities-grid">
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
      </div>
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
