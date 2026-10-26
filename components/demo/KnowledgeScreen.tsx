"use client";
import { IconeFaisca } from "@/components/Marca";
import Link from "next/link";
import { useState } from "react";
import {
  Bookmark,
  Heart,
  Search,
  ArrowUpRight,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { dicasIniciais } from "@/lib/demo/conteudo";
import { obterPerfilDemo } from "@/lib/demo/catalogo";
import { useDemo, alternarLista } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Quiz } from "./Quiz";
import { normalizar } from "@/lib/demo/descoberta";
export function KnowledgeScreen() {
  const state = useDemo();
  const [busca, setBusca] = useState("");
  const [salvos, setSalvos] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const dicas = [
    ...state.publicacoes.map((p) => ({ ...p, categoria: "Da sua rede" })),
    ...dicasIniciais,
  ];
  const lista = dicas.filter(
    (d) =>
      (!salvos ||
        state.salvos.includes(d.id) ||
        state.salvos.includes(d.titulo)) &&
      normalizar(`${d.titulo} ${d.dica} ${d.saber_reconhecido}`).includes(
        normalizar(busca),
      ),
  );
  const dica = dicas.find((d) => d.id === selecionada);
  async function compartilhar(titulo: string) {
    const url = new URL("/saberes", window.location.origin).href;
    try {
      if (navigator.share)
        await navigator.share({
          title: titulo,
          text: `${titulo} · Tecida`,
          url,
        });
      else {
        await navigator.clipboard.writeText(`${titulo}\n${url}`);
        toast.success(
          "Link da biblioteca copiado. Dicas locais não são sincronizadas entre dispositivos.",
        );
      }
    } catch {
      toast.info(
        "Você pode compartilhar o endereço da biblioteca pelo navegador.",
      );
    }
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">O que uma aprende, a rede inteira ganha</span>
        <h1 className="page-title">
          Saberes que
          <br />
          merecem circular.
        </h1>
        <p className="page-subtitle">
          Pequenos aprendizados para grandes próximos passos. Guarde uma ideia,
          experimente e compartilhe.
        </p>
      </div>
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Buscar dicas e saberes"
          placeholder="Qual conhecimento você quer explorar?"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>
      <div className="tabs-list" role="group" aria-label="Filtrar biblioteca">
        <button
          className="tabs-trigger"
          data-state={!salvos ? "active" : "inactive"}
          aria-pressed={!salvos}
          onClick={() => setSalvos(false)}
        >
          Para descobrir
        </button>
        <button
          className="tabs-trigger"
          data-state={salvos ? "active" : "inactive"}
          aria-pressed={salvos}
          onClick={() => setSalvos(true)}
        >
          <Bookmark size={12} />
          Meus salvos ({state.salvos.length})
        </button>
      </div>
      <div className="knowledge-grid">
        {lista.map((d) => {
          const p = obterPerfilDemo(d.perfil_id);
          const salvo =
            state.salvos.includes(d.id) || state.salvos.includes(d.titulo);
          return (
            <article className="knowledge-card" key={d.id}>
              <div className="knowledge-top">
                <span className="pill">
                  <IconeFaisca size={11} />
                  {d.categoria}
                </span>
                <button
                  className="icon-action"
                  aria-label={`${salvo ? "Remover dos salvos" : "Salvar dica"}: ${d.titulo}`}
                  aria-pressed={salvo}
                  onClick={() => {
                    if (state.salvos.includes(d.titulo))
                      alternarLista("salvos", d.titulo);
                    else alternarLista("salvos", d.id);
                  }}
                >
                  <Bookmark size={18} fill={salvo ? "currentColor" : "none"} />
                </button>
              </div>
              <button
                className="knowledge-title"
                onClick={() => setSelecionada(d.id)}
              >
                <h2>{d.titulo}</h2>
              </button>
              <p>{d.dica}</p>
              <div className="knowledge-author">
                <Avatar nome={p.nome} src={p.avatar} size={31} />
                <div>
                  <strong>{p.nome}</strong>
                  <small>
                    {d.fonte === "ia"
                      ? "IA com dados fictícios"
                      : "Dica da demonstração"}
                  </small>
                </div>
              </div>
              <div className="knowledge-actions">
                <button
                  aria-label={`Curtir dica: ${d.titulo}`}
                  aria-pressed={state.curtidas.includes(d.id)}
                  onClick={() => alternarLista("curtidas", d.id)}
                >
                  <Heart
                    size={16}
                    fill={
                      state.curtidas.includes(d.id) ? "currentColor" : "none"
                    }
                  />
                  {state.curtidas.includes(d.id)
                    ? "Você curtiu"
                    : "Gostei dessa ideia"}
                </button>
                <button
                  aria-label={`Compartilhar dica: ${d.titulo}`}
                  onClick={() => void compartilhar(d.titulo)}
                >
                  <Share2 size={16} />
                </button>
              </div>
              <button
                className="text-link"
                onClick={() => setSelecionada(d.id)}
              >
                Ler e colocar em prática
                <ArrowUpRight size={12} />
              </button>
            </article>
          );
        })}
      </div>
      {!lista.length && (
        <div className="empty-state">
          <Bookmark size={28} />
          <h3>
            {salvos
              ? "Seu próximo aprendizado pode ficar aqui"
              : "Vamos ampliar essa busca?"}
          </h3>
          <p>
            {salvos
              ? "Toque no marcador de uma dica para voltar a ela quando precisar."
              : "Experimente procurar por apresentações, dados ou mentoria."}
          </p>
        </div>
      )}
      <Dialog
        open={!!dica}
        onOpenChange={(open) => {
          if (!open) setSelecionada(null);
        }}
      >
        <DialogContent>
          {dica && (
            <>
              <span className="eyebrow">Uma ideia para levar adiante</span>
              <DialogTitle>{dica.titulo}</DialogTitle>
              <DialogDescription>
                Conteúdo de demonstração, com dados fictícios.
              </DialogDescription>
              <p className="article-text">{dica.dica}</p>
              <span className="tag">{dica.saber_reconhecido}</span>
              {"perguntas" in dica && <Quiz perguntas={dica.perguntas} />}
              <Button
                asChild
                variant="secondary"
                className="full-width"
                style={{ marginTop: 20 }}
              >
                <Link
                  href={`/perfil?usuaria=${obterPerfilDemo(dica.perfil_id).slug}`}
                >
                  Conhecer quem compartilhou
                  <ArrowUpRight size={14} />
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
