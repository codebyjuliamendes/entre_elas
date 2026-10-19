"use client";
import { IconeFaisca } from "@/components/Marca";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ArrowUpRight,
  MessageCircle,
  X,
} from "lucide-react";
import { perfisDemo } from "@/lib/demo/catalogo";
import { filtrarPessoas } from "@/lib/demo/descoberta";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
export function PeopleScreen() {
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("todas");
  const [regional, setRegional] = useState("todas");
  const pessoas = filtrarPessoas({ busca, area, regional });
  const areas = [...new Set(perfisDemo.slice(1).map((p) => p.area))].sort();
  const regionais = [
    ...new Set(perfisDemo.slice(1).map((p) => p.regional)),
  ].sort();
  const filtrado = !!busca || area !== "todas" || regional !== "todas";
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">O conhecimento já está entre nós</span>
        <h1 className="page-title">
          Encontre quem
          <br />
          abre novos caminhos.
        </h1>
        <p className="page-subtitle">
          Explore experiências, áreas e regionais. Sua próxima conexão pode
          estar mais perto do que você imagina.
        </p>
      </div>
      <div className="discovery-toolbar">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Buscar pessoas e saberes"
            placeholder="Nome, habilidade ou assunto"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
        <div className="filter-row">
          <SlidersHorizontal size={15} />
          <label>
            <span className="sr-only">Filtrar por área</span>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="todas">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por regional</span>
            <select
              value={regional}
              onChange={(e) => setRegional(e.target.value)}
            >
              <option value="todas">Todas as regionais</option>
              {regionais.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="section-heading">
        <h2>
          {pessoas.length} conexão{pessoas.length === 1 ? "" : "ões"} para
          explorar
        </h2>
        {filtrado && (
          <button
            className="text-link"
            onClick={() => {
              setBusca("");
              setArea("todas");
              setRegional("todas");
            }}
          >
            <X size={13} />
            Limpar
          </button>
        )}
      </div>
      <div className="people-grid">
        {pessoas.map((p) => (
          <article className="expert-card" key={p.id}>
            <div className={`expert-cover ${p.cor}`}>
              <IconeFaisca size={42} strokeWidth={0.8} />
              <span className="pill">{p.area}</span>
            </div>
            <div className="expert-content">
              <Avatar nome={p.nome} src={p.avatar} size={68} />
              <h2>{p.nome}</h2>
              <p>
                {p.cargo} · {p.area}
              </p>
              <small>
                <MapPin size={11} />
                {p.cidade} · {p.regional}
              </small>
              <div className="tags">
                {p.saberes.slice(0, 2).map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <blockquote>“{p.evidencia}”</blockquote>
              <div className="expert-actions">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/perfil?usuaria=${p.slug}`}>
                    Conhecer
                    <ArrowUpRight size={13} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/chats?com=${p.slug}`}>
                    <MessageCircle size={13} />
                    Conversar
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!pessoas.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>Ainda não encontramos esse saber</h3>
          <p>
            Tente um termo mais simples ou amplie os filtros. Novas perspectivas
            começam com novas perguntas.
          </p>
        </div>
      )}
    </>
  );
}
