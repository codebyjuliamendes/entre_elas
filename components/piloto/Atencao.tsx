"use client";
import { IconeFaisca } from "@/components/Marca";
import { ArrowUpRight, Bell } from "lucide-react";
import type { DadosPiloto } from "@/lib/piloto/dados";
import { listarAtencaoFaiscas } from "@/lib/domain/faisca-atencao";
import { dataHora } from "@/lib/piloto/browser";

export function Atencao({ dados: d }: { dados: DadosPiloto }) {
  const publicadas = d.posts.flatMap((p) =>
    p.origem_faisca_id ? [p.origem_faisca_id] : [],
  );
  const itens = listarAtencaoFaiscas({
    encontros: d.faiscas,
    usuaria_id: d.perfil.id,
    publicadas,
  });
  const concluidas = d.faiscas.filter((f) => f.status === "realizada").length;
  const dicas = d.faiscas.filter((f) => publicadas.includes(f.id)).length;
  return (
    <section className="pilot-attention" aria-labelledby="atencao-titulo">
      <div className="pilot-attention-heading">
        <div>
          <span className="eyebrow">Sua rede em movimento</span>
          <h2 id="atencao-titulo">
            <Bell size={22} aria-hidden="true" /> O que merece sua atenção
          </h2>
        </div>
        <p className="pilot-impact">
          {concluidas}{" "}
          {concluidas === 1 ? "troca concluída" : "trocas concluídas"} · {dicas}{" "}
          {dicas === 1 ? "dica compartilhada" : "dicas compartilhadas"} por você
          e suas conexões
        </p>
      </div>
      <p role="status" className="input-hint">
        {itens.length
          ? `${itens.length} Faísca${itens.length === 1 ? "" : "s"} com um próximo passo para você.`
          : "Tudo em dia. Que tal começar uma nova troca?"}
      </p>
      <div className="pilot-grid">
        {itens.slice(0, 3).map((i) => (
          <a
            className="pilot-attention-item"
            key={i.faisca_id}
            href={`/piloto?aba=faiscas&encontro=${i.faisca_id}`}
          >
            <span className="eyebrow">
              {d.pessoas.find((p) => p.id === i.pessoa_id)?.nome ??
                "Participante"}
            </span>
            <strong>
              {i.titulo} <ArrowUpRight size={18} aria-hidden="true" />
            </strong>
            <span>{i.descricao}</span>
            {i.horario && <small>{dataHora(i.horario)} · Brasília</small>}
          </a>
        ))}
      </div>
      {itens.length > 3 && (
        <p className="input-hint">
          Mais {itens.length - 3} na lista de suas Faíscas abaixo.
        </p>
      )}
      {!itens.length && (
        <p>
          <IconeFaisca size={18} aria-hidden="true" /> Uma boa pergunta pode
          virar conhecimento para toda a rede.
        </p>
      )}
    </section>
  );
}
