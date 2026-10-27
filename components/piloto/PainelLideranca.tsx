"use client";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { api, dataHora, emDemonstracao } from "@/lib/piloto/browser";
import { baixarArquivo } from "@/lib/browser/arquivo";
import {
  planilhaIndicadores,
  resumoParaApresentacao,
  type IndicadoresPiloto,
} from "@/lib/piloto/metricas";
const pct = (v: number | null) =>
  v === null ? "—" : `${String(v).replace(".", ",")}%`;
function Kpi({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string | number;
  nota?: string;
}) {
  return (
    <article className="painel-kpi">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {nota && <small>{nota}</small>}
    </article>
  );
}
// Rosca em CSS: a fatia colorida é o percentual; vazio quando ainda não há dados.
function Rosca({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: number | null;
  nota: string;
}) {
  return (
    <article className="painel-grafico">
      <h3>{titulo}</h3>
      <div className="painel-rosca-linha">
        <div
          className="painel-rosca"
          style={{ "--valor": `${valor ?? 0}%` } as CSSProperties}
          role="img"
          aria-label={`${titulo}: ${pct(valor)}`}
        >
          <span>{pct(valor)}</span>
        </div>
        <p>{nota}</p>
      </div>
    </article>
  );
}
function Barras({
  titulo,
  itens,
  vazio,
  nota,
}: {
  titulo: string;
  itens: { rotulo: string; valor: number }[];
  vazio: string;
  nota?: string;
}) {
  const maior = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <article className="painel-grafico">
      <h3>{titulo}</h3>
      {itens.length ? (
        <ul className="painel-barras">
          {itens.map((i) => (
            <li key={i.rotulo}>
              <span>{i.rotulo}</span>
              <div>
                <i style={{ width: `${(100 * i.valor) / maior}%` }} />
              </div>
              <b>{i.valor}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="input-hint">{vazio}</p>
      )}
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
      toast.success(
        emDemonstracao()
          ? "Resumo copiado com os números de exemplo da demonstração."
          : "Resumo copiado com os números reais do piloto.",
      );
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }
  return (
    <section className="painel">
      <p className="painel-impressao">
        Tecida · Painel de liderança · gerado em{" "}
        {new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
      </p>
      <header className="painel-topo">
        <div>
          <h1>Painel de liderança</h1>
          <p>
            {emDemonstracao()
              ? "Números fictícios de exemplo"
              : "Dados agregados e anônimos"}
            {m?.inicio ? ` · desde ${dataHora(m.inicio)}` : ""}
          </p>
        </div>
        <div className="pilot-actions">
          <button className="pilot-button" disabled={busy} onClick={atualizar}>
            {emDemonstracao()
              ? "Ver números de exemplo"
              : "Atualizar dados reais do piloto"}
          </button>
          {m && (
            <button disabled={busy} onClick={copiar}>
              Copiar resumo para a apresentação
            </button>
          )}
          {m && (
            <button
              disabled={busy}
              onClick={() =>
                baixarArquivo(
                  `tecida-indicadores-${new Date().toISOString().slice(0, 10)}${emDemonstracao() ? "-exemplo" : ""}.csv`,
                  planilhaIndicadores(m),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Baixar planilha
            </button>
          )}
          {m && (
            <button disabled={busy} onClick={() => window.print()}>
              Salvar em PDF
            </button>
          )}
        </div>
      </header>
      {m && (
        <>
          <div className="painel-kpis">
            <Kpi
              titulo="Convites enviados"
              valor={m.convites}
              nota={`${m.participantes} participantes`}
            />
            <Kpi
              titulo="Taxa de aceite"
              valor={pct(m.taxa_aceite)}
              nota={`${m.aceitas} aceitos`}
            />
            <Kpi
              titulo="Faíscas realizadas"
              valor={m.realizadas}
              nota={`${m.pessoas_conectadas} pessoas conectadas`}
            />
            <Kpi
              titulo="Fariam outra Faísca"
              valor={pct(m.avaliacoes?.voltariam ?? null)}
              nota={
                m.avaliacoes?.utilidade_media
                  ? `Utilidade ${String(m.avaliacoes.utilidade_media).replace(".", ",")}/5`
                  : "Sem avaliações ainda"
              }
            />
          </div>
          <div className="painel-graficos">
            <Rosca
              titulo="Conexões entre regionais"
              valor={m.entre_regionais}
              nota={`Das Faíscas aceitas ou realizadas, quantas uniram regionais diferentes. ${m.pares_distintos} pares diferentes.`}
            />
            <Rosca
              titulo="Conexões entre áreas diferentes"
              valor={m.entre_areas}
              nota="Trocas que atravessaram áreas da empresa."
            />
            <Rosca
              titulo="Faíscas no horário de trabalho"
              valor={m.no_expediente}
              nota="De segunda a sexta, das 8h às 18h (Brasília). Networking que cabe na rotina, inclusive de quem cuida de alguém em casa."
            />
            <Barras
              titulo="Mapa de lacunas"
              itens={m.mapa.temas_sem_par.map((t) => ({
                rotulo: t.tema,
                valor: t.pessoas,
              }))}
              vazio="Nenhum tema procurado por duas ou mais pessoas está sem oferta."
              nota={`${m.mapa.objetivos_sem_par} de ${m.mapa.objetivos} objetivos de aprendizagem ainda sem ninguém que ofereça o tema.`}
            />
            <article className="painel-grafico">
              <h3>Saberes concentrados</h3>
              {m.mapa.concentrados.length ? (
                <ul className="painel-chips">
                  {m.mapa.concentrados.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="input-hint">
                  Nenhum saber depende de uma só pessoa.
                </p>
              )}
              <p className="input-hint">
                Conhecimento que só uma pessoa tem: risco de se perder.
              </p>
            </article>
            <Barras
              titulo="O que a rede mais oferece"
              itens={m.mapa.oferta.map((o) => ({
                rotulo: o.saber,
                valor: o.pessoas,
              }))}
              vazio="Ainda não há saberes declarados."
            />
            <article className="painel-grafico">
              <h3>Conhecimento que circulou</h3>
              <div className="painel-mini">
                <Kpi
                  titulo="Dicas publicadas"
                  valor={m.dicas_publicadas}
                  nota="Com autorização das duas"
                />
                <Kpi
                  titulo="Saberes reconhecidos"
                  valor={m.saberes_reconhecidos}
                />
              </div>
            </article>
          </div>
          <p className="input-hint">
            Somente contas do piloto; conteúdo de teste e demonstração é
            excluído. Objetivos individuais não são exibidos; temas só aparecem
            quando citados por duas ou mais pessoas. {m.inscricoes} inscrições
            em eventos e {m.mensagens} mensagens contadas sem copiar conteúdo.
          </p>
        </>
      )}
    </section>
  );
}
