"use client";
import { useState, type FormEvent } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { postComunidadeSchema } from "@/lib/demo/schemas";
import { obterPerfilDemo } from "@/lib/demo/catalogo";
import { useDemo, alternarLista, comentarDemo } from "@/lib/demo/store";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
export function CommunityPost({
  post,
}: {
  post: z.infer<typeof postComunidadeSchema>;
}) {
  const s = useDemo();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const autora = obterPerfilDemo(post.autora_id);
  const comentarios = s.comentarios.filter((c) => c.post_id === post.id);
  const membro = s.comunidades.includes(post.comunidade_id);
  function enviar(e: FormEvent) {
    e.preventDefault();
    try {
      comentarDemo({ post_id: post.id, corpo: texto });
      setTexto("");
      toast.success("Comentário salvo neste dispositivo.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível comentar.",
      );
    }
  }
  return (
    <article className="community-post">
      <div className="community-post-author">
        <Avatar nome={autora.nome} src={autora.avatar} size={35} />
        <div>
          <strong>{autora.nome}</strong>
          <small>{autora.cargo} · Demonstração</small>
        </div>
      </div>
      <h2 className="post-title">{post.titulo}</h2>
      <p className="post-body">{post.corpo}</p>
      <div className="community-post-actions">
        <button
          aria-label={`Curtir publicação: ${post.titulo}`}
          aria-pressed={s.curtidas.includes(post.id)}
          onClick={() => alternarLista("curtidas", post.id)}
        >
          <Heart
            size={16}
            fill={s.curtidas.includes(post.id) ? "currentColor" : "none"}
          />
          {s.curtidas.includes(post.id) ? "Você curtiu" : "Curtir"}
        </button>
        <button aria-expanded={aberto} onClick={() => setAberto((x) => !x)}>
          <MessageCircle size={16} />
          Comentários ({comentarios.length})
        </button>
      </div>
      {aberto && (
        <section
          className="comment-thread"
          aria-label={`Comentários: ${post.titulo}`}
        >
          {comentarios.length ? (
            comentarios.map((c) => (
              <div className="comment" key={c.id}>
                <Avatar
                  nome={obterPerfilDemo(c.autora_id).nome}
                  src={obterPerfilDemo(c.autora_id).avatar}
                  size={25}
                />
                <div>
                  <strong>{obterPerfilDemo(c.autora_id).nome}</strong>
                  <p>{c.corpo}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="input-hint">
              A próxima boa conversa pode começar com você.
            </p>
          )}
          {membro ? (
            <form className="comment-form" onSubmit={enviar}>
              <label className="sr-only" htmlFor={`comentario-${post.id}`}>
                Seu comentário
              </label>
              <input
                id={`comentario-${post.id}`}
                value={texto}
                maxLength={1500}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Compartilhe uma experiência fictícia…"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Enviar comentário"
                disabled={!texto.trim()}
              >
                <Send size={15} />
              </Button>
            </form>
          ) : (
            <p className="input-hint">
              Faça parte da comunidade para comentar.
            </p>
          )}
        </section>
      )}
    </article>
  );
}
