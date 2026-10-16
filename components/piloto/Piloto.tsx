"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { DadosPiloto } from "@/lib/piloto/dados";
import { prepararFoto } from "@/lib/demo/foto";
import { toast } from "sonner";
import { PerfilPiloto } from "./PerfilPiloto";
import { Encontro } from "./Encontro";
import { Atencao } from "./Atencao";
import { normalizarRetorno } from "@/lib/piloto/retorno";
import { useNavegacaoPiloto } from "@/lib/piloto/navegacao";
import { useOnline } from "@/lib/browser/conexao";
import { api, dataHora } from "@/lib/piloto/browser";
import Image from "next/image";
import { useRouter } from "next/navigation";
const sobreIA =
  "Ao autorizar, seus pedidos, objetivos, saberes e anotações de Faíscas poderão ser enviados ao Google Gemini e à Groq para sugestões, resumos e quizzes. O processamento e a retenção seguem as políticas desses provedores; no plano gratuito do Gemini, os dados podem ser usados para melhorar produtos. Não envie dados sensíveis, confidenciais ou de terceiros. Fotos e chat não alimentam o mapa de saberes. Você pode revogar esta autorização; isso impede novos envios, mas não apaga o que já foi processado pelos provedores.";
export function Piloto() {
  const router = useRouter();
  const online = useOnline();
  const { tab, encontro, setTab, setEncontro } = useNavegacaoPiloto();
  const atualizacao = useRef({ numero: 0 });
  const consultaPedido = useRef(0);
  const [buscou, setBuscou] = useState(false);
  const chaveConvite = useRef<{ assinatura: string; id: string } | null>(null);
  useEffect(() => {
    const login = () =>
      router.replace(
        "/entrar?retorno=" +
          encodeURIComponent(
            normalizarRetorno(
              window.location.pathname + window.location.search,
            ),
          ),
      );
    window.addEventListener("piloto:login", login);
    return () => window.removeEventListener("piloto:login", login);
  }, [router]);
  const [dados, setDados] = useState<DadosPiloto | null>(null),
    [erro, setErro] = useState(""),
    [busy, setBusy] = useState(false),
    [passo, setPasso] = useState(0),
    [pedido, setPedido] = useState(""),
    [indicacoes, setIndicacoes] = useState<
      { profile_id: string; motivo: string; evidencias: string[] }[]
    >([]),
    [destino, setDestino] = useState(""),
    [horario, setHorario] = useState(""),
    [metricas, setMetricas] = useState<Record<string, number | string> | null>(
      null,
    );
  const carregar = useCallback(async () => {
    const id = ++atualizacao.current.numero;
    try {
      const resposta = await api<DadosPiloto>("/api/piloto");
      if (id !== atualizacao.current.numero) return;
      setDados(resposta);
      setErro("");
    } catch (e) {
      if (id === atualizacao.current.numero)
        setErro(
          e instanceof Error ? e.message : "Sem conexão. Tente novamente.",
        );
    }
  }, []);
  useEffect(() => {
    const ciclo = atualizacao.current;
    const inicial = setTimeout(() => void carregar(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void carregar();
    }, 15000);
    return () => {
      ciclo.numero++;
      clearTimeout(inicial);
      clearInterval(t);
    };
  }, [carregar]);
  useEffect(() => {
    const atualizar = () => void carregar();
    window.addEventListener("online", atualizar);
    return () => window.removeEventListener("online", atualizar);
  }, [carregar]);
  async function executar(acao: () => Promise<unknown>, mensagem?: string) {
    setBusy(true);
    try {
      await acao();
      await carregar();
      if (mensagem) toast.success(mensagem);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível concluir.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!dados)
    return (
      <main className="pilot-login">
        <h1>Seu espaço Entre Elas</h1>
        <p role="status">{erro || "Buscando seus dados no servidor…"}</p>
        {erro && (
          <button className="pilot-button" onClick={() => void carregar()}>
            Tentar novamente
          </button>
        )}
      </main>
    );
  const d = dados;
  const perfil = d.perfil;
  const ativo = d.faiscas.find((f) => f.id === encontro);
  const pessoa = (id: string) =>
    d.pessoas.find((p) => p.id === id)?.nome ?? "Participante";
  function editarPedido(texto: string) {
    consultaPedido.current++;
    setPedido(texto);
    setIndicacoes([]);
    setBuscou(false);
  }
  async function buscarConexoes() {
    const consulta = ++consultaPedido.current;
    setIndicacoes([]);
    setBuscou(false);
    await executar(async () => {
      const resposta = await api<typeof indicacoes>("/api/faiscas/buscar", {
        pedido,
      });
      if (consulta !== consultaPedido.current) return;
      setIndicacoes(resposta);
      setBuscou(true);
    });
  }
  async function convidar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      const envio = {
        convidada_id: destino,
        pedido,
        tema: pedido.slice(0, 160),
        horarios_propostos: [new Date(horario).toISOString()],
      };
      const assinatura = JSON.stringify(envio);
      if (chaveConvite.current?.assinatura !== assinatura)
        chaveConvite.current = { assinatura, id: crypto.randomUUID() };
      await api("/api/faiscas", {
        ...envio,
        chave_pedido: chaveConvite.current.id,
      });
      chaveConvite.current = null;
      editarPedido("");
      setDestino("");
      setIndicacoes([]);
    }, "Convite enviado. A outra pessoa poderá responder na própria conta.");
  }
  const consentimento = (
    <section className="pilot-card">
      <h2>Você decide sobre a IA</h2>
      <p>{sobreIA}</p>
      <p>
        <a
          href="https://ai.google.dev/gemini-api/terms"
          target="_blank"
          rel="noreferrer"
        >
          Termos do Gemini
        </a>{" "}
        ·{" "}
        <a
          href="https://groq.com/privacy-policy/"
          target="_blank"
          rel="noreferrer"
        >
          Privacidade da Groq
        </a>
      </p>
      <label>
        <input
          type="checkbox"
          checked={d.conta.ia_consentimento}
          disabled={busy}
          onChange={(e) =>
            void executar(() =>
              api("/api/piloto/consentimento", {
                autorizado: e.target.checked,
              }),
            )
          }
        />{" "}
        Autorizo esse uso dos meus textos nesta experiência.
      </label>
      <p className="input-hint">
        Até 60 chamadas lógicas de IA por conta/dia, incluindo consultas ao
        cache; reinício à meia-noite UTC. A entrada manual continua disponível.
      </p>
    </section>
  );
  if (!d.conta.onboarding)
    return (
      <main className="pilot-welcome">
        <span className="eyebrow">Boas-vindas · {passo + 1} de 3</span>
        <h1>
          {
            [
              "Uma Faísca começa com uma pergunta",
              "Uma troca entre duas pessoas",
              "Seu perfil em um minuto",
            ][passo]
          }
        </h1>
        {passo === 0 ? (
          <>
            <p>
              Conte o que quer aprender. A curadoria pode encontrar alguém da
              banca com experiências ligadas ao seu desafio. Você também pode
              escolher uma pessoa diretamente.
            </p>
            <button className="pilot-button" onClick={() => setPasso(1)}>
              Entendi, vamos continuar
            </button>
          </>
        ) : passo === 1 ? (
          <>
            <p>
              Envie um convite, aguarde a resposta e reserve vinte minutos.
              Vocês poderão conversar por chat e vídeo. Depois, cada pessoa
              registra suas próprias anotações. Uma dica só fica pública quando
              ambas autorizarem.
            </p>
            <button className="pilot-button" onClick={() => setPasso(2)}>
              Montar meu perfil
            </button>
            <button onClick={() => setPasso(0)}>Voltar</button>
          </>
        ) : (
          <>
            {consentimento}
            <PerfilPiloto
              perfil={perfil}
              ia={d.conta.ia_consentimento}
              concluir={true}
              atualizar={carregar}
            />
          </>
        )}
      </main>
    );
  return (
    <div className="pilot-app">
      <header>
        <a href="/piloto" className="pilot-brand">
          entreelas.
        </a>
        <span>Piloto · dados salvos no servidor</span>
        <button
          disabled={busy}
          onClick={() =>
            void executar(async () => {
              await api("/api/auth/sair", {});
              router.replace("/entrar");
            })
          }
        >
          Sair
        </button>
      </header>
      <nav aria-label="Navegação do piloto">
        {[
          ["faiscas", "Faíscas"],
          ["rede", "Pessoas"],
          ["comunidades", "Comunidades"],
          ["saberes", "Saberes"],
          ["agenda", "Agenda"],
          ["perfil", "Meu perfil"],
          ...(d.lider ? [["lideranca", "Liderança"]] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => {
              setTab(key);
              setEncontro(null);
            }}
          >
            {label}
            {key === "faiscas" &&
            d.faiscas.some(
              (f) => f.status === "pendente" && f.convidada_id === perfil.id,
            )
              ? " · novo convite"
              : ""}
          </button>
        ))}
      </nav>
      <main>
        {!online && (
          <p role="status" className="pilot-card">
            Você está sem conexão. O que já foi salvo continua no servidor.
            Mantenha esta página aberta para preservar o que ainda está
            escrevendo; reconecte para salvar.
          </p>
        )}
        {encontro && !ativo && (
          <p role="status" className="pilot-card">
            Esta Faísca não está disponível para sua conta.{" "}
            <button onClick={() => setEncontro(null)}>
              Voltar para suas Faíscas
            </button>
          </p>
        )}
        {erro && (
          <p role="alert" className="pilot-card">
            {erro} Os dados já salvos continuam no servidor.{" "}
            <button onClick={() => void carregar()}>Atualizar</button>
          </p>
        )}
        {ativo ? (
          <Encontro
            key={ativo.id}
            faisca={ativo}
            dados={d}
            atualizar={carregar}
            voltar={() => setEncontro(null)}
          />
        ) : (
          <>
            {tab === "faiscas" && (
              <>
                <h1>
                  Qual é a sua próxima Faísca, {perfil.nome.split(" ")[0]}?
                </h1>
                <p>
                  Uma conversa de vinte minutos com alguém desta rede. O convite
                  depende da resposta da outra pessoa.
                </p>
                <Atencao dados={d} />
                <form
                  className="pilot-card"
                  onSubmit={convidar}
                  aria-busy={busy}
                >
                  <span className="eyebrow">
                    Comece uma troca de 20 minutos
                  </span>
                  <h2>Do seu desafio a uma conexão</h2>
                  <p>
                    Conte a situação, o que está difícil e o que quer levar da
                    conversa. Quanto mais concreto o pedido, mais útil a
                    curadoria.
                  </p>
                  <label htmlFor="pedido-real">O que você quer aprender?</label>
                  <textarea
                    id="pedido-real"
                    required
                    minLength={5}
                    maxLength={1500}
                    value={pedido}
                    aria-describedby="pedido-ajuda"
                    onChange={(e) => editarPedido(e.target.value)}
                  />
                  <p id="pedido-ajuda" className="input-hint">
                    Exemplo: “Vou apresentar indicadores à liderança e preciso
                    escolher três métricas. Quero sair com um roteiro de
                    apresentação.” Não inclua informações confidenciais.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      editarPedido(
                        perfil.objetivos[0]
                          ? `Quero aprender sobre ${perfil.objetivos[0]}. Quem pode trocar experiências comigo?`
                          : "Como posso compartilhar melhor uma ideia com minha equipe?",
                      )
                    }
                  >
                    Usar uma sugestão para começar
                  </button>
                  <div
                    className="pilot-actions"
                    aria-label="Exemplos de pedidos"
                  >
                    {[
                      [
                        "Comunicar uma ideia",
                        "Tenho uma ideia para melhorar a rotina da equipe e quero apresentar sem me perder nos detalhes. Como estruturar uma conversa de cinco minutos?",
                      ],
                      [
                        "Trabalhar com dados",
                        "Preciso acompanhar um projeto e tenho muitos dados disponíveis. Como escolher três indicadores que ajudem a decidir o próximo passo?",
                      ],
                      [
                        "Crescer na carreira",
                        "Quero me preparar para assumir mais responsabilidades. Como transformar minhas experiências em um plano de desenvolvimento com uma primeira ação?",
                      ],
                    ].map(([rotulo, exemplo]) => (
                      <button
                        key={rotulo}
                        type="button"
                        disabled={busy}
                        onClick={() => editarPedido(exemplo)}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pilot-button"
                    type="button"
                    disabled={
                      busy ||
                      !online ||
                      pedido.trim().length < 5 ||
                      !d.conta.ia_consentimento
                    }
                    onClick={() => void buscarConexoes()}
                  >
                    {busy ? "Aguarde…" : "Encontrar conexões com IA"}
                  </button>
                  {!d.conta.ia_consentimento && (
                    <p className="input-hint">
                      Você pode autorizar a IA no perfil ou escolher alguém
                      abaixo.
                    </p>
                  )}
                  <p className="input-hint">
                    A IA busca experiências nos perfis e saberes da rede e
                    explica cada indicação com evidências. É uma sugestão para
                    você avaliar; a conversa depende do aceite da outra pessoa.
                  </p>
                  {buscou && indicacoes.length === 0 && (
                    <p role="status" className="pilot-card">
                      Ainda não encontramos uma indicação para este pedido.
                      Tente descrever uma habilidade específica ou escolha uma
                      pessoa abaixo. A rede cresce conforme as participantes
                      completam e indexam seus perfis.
                    </p>
                  )}
                  {indicacoes.length > 0 && (
                    <section>
                      <h2>Conexões sugeridas</h2>
                      {indicacoes.map((i) => (
                        <article className="pilot-card" key={i.profile_id}>
                          <h3>{pessoa(i.profile_id)}</h3>
                          <p>{i.motivo}</p>
                          <span className="eyebrow">
                            Evidências usadas na indicação
                          </span>
                          {i.evidencias.map((ev) => (
                            <blockquote key={ev}>{ev}</blockquote>
                          ))}
                          <button
                            type="button"
                            onClick={() => setDestino(i.profile_id)}
                          >
                            {destino === i.profile_id
                              ? "Pessoa selecionada ✓"
                              : "Escolher esta pessoa"}
                          </button>
                        </article>
                      ))}
                    </section>
                  )}
                  <label htmlFor="destino-real">
                    Com quem você quer conversar?
                  </label>
                  <select
                    id="destino-real"
                    required
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  >
                    <option value="">Selecione uma participante</option>
                    {d.pessoas
                      .filter((p) => p.id !== perfil.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} · {p.area}
                        </option>
                      ))}
                  </select>
                  {d.pessoas.length < 2 && (
                    <p>
                      A rede está começando. Outra pessoa precisa entrar e
                      completar o perfil para vocês combinarem uma Faísca.
                    </p>
                  )}
                  <label htmlFor="horario-real">
                    Propor um horário no seu fuso local
                  </label>
                  <input
                    id="horario-real"
                    type="datetime-local"
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                  />
                  {destino && (
                    <p className="input-hint">
                      Convite para {pessoa(destino)} · 20 minutos. Depois de
                      enviar, a pessoa decide na própria conta.
                    </p>
                  )}
                  <button
                    className="pilot-button"
                    disabled={busy || !destino || !online}
                  >
                    Enviar convite
                  </button>
                </form>
                <h2>Suas Faíscas</h2>
                {d.faiscas.length === 0 && (
                  <p>Seus convites enviados e recebidos aparecerão aqui.</p>
                )}
                {d.faiscas.map((f) => (
                  <button
                    className="pilot-card pilot-encounter"
                    key={f.id}
                    onClick={() => setEncontro(f.id)}
                  >
                    <strong>
                      {pessoa(
                        f.solicitante_id === perfil.id
                          ? f.convidada_id
                          : f.solicitante_id,
                      )}
                    </strong>
                    <span>{f.tema}</span>
                    <span>
                      {f.status} ·{" "}
                      {dataHora(f.horario ?? f.horarios_propostos[0])}
                    </span>
                  </button>
                ))}
              </>
            )}
            {tab === "rede" && (
              <>
                <h1>Conheça quem está aqui</h1>
                <div className="pilot-grid">
                  {d.pessoas
                    .filter((p) => p.id !== perfil.id)
                    .map((p) => (
                      <article className="pilot-card" key={p.id}>
                        {d.fotos[p.id] && (
                          <Image
                            width={96}
                            height={96}
                            unoptimized
                            className="pilot-avatar"
                            src={d.fotos[p.id]!}
                            alt={`Foto de ${p.nome}`}
                          />
                        )}
                        <h2>{p.nome}</h2>
                        <p>
                          {p.cargo} · {p.regional}
                        </p>
                        <p>
                          Compartilha:{" "}
                          {p.interesses.join(", ") || "Perfil em construção"}
                        </p>
                        <p>Quer aprender: {p.objetivos.join(", ")}</p>
                        <button
                          onClick={() => {
                            setDestino(p.id);
                            setTab("faiscas");
                          }}
                        >
                          Convidar para uma Faísca
                        </button>
                      </article>
                    ))}
                </div>
              </>
            )}
            {(tab === "comunidades" || tab === "saberes") && (
              <Conteudo
                dados={d}
                atualizar={carregar}
                biblioteca={tab === "saberes"}
              />
            )}
            {tab === "agenda" && (
              <>
                <h1>Agenda da rede</h1>
                <p>
                  Horários exibidos em Brasília. Inscrição confirma interesse,
                  não presença realizada.
                </p>
                {d.eventos
                  .filter(
                    (e) => Date.parse(e.inicio) > Date.parse(dados!.agora),
                  )
                  .map((e) => (
                    <article className="pilot-card" key={e.id}>
                      <h2>{e.titulo}</h2>
                      <p>{dataHora(e.inicio)}</p>
                      <p>{e.descricao}</p>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void executar(() =>
                            api(
                              `/api/eventos/${d.inscricoes.includes(e.id) ? "cancelar" : "participar"}`,
                              { event_id: e.id },
                            ),
                          )
                        }
                      >
                        {d.inscricoes.includes(e.id)
                          ? "Cancelar minha inscrição"
                          : "Participar"}
                      </button>
                    </article>
                  ))}
                {!d.eventos.some(
                  (e) => Date.parse(e.inicio) > Date.parse(dados!.agora),
                ) && (
                  <p>
                    Ainda não há rodas futuras marcadas. A liderança pode
                    organizar a primeira.
                  </p>
                )}
                {d.lider && <NovoEvento atualizar={carregar} />}
              </>
            )}
            {tab === "perfil" && (
              <>
                <h1>Seu perfil</h1>
                {d.fotos[perfil.id] && (
                  <Image
                    width={96}
                    height={96}
                    unoptimized
                    className="pilot-avatar"
                    src={d.fotos[perfil.id]!}
                    alt="Minha foto de perfil"
                  />
                )}
                <label htmlFor="foto-piloto">Trocar foto</label>
                <input
                  id="foto-piloto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file)
                      void executar(
                        async () =>
                          api("/api/piloto/foto", {
                            foto: await prepararFoto(file),
                          }),
                        "Foto salva no servidor.",
                      );
                  }}
                />
                {d.fotos[perfil.id] && (
                  <button
                    onClick={() =>
                      void executar(() =>
                        api("/api/piloto/foto", { foto: null }),
                      )
                    }
                  >
                    Remover foto
                  </button>
                )}
                {consentimento}
                <PerfilPiloto
                  perfil={perfil}
                  ia={d.conta.ia_consentimento}
                  atualizar={carregar}
                />
                <section className="pilot-card">
                  <h2>Seus saberes reconhecidos</h2>
                  {d.saberes
                    .filter((s) => s.fonte !== "perfil")
                    .map((s) => (
                      <div key={s.id}>
                        <strong>{s.saber}</strong>
                        <p>{s.evidencia}</p>
                        {!s.confirmado && (
                          <button
                            onClick={() =>
                              void executar(() =>
                                api("/api/saberes/confirmar", {
                                  saber_id: s.id,
                                }),
                              )
                            }
                          >
                            Confirmar este saber
                          </button>
                        )}
                      </div>
                    ))}
                  <p className="input-hint">
                    Saberes reconhecidos só ficam públicos após sua confirmação.
                    As mensagens do chat ficam no Stream e não alimentam esse
                    mapa.
                  </p>
                </section>
              </>
            )}
            {tab === "lideranca" && d.lider && (
              <>
                <h1>O que a banca construiu</h1>
                <button
                  className="pilot-button"
                  disabled={busy}
                  onClick={() =>
                    void executar(async () =>
                      setMetricas(await api("/api/piloto/indicadores", {})),
                    )
                  }
                >
                  Atualizar dados reais do piloto
                </button>
                {metricas && (
                  <div className="pilot-grid">
                    {Object.entries(metricas).map(([k, v]) => (
                      <article className="pilot-card" key={k}>
                        <h2>{k}</h2>
                        <strong>
                          {k === "inicio" ? dataHora(String(v)) : v}
                        </strong>
                      </article>
                    ))}
                  </div>
                )}
                <p>
                  Faíscas realizadas entre contas do piloto; dicas publicadas
                  dessas trocas; saberes confirmados com origem nessas Faíscas.
                  Conteúdo do seed e demonstrações são excluídos. Inscrições não
                  representam presença. Mensagens não são copiadas do Stream
                  para este painel.
                </p>
              </>
            )}
          </>
        )}
      </main>
      <footer>
        Entre Elas · atualizações a cada quinze segundos · sua conta, suas
        escolhas
      </footer>
    </div>
  );
}
function Conteudo({
  dados: d,
  atualizar,
  biblioteca,
}: {
  dados: DadosPiloto;
  atualizar: () => Promise<void>;
  biblioteca: boolean;
}) {
  const [comunidade, setComunidade] = useState(""),
    [titulo, setTitulo] = useState(""),
    [corpo, setCorpo] = useState(""),
    [busca, setBusca] = useState(""),
    [salvos, setSalvos] = useState(false),
    [busy, setBusy] = useState(false);
  async function acao(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await atualizar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>
        {biblioteca
          ? "Saberes para levar adiante"
          : "Comunidades que aproximam"}
      </h1>
      {!biblioteca && (
        <>
          <label htmlFor="comunidade">Escolher comunidade</label>
          <select
            id="comunidade"
            value={comunidade}
            onChange={(e) => setComunidade(e.target.value)}
          >
            <option value="">Todas as comunidades</option>
            {d.comunidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {comunidade && (
            <section className="pilot-card">
              <h2>{d.comunidades.find((c) => c.id === comunidade)?.nome}</h2>
              <p>{d.comunidades.find((c) => c.id === comunidade)?.descricao}</p>
              <button
                disabled={busy}
                onClick={() =>
                  void acao(() =>
                    api(
                      `/api/comunidades/${d.membros.includes(comunidade) ? "sair" : "entrar"}`,
                      { community_id: comunidade },
                    ),
                  )
                }
              >
                {d.membros.includes(comunidade)
                  ? "Sair da comunidade"
                  : "Participar da comunidade"}
              </button>
            </section>
          )}
          <form
            className="pilot-card"
            onSubmit={(e) => {
              e.preventDefault();
              void acao(async () => {
                await api("/api/posts", {
                  community_id: comunidade || null,
                  tipo: "discussao",
                  titulo,
                  corpo,
                });
                setTitulo("");
                setCorpo("");
              });
            }}
          >
            <h2>Compartilhe uma experiência</h2>
            <label htmlFor="post-titulo">Título</label>
            <input
              id="post-titulo"
              required
              maxLength={160}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <label htmlFor="post-corpo">Sua publicação</label>
            <textarea
              id="post-corpo"
              required
              maxLength={5000}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
            />
            <button className="pilot-button" disabled={busy}>
              Publicar
            </button>
          </form>
        </>
      )}
      <label htmlFor="buscar-conteudo">Buscar conteúdo</label>
      <input
        id="buscar-conteudo"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {biblioteca && (
        <label>
          <input
            type="checkbox"
            checked={salvos}
            onChange={(e) => setSalvos(e.target.checked)}
          />{" "}
          Apenas meus favoritos
        </label>
      )}
      {d.posts
        .filter(
          (p) =>
            (!biblioteca || p.tipo === "dica") &&
            (!comunidade || p.community_id === comunidade) &&
            (!salvos || d.favoritos.includes(p.id)) &&
            `${p.titulo} ${p.corpo}`
              .toLowerCase()
              .includes(busca.toLowerCase()),
        )
        .map((p) => (
          <Post key={p.id} post={p} dados={d} atualizar={atualizar} />
        ))}
    </>
  );
}
function Post({
  post: p,
  dados: d,
  atualizar,
}: {
  post: DadosPiloto["posts"][number];
  dados: DadosPiloto;
  atualizar: () => Promise<void>;
}) {
  const [comentarios, setComentarios] = useState<
      { id: string; corpo: string; autora_id: string }[] | null
    >(null),
    [texto, setTexto] = useState(""),
    [busy, setBusy] = useState(false);
  async function acao(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await atualizar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="pilot-card">
      <span className="eyebrow">
        {d.pessoas.find((x) => x.id === p.autora_id)?.nome ??
          "Conteúdo inicial · exemplo fictício"}
      </span>
      <h2>{p.titulo}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{p.corpo}</p>
      <div className="pilot-actions">
        <button
          disabled={busy}
          onClick={() =>
            void acao(() =>
              api("/api/piloto/favorito", {
                post_id: p.id,
                ativo: !d.favoritos.includes(p.id),
              }),
            )
          }
        >
          {d.favoritos.includes(p.id) ? "Remover dos favoritos" : "Salvar"}
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void acao(() =>
              api("/api/posts/reagir", { post_id: p.id, tipo: "curtir" }),
            )
          }
        >
          Curtir
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void acao(async () =>
              setComentarios(
                await api("/api/posts/comentarios", { post_id: p.id }),
              ),
            )
          }
        >
          Ver comentários
        </button>
      </div>
      {comentarios && (
        <>
          <ul>
            {comentarios.map((c) => (
              <li key={c.id}>
                <strong>
                  {d.pessoas.find((x) => x.id === c.autora_id)?.nome ??
                    "Exemplo inicial"}
                </strong>
                <p>{c.corpo}</p>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void acao(async () => {
                await api("/api/posts/comentar", {
                  post_id: p.id,
                  corpo: texto,
                });
                setTexto("");
                setComentarios(
                  await api("/api/posts/comentarios", { post_id: p.id }),
                );
              });
            }}
          >
            <label htmlFor={`comentario-${p.id}`}>Seu comentário</label>
            <input
              id={`comentario-${p.id}`}
              required
              maxLength={1500}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button disabled={busy}>Comentar</button>
          </form>
        </>
      )}
    </article>
  );
}
function NovoEvento({ atualizar }: { atualizar: () => Promise<void> }) {
  const [titulo, setTitulo] = useState(""),
    [inicio, setInicio] = useState(""),
    [descricao, setDescricao] = useState("");
  return (
    <form
      className="pilot-card"
      onSubmit={(e) => {
        e.preventDefault();
        void api("/api/eventos", {
          titulo,
          descricao,
          inicio: new Date(inicio).toISOString(),
          tipo: "evento",
          community_id: null,
        })
          .then(atualizar)
          .then(() => toast.success("Roda agendada."))
          .catch((e) => toast.error(e.message));
      }}
    >
      <h2>Agendar uma roda real</h2>
      <label htmlFor="roda-titulo">Nome da roda</label>
      <input
        id="roda-titulo"
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />
      <label htmlFor="roda-inicio">Horário no seu fuso local</label>
      <input
        id="roda-inicio"
        type="datetime-local"
        required
        value={inicio}
        onChange={(e) => setInicio(e.target.value)}
      />
      <label htmlFor="roda-descricao">Local ou link e instruções</label>
      <textarea
        id="roda-descricao"
        required
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <button className="pilot-button">Agendar roda</button>
    </form>
  );
}
