"use client";
import { useEffect, useState } from "react";
import type { Faisca } from "@/lib/schemas/entities";
import type { DadosPiloto } from "@/lib/piloto/dados";
import { orientarFaisca } from "@/lib/domain/faisca-orientacao";
import { api, dataHora } from "@/lib/piloto/browser";
import { calendarioFaisca } from "@/lib/domain/faisca-calendario";
import { baixarArquivo } from "@/lib/browser/arquivo";
import { toast } from "sonner";
export function Encontro({
  faisca: f,
  dados: d,
  atualizar,
  voltar,
}: {
  faisca: Faisca;
  dados: DadosPiloto;
  atualizar: () => Promise<void>;
  voltar: () => void;
}) {
  const [notas, setNotas] = useState(f.anotacoes[d.perfil.id] ?? ""),
    [texto, setTexto] = useState(""),
    [mensagens, setMensagens] = useState<
      { id: string; texto: string; autora_id: string; created_at: string }[]
    >([]),
    [busy, setBusy] = useState(false),
    [video, setVideo] = useState<string | null>(null),
    [manual, setManual] = useState(""),
    [editando, setEditando] = useState(false),
    [revisao, setRevisao] = useState(""),
    [chatErro, setChatErro] = useState(""),
    [utilidade, setUtilidade] = useState(0),
    [voltaria, setVoltaria] = useState<boolean | null>(null);
  const pid = d.perfil.id;
  const publicada = d.posts.some((p) => p.origem_faisca_id === f.id);
  const orientacao = orientarFaisca({
    encontro: f,
    usuaria_id: pid,
    publicada,
  });
  const nome = (id: string) =>
    d.pessoas.find((p) => p.id === id)?.nome ?? "Participante";
  useEffect(() => {
    let ativo = true;
    async function ler() {
      if (!["aceita", "realizada"].includes(f.status))
        return;
      try {
        const msgs = await api<typeof mensagens>("/api/piloto/mensagens", {
          faisca_id: f.id,
        });
        if (ativo) {
          setMensagens(msgs);
          setChatErro("");
        }
      } catch (e) {
        if (ativo)
          setChatErro(e instanceof Error ? e.message : "Chat indisponível.");
      }
    }
    void ler();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void ler();
    }, 10000);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [f.id, f.stream_channel_id, f.status]);
  async function acao(fn: () => Promise<unknown>, msg?: string) {
    setBusy(true);
    try {
      await fn();
      await atualizar();
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível concluir.",
      );
    } finally {
      setBusy(false);
    }
  }
  const operar = (acao: string, extras: Record<string, unknown> = {}) =>
    api(`/api/faiscas/${acao}`, { faisca_id: f.id, ...extras });
  return (
    <>
      <button onClick={voltar}>← Suas Faíscas</button>
      <h1>{f.tema}</h1>
      <p>
        {nome(f.solicitante_id)} e {nome(f.convidada_id)} · {f.status}
      </p>
      <p>
        {f.horario ? dataHora(f.horario) : "Escolha um dos horários propostos"}
      </p>
      <section className="pilot-card" aria-label="Próximo passo da Faísca">
        <span className="eyebrow">Seu próximo passo</span>
        <h2>{orientacao.titulo}</h2>
        <p>{orientacao.descricao}</p>
      </section>
      {f.status === "aceita" && f.horario && (
        <button
          onClick={() => {
            try {
              const arquivo = calendarioFaisca({
                encontro: f,
                usuaria_id: pid,
                origem: window.location.origin,
              });
              baixarArquivo(
                arquivo.nome,
                arquivo.conteudo,
                "text/calendar;charset=utf-8",
              );
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? e.message
                  : "Não foi possível exportar o calendário.",
              );
            }
          }}
        >
          Adicionar ao meu calendário
        </button>
      )}
      {f.status === "pendente" && (
        <section className="pilot-card">
          <h2>Um convite para trocar experiências</h2>
          <p>{f.pedido}</p>
          {pid === f.convidada_id ? (
            <>
              {f.horarios_propostos.map((h) => (
                <button
                  className="pilot-button"
                  disabled={busy || Date.parse(h) <= Date.parse(d.agora)}
                  key={h}
                  onClick={() =>
                    void acao(
                      () => operar("aceitar", { horario: h }),
                      "Convite aceito.",
                    )
                  }
                >
                  Aceitar · {dataHora(h)}
                </button>
              ))}
              {f.horarios_propostos.every(
                (h) => Date.parse(h) <= Date.parse(d.agora),
              ) && (
                <p role="status">
                  Os horários propostos já passaram. Peça à outra pessoa um novo
                  convite com horários futuros.
                </p>
              )}
              <button
                disabled={busy}
                onClick={() => void acao(() => operar("recusar"))}
              >
                Recusar convite
              </button>
            </>
          ) : (
            <p>
              Aguardando a resposta de {nome(f.convidada_id)}. Ela verá este
              convite ao entrar na própria conta.
            </p>
          )}
        </section>
      )}
      {f.status === "aceita" && (
        <>
          <section className="pilot-card">
            <h2>Vinte minutos com intenção</h2>
            <p>
              3 minutos para alinhar o desafio, 12 para trocar experiências, 5
              para combinar uma ação.
            </p>
            {f.pauta ? (
              <ol>
                {f.pauta.perguntas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            ) : (
              <p>
                A pauta de IA ainda não ficou disponível. Vocês podem começar
                pelo pedido e combinar o que querem levar da conversa.
              </p>
            )}
            {f.integracao_erros.length > 0 && (
              <p role="status">
                {f.integracao_erros.join(" ")} Seus dados estão salvos. Você
                pode tentar preparar os serviços novamente.
              </p>
            )}
            <button
              disabled={busy}
              onClick={() => void acao(() => operar("reprocessar"))}
            >
              Tentar preparar chat, sala e pauta novamente
            </button>
            <button
              className="pilot-button"
              disabled={busy || !f.daily_room_url}
              onClick={() =>
                void acao(async () => {
                  const sala = (await operar("video")) as {
                    url: string;
                    token: string;
                  };
                  const url = new URL(sala.url);
                  if (
                    url.protocol !== "https:" ||
                    !url.hostname.endsWith(".daily.co")
                  )
                    throw new Error("Endereço da sala inválido.");
                  url.searchParams.set("t", sala.token);
                  setVideo(url.href);
                })
              }
            >
              Entrar na chamada real
            </button>
          </section>
          {video && (
            <section className="pilot-card">
              <h2>Chamada privada</h2>
              <iframe
                className="pilot-video"
                title="Videochamada da Faísca"
                src={video}
                allow="camera; microphone; fullscreen; display-capture"
                referrerPolicy="no-referrer"
              />
              <button onClick={() => setVideo(null)}>Sair da chamada</button>
            </section>
          )}
        </>
      )}
      {["aceita", "realizada"].includes(f.status) && (
        <>
          <section className="pilot-card">
            <h2>Chat da Faísca</h2>
            {chatErro && <p role="status">{chatErro}</p>}
            {!["aceita", "realizada"].includes(f.status) ? (
              <p>O chat estará disponível após o aceite da Faísca.</p>
            ) : (
              <>
                <div className="pilot-messages" aria-live="polite">
                  {mensagens.length === 0 && (
                    <p>
                      A conversa começa com vocês. Nenhuma resposta automática
                      será enviada.
                    </p>
                  )}
                  {mensagens.map((m) => (
                    <article key={m.id}>
                      <strong>{nome(m.autora_id)}</strong>
                      <p>{m.texto}</p>
                      <small>{dataHora(m.created_at)}</small>
                    </article>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void acao(async () => {
                      await api("/api/piloto/enviar", {
                        faisca_id: f.id,
                        texto,
                      });
                      setTexto("");
                      setMensagens(
                        await api("/api/piloto/mensagens", { faisca_id: f.id }),
                      );
                    });
                  }}
                >
                  <label htmlFor="mensagem-real">Sua mensagem</label>
                  <textarea
                    id="mensagem-real"
                    required
                    maxLength={2000}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  <button
                    className="pilot-button"
                    disabled={busy || !texto.trim()}
                  >
                    Enviar mensagem
                  </button>
                </form>
                <p className="input-hint">
                  Mensagens ficam no Stream. Não são usadas para reconhecer
                  saberes.
                </p>
              </>
            )}
          </section>
        </>
      )}
      {f.status === "aceita" && (
        <section className="pilot-card">
          <h2>O que você aprendeu?</h2>
          <p>
            Registre apenas o que você deseja compartilhar nesta troca. Suas
            anotações podem ser vistas pela outra participante e apoiar a
            síntese.
          </p>
          <p id="notas-ajuda" className="input-hint">
            Dê um exemplo concreto e uma ação que deseja experimentar. A IA
            usará somente as anotações das duas pessoas; não acessa a gravação
            nem o chat.
          </p>
          <label htmlFor="notas-reais">Suas anotações</label>
          <textarea
            id="notas-reais"
            maxLength={5000}
            aria-describedby="notas-ajuda"
            placeholder="Aprendi que… Um exemplo foi… Meu próximo passo será…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <button
            className="pilot-button"
            disabled={busy || !notas.trim()}
            onClick={() =>
              void acao(
                () => operar("anotar", { texto: notas }),
                "Suas anotações foram salvas.",
              )
            }
          >
            Salvar minhas anotações
          </button>
          <p>
            {Object.keys(f.anotacoes).length} de 2 participantes já registraram
            anotações.
          </p>
          <button
            disabled={
              busy ||
              Object.keys(f.anotacoes).length !== 2 ||
              !d.conta.ia_consentimento
            }
            onClick={() => void acao(() => operar("concluir"))}
          >
            Concluir e sintetizar com IA
          </button>
          <label htmlFor="sintese-manual">
            Ou escreva uma síntese manual, para vocês revisarem
          </label>
          <textarea
            id="sintese-manual"
            maxLength={4000}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button
            disabled={
              busy ||
              manual.trim().length < 20 ||
              Object.keys(f.anotacoes).length !== 2
            }
            onClick={() =>
              void acao(() => operar("concluir-manual", { texto: manual }))
            }
          >
            Concluir com síntese manual
          </button>
          <p className="input-hint">
            A IA só recebe as anotações se as duas participantes autorizaram seu
            uso no perfil. Concluir não publica a dica.
          </p>
        </section>
      )}
      {f.status === "realizada" && (
        <section className="pilot-card" aria-labelledby="avaliar-faisca">
          <h2 id="avaliar-faisca">Como foi esta Faísca para você?</h2>
          {d.avaliadas.includes(f.id) ? (
            <p role="status">
              Obrigada! Sua avaliação entra apenas nos números agregados do
              piloto.
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!utilidade || voltaria === null) return;
                void acao(
                  () =>
                    api("/api/piloto/avaliar", {
                      faisca_id: f.id,
                      utilidade,
                      voltaria,
                    }),
                  "Avaliação registrada. Obrigada!",
                );
              }}
            >
              <p id="utilidade-rotulo">
                Quanto a conversa foi útil? (1 = pouco, 5 = muito)
              </p>
              <div
                className="pilot-escolhas"
                role="group"
                aria-labelledby="utilidade-rotulo"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={utilidade === n}
                    onClick={() => setUtilidade(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p id="voltaria-rotulo">Você faria outra Faísca?</p>
              <div
                className="pilot-escolhas"
                role="group"
                aria-labelledby="voltaria-rotulo"
              >
                {[
                  [true, "Sim"],
                  [false, "Ainda não"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={String(rotulo)}
                    type="button"
                    aria-pressed={voltaria === valor}
                    onClick={() => setVoltaria(valor as boolean)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
              <button
                className="pilot-button"
                disabled={busy || !utilidade || voltaria === null}
              >
                Enviar avaliação
              </button>
              <p className="input-hint">
                Opcional e sem texto livre. A outra participante não vê sua
                resposta.
              </p>
            </form>
          )}
        </section>
      )}
      {f.status === "realizada" && f.resumo && (
        <section className="pilot-card">
          <h2>{f.resumo.rascunho_dica.titulo}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {f.resumo.rascunho_dica.corpo}
          </p>
          {publicada ? (
            <p role="status">
              Esta dica já foi publicada com autorização das duas.
            </p>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => {
                  setRevisao(f.resumo!.rascunho_dica.corpo);
                  setEditando(true);
                }}
              >
                Revisar esta síntese
              </button>
              {f.publicacao_autorizada_por.includes(pid) && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void acao(() =>
                      operar("autorizar", {
                        resumo: f.resumo,
                        autorizado: false,
                      }),
                    )
                  }
                >
                  Retirar minha autorização
                </button>
              )}
              {editando && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void acao(async () => {
                      await operar("revisar", { texto: revisao });
                      setEditando(false);
                    }, "Síntese revisada. As duas pessoas precisam autorizar novamente.");
                  }}
                >
                  <label htmlFor="revisao-sintese">
                    Nova versão da síntese
                  </label>
                  <textarea
                    id="revisao-sintese"
                    required
                    minLength={20}
                    maxLength={4000}
                    value={revisao}
                    onChange={(e) => setRevisao(e.target.value)}
                  />
                  <button className="pilot-button" disabled={busy}>
                    Salvar revisão e revogar autorizações anteriores
                  </button>
                </form>
              )}
            </>
          )}
          <h3>Aprendizados da troca</h3>
          <ul>
            {f.resumo.aprendizados.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          {f.resumo.evidencias && f.resumo.evidencias.length > 0 && (
            <details className="pilot-card">
              <summary>Trechos usados pela IA nesta síntese</summary>
              <p>
                Estes trechos foram conferidos nas anotações. Revise se a
                interpretação representa o que vocês conversaram.
              </p>
              {f.resumo.evidencias.map((ev, i) => (
                <figure key={i}>
                  <figcaption>
                    {nome(ev.autora_id)} · aprendizado {ev.aprendizado + 1}
                  </figcaption>
                  <blockquote>{ev.trecho}</blockquote>
                </figure>
              ))}
            </details>
          )}
          <h3>Próximos passos</h3>
          <ul>
            {f.resumo.proximos_passos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p>
            Revise o conteúdo antes de autorizar. Caso não represente a
            conversa, não autorize a publicação.
          </p>
          <p>
            {f.publicacao_autorizada_por.length} de 2 autorizações. Cada pessoa
            decide na própria conta.
          </p>
          <button
            disabled={
              busy || publicada || f.publicacao_autorizada_por.includes(pid)
            }
            onClick={() =>
              void acao(() => operar("autorizar", { resumo: f.resumo }))
            }
          >
            {f.publicacao_autorizada_por.includes(pid)
              ? "Você autorizou"
              : "Autorizo publicar esta dica"}
          </button>
          <button
            className="pilot-button"
            disabled={
              busy || publicada || f.publicacao_autorizada_por.length !== 2
            }
            onClick={() =>
              void acao(
                () => operar("publicar"),
                "Dica publicada com autorização das duas.",
              )
            }
          >
            Publicar dica na rede
          </button>
          {d.conta.ia_consentimento && (
            <button
              disabled={busy || f.publicacao_autorizada_por.length !== 2}
              onClick={() =>
                void acao(
                  () => api("/api/piloto/reconhecer", { faisca_id: f.id }),
                  "Saberes extraídos. Cada pessoa poderá confirmar os seus no perfil.",
                )
              }
            >
              Reconhecer saberes desta troca com IA
            </button>
          )}
        </section>
      )}
      {["cancelada", "realizada"].includes(f.status) && f.daily_room_url && (
        <section className="pilot-card">
          <p role="status">
            O encerramento da sala ainda não foi confirmado pelo provedor. Tente
            novamente.
          </p>
          <button
            disabled={busy}
            onClick={() => void acao(() => operar("fechar-video"))}
          >
            Tentar encerrar acesso à sala
          </button>
        </section>
      )}
      {["pendente", "aceita"].includes(f.status) && (
        <button
          disabled={busy}
          onClick={() => {
            if (confirm("Cancelar esta Faísca para as duas participantes?"))
              void acao(() => operar("cancelar"));
          }}
        >
          Cancelar Faísca
        </button>
      )}
    </>
  );
}
