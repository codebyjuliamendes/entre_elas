"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Pencil,
  CheckCircle2,
  Heart,
  Bookmark,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ana, perfisDemo, ANA_ID } from "@/lib/demo/catalogo";
import { useDemo, atualizarDemo, reiniciarJornada } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function ProfileScreen({ slug }: { slug?: string }) {
  const state = useDemo();
  const perfil = perfisDemo.find((p) => p.slug === slug) ?? ana;
  const proprio = perfil.id === ANA_ID;
  const posts = state.publicacoes.filter((p) => p.perfil_id === perfil.id);
  const [editando, setEditando] = useState(false);
  const [bio, setBio] = useState("");
  const [saberes, setSaberes] = useState("");
  function salvar(event: FormEvent) {
    event.preventDefault();
    const lista = [
      ...new Set(
        saberes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (!bio.trim() || lista.length > 15 || lista.some((s) => s.length > 80)) {
      toast.error(
        "Preencha a bio e use até 15 saberes com até 80 caracteres cada.",
      );
      return;
    }
    atualizarDemo((s) => ({
      ...s,
      perfil: { bio: bio.trim(), saberes: lista },
    }));
    setEditando(false);
    toast.success("Seu perfil da apresentação foi atualizado.");
  }
  return (
    <>
      <span className="eyebrow" style={{ paddingTop: 13 }}>
        {proprio
          ? "Sua história tem muito a ensinar"
          : "Conheça quem faz parte da rede"}
      </span>
      <div className="profile-cover" />
      <div className="profile-avatar-row">
        <Avatar nome={perfil.nome} src={perfil.avatar} size={93} />
        {proprio ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBio(state.perfil.bio);
              setSaberes(state.perfil.saberes.join(", "));
              setEditando(true);
            }}
          >
            <Pencil size={12} />
            Editar perfil
          </Button>
        ) : (
          <span className="pill">
            <Sparkles size={11} />
            Saber que conecta
          </span>
        )}
      </div>
      <section className="profile-info">
        <h1>{perfil.nome}</h1>
        <p className="profile-role">
          {perfil.cargo} · {perfil.regional}
        </p>
        <p
          className="match-location"
          style={{ justifyContent: "flex-start", marginTop: 9 }}
        >
          <MapPin size={11} />
          {perfil.cidade}
        </p>
        <p className="profile-bio">{proprio ? state.perfil.bio : perfil.bio}</p>
        <div className="profile-stats">
          <div className="profile-stat">
            <strong>
              {
                state.convites.filter(
                  (c) =>
                    c.status === "realizada" &&
                    (proprio || c.perfil_id === perfil.id),
                ).length
              }
            </strong>
            <span>Faíscas realizadas</span>
          </div>
          <div className="profile-stat">
            <strong>
              {(proprio ? state.perfil.saberes : perfil.saberes).length +
                new Set(posts.map((p) => p.saber_reconhecido)).size}
            </strong>
            <span>Saberes na rede</span>
          </div>
          <div className="profile-stat">
            <strong>{posts.length}</strong>
            <span>Dicas compartilhadas</span>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <h2>O que eu compartilho</h2>
        <span className="tag">Declarados por mim</span>
      </div>
      <div className="skill-chips">
        {(proprio ? state.perfil.saberes : perfil.saberes).map((s) => (
          <span className="skill-chip" key={s}>
            {s}
          </span>
        ))}
      </div>
      <div className="section-heading">
        <h2 style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Sparkles size={17} color="#b590cf" />
          Reconhecidos pela rede
        </h2>
      </div>
      <p className="input-hint">
        Saberes que outras mulheres descobriram em uma troca com{" "}
        {proprio ? "você" : perfil.nome.split(" ")[0]}.
      </p>
      {posts.length ? (
        posts.map((p) => (
          <article className="recognized-card" key={p.id}>
            <h3>
              <Sparkles size={15} />
              {p.saber_reconhecido}
            </h3>
            <p>{p.dica}</p>
            <div className="recognized-meta">
              <Avatar nome={ana.nome} src={ana.avatar} size={21} />
              <span>Reconhecido por Ana em uma Faísca</span>
              <CheckCircle2 size={12} />
            </div>
            <span className="tag" style={{ marginTop: 12 }}>
              Autorizado pelas duas · demonstração
            </span>
          </article>
        ))
      ) : (
        <div className="recognized-card">
          <h3>
            <Heart size={16} />
            Seu saber pode inspirar alguém
          </h3>
          <p>
            {proprio
              ? "Uma Faísca é uma oportunidade para compartilhar o que você viveu. Novos reconhecimentos aparecem aqui depois da autorização das duas participantes."
              : `Que tal descobrir o que ${perfil.nome.split(" ")[0]} pode compartilhar? Os aprendizados da conversa ganham espaço aqui com a autorização das duas.`}
          </p>
          <Button
            asChild
            variant="secondary"
            size="sm"
            style={{ marginTop: 13 }}
          >
            <Link href="/">Começar uma Faísca</Link>
          </Button>
        </div>
      )}
      {proprio && (
        <>
          <div className="section-heading" style={{ marginTop: 27 }}>
            <h2 style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Bookmark size={15} />
              Seus aprendizados salvos
            </h2>
          </div>
          {state.salvos.length ? (
            state.salvos.map((s) => (
              <div
                className="card"
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: "#775c88",
                }}
                key={s}
              >
                {s}
              </div>
            ))
          ) : (
            <p className="input-hint">
              Salve as dicas que você quer revisitar. Elas ficam neste
              dispositivo.
            </p>
          )}
          <button
            className="text-link"
            style={{ marginTop: 25 }}
            onClick={() => {
              reiniciarJornada();
              toast.success(
                "Jornada reiniciada. Dicas publicadas e comunidades foram preservadas.",
              );
            }}
          >
            <RotateCcw size={12} />
            Recomeçar minha jornada
          </button>
        </>
      )}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogTitle>Seu jeito de se apresentar</DialogTitle>
          <DialogDescription>
            Conte um pouco sobre você nesta demonstração. Use apenas informações
            fictícias.
          </DialogDescription>
          <form onSubmit={salvar}>
            <label className="form-label" htmlFor="bio">
              Minha história
            </label>
            <textarea
              id="bio"
              rows={4}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <label
              className="form-label"
              htmlFor="saberes"
              style={{ marginTop: 18 }}
            >
              Saberes que compartilho
            </label>
            <input
              id="saberes"
              value={saberes}
              onChange={(e) => setSaberes(e.target.value)}
              maxLength={1200}
            />
            <p className="input-hint">
              Separe os saberes por vírgula. Até 15, com até 80 caracteres cada.
            </p>
            <Button
              className="full-width"
              type="submit"
              style={{ marginTop: 19 }}
            >
              Salvar meu perfil
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
