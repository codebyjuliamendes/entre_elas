"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api, dataHora } from "@/lib/piloto/browser";
import {
  resumoParaApresentacao,
  type IndicadoresPiloto,
} from "@/lib/piloto/metricas";
const pct = (v: number | null) =>
  v === null ? "—" : `${String(v).replace(".", ",")}%`;
function Card({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string | number;
  nota?: string;
}) {
  return (
    <article className="pilot-card pilot-metrica">
      <h2>{titulo}</h2>
      <strong>{valor}</strong>
      {nota && <p className="input-hint">{nota}</p>}
    </article>
  );
}
export function PainelLideranca() {
  const [m, setM] = useState<IndicadoresPiloto | null>(null),
    [busy, setBusy] = useState(false);
  async function atualizar() {
    setBusy(true);
    try {
      setM(await api<IndicadoresPiloto>("/api/piloto/indicadores", {}));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function copiar() {
    if (!m) return;
    try {
      await navigator.clipboard.writeText(resumoParaApresentacao(m));
      toast.success("Resumo copiado com os números reais do piloto.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }
  return (
    <>
      <h1>O que a banca construiu</h1>
      <div className="pilot-actions">
        <button className="pilot-button" disabled={busy} onClick={atualizar}>
          Atualizar dados reais do piloto
        </button>
        {m && (
          <button disabled={busy} onClick={copiar}>
            Copiar resumo para a apresentação
          </button>
        )}
      </div>
      {m && (
        <>
          <p>{m.inicio ? `Desde ${dataHora(m.inicio)}` : "Piloto sem contas."}</p>
          <h2>Funil da Faísca</h2>
          <div className="pilot-grid">
            <Card
              titulo="Participantes"
              valor={m.participantes}
              nota={`${m.perfis_completos} com perfil completo`}
            />
            <Card titulo="Convites enviados" valor={m.convites} />
            <Card
              titulo="Convites aceitos"
              valor={m.aceitas}
              nota={`Taxa de aceite ${pct(m.taxa_aceite)} entre respondidos`}
            />
            <Card titulo="Faíscas realizadas" valor={m.realizadas} />
          </div>
          <h2>Conexões que não aconteceriam sozinhas</h2>
          <div className="pilot-grid">
            <Card
              titulo="Pessoas conectadas"
              valor={m.pessoas_conectadas}
              nota={`${m.pares_distintos} pares diferentes`}
            />
            <Card
              titulo="Entre regionais diferentes"
              valor={pct(m.entre_regionais)}
              nota="Das Faíscas aceitas ou realizadas"
            />
            <Card
              titulo="Entre áreas diferentes"
              valor={pct(m.entre_areas)}
              nota="Das Faíscas aceitas ou realizadas"
            />
          </div>
          <h2>Conhecimento que circulou</h2>
          <div className="pilot-grid">
            <Card
              titulo="Dicas publicadas"
              valor={m.dicas_publicadas}
              nota="Com autorização das duas participantes"
            />
            <Card titulo="Saberes reconhecidos" valor={m.saberes_reconhecidos} />
            <Card
              titulo="Utilidade média"
              valor={
                m.avaliacoes?.utilidade_media
                  ? `${String(m.avaliacoes.utilidade_media).replace(".", ",")}/5`
                  : "—"
              }
              nota={
                m.avaliacoes
                  ? `${m.avaliacoes.respostas} avaliações · ${pct(m.avaliacoes.voltariam)} fariam outra Faísca`
                  : "Avaliação pós-Faísca ainda não habilitada no banco"
              }
            />
          </div>
          <p className="input-hint">
            Somente contas do piloto; conteúdo do seed e demonstrações são
            excluídos. {m.inscricoes} inscrições em eventos (não representam
            presença) e {m.mensagens} mensagens contadas sem copiar seu
            conteúdo. Avaliações aparecem apenas agregadas.
          </p>
        </>
      )}
    </>
  );
}
