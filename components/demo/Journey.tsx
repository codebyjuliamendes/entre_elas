"use client";
import Link from "next/link";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Coffee,
  Lightbulb,
  ArrowUpRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Quote,
  Check,
  CheckCheck,
  Video,
  LoaderCircle,
  Bookmark,
  Heart,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  matchFaisca,
  gerarPauta,
  gerarDicaEQuiz,
} from "@/app/actions/ia-actions";
import {
  useDemo,
  escolherConexao,
  aceitarConvite as salvarConvite,
  concluirEncontro,
  autorizarPublicacaoDemo,
  atualizarJornada,
  reiniciarJornada,
  publicarDemo,
  alternarLista,
} from "@/lib/demo/store";
import { perfisDemo, ana, obterPerfilDemo } from "@/lib/demo/catalogo";
import { assistenteLocal, comFallbackLocal } from "@/lib/demo/fallback";
import { horarioDaDemo } from "@/lib/demo/tempo";
import { pedidoSchema, type Step } from "@/lib/demo/schemas";
import { Button } from "@/components/ui/button";
import { HomeNetwork } from "./HomeNetwork";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/Avatar";
import { CallRoom } from "./CallRoom";
import { Quiz } from "./Quiz";
const suggestions = [
  "Apresentar um projeto",
  "Descomplicar os dados",
  "Desenvolver minha liderança",
];
export function Journey({ retomar = false }: { retomar?: boolean }) {
  const state = useDemo();
  const j = state.jornada;
  const contextoIA = {
    objetivos: state.perfil.objetivos,
    saberes: state.perfil.saberes,
  };
  const [visaoInicio, setVisaoInicio] = useState(!retomar);
  const step: Step = visaoInicio ? 1 : j.step;
  const requisicao = useRef(0);
  useEffect(
    () => () => {
      requisicao.current++;
    },
    [],
  );
  const [loading, setLoading] = useState<"match" | "pauta" | "sintese" | null>(
    null,
  );
  const [erro, setErro] = useState("");
  const [conviteAberto, setConviteAberto] = useState(false);
  const [dia, setDia] = useState(0);
  const reduced = useReducedMotion();
  const perfil = obterPerfilDemo(
    j.match?.perfil_sugerido_id ?? perfisDemo[1].id,
  );
  const ultimoConvite = state.convites.find((c) => c.id === j.convite_id);
  const publicado = state.publicacoes.some((p) => p.id === ultimoConvite?.id);
  function avancar(n: Step) {
    setErro("");
    setVisaoInicio(n === 1);
    atualizarJornada({ step: n });
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  }
  async function buscar(outra = false) {
    const input = pedidoSchema.safeParse(j.pedido);
    if (!input.success) {
      setErro(input.error.issues[0].message);
      return;
    }
    setErro("");
    setLoading("match");
    const sequencia = ++requisicao.current;
    try {
      const excluido = outra ? j.match?.perfil_sugerido_id : undefined;
      const match = await comFallbackLocal(
        () => matchFaisca(input.data, excluido, contextoIA),
        () => assistenteLocal.matchFaisca(input.data, excluido, contextoIA),
      );
      if (sequencia !== requisicao.current) return;
      escolherConexao(match);
      avancar(2);
    } catch {
      setErro(
        "Não conseguimos completar essa etapa. Sua ideia está salva; tente novamente.",
      );
      toast.error("Não foi possível encontrar a conexão agora.");
    } finally {
      if (sequencia === requisicao.current) setLoading(null);
    }
  }
  async function aceitarConvite() {
    setConviteAberto(false);
    setLoading("pauta");
    const sequencia = ++requisicao.current;
    setErro("");
    try {
      const pauta = await comFallbackLocal(
        () => gerarPauta(j.pedido, ana.nome, perfil.nome, contextoIA),
        () =>
          assistenteLocal.gerarPauta(
            j.pedido,
            ana.nome,
            perfil.nome,
            contextoIA,
          ),
      );
      const horario = horarioDaDemo(dia);
      if (sequencia !== requisicao.current) return;
      salvarConvite({ id: crypto.randomUUID(), horario, pauta });
      avancar(3);
      toast.success(
        `${perfil.nome.split(" ")[0]} aceitou na simulação. Café combinado!`,
      );
    } catch {
      setErro("Não conseguimos preparar a pauta agora. Tente novamente.");
    } finally {
      if (sequencia === requisicao.current) setLoading(null);
    }
  }
  async function sintetizar(event: FormEvent) {
    event.preventDefault();
    if (j.aprendizado.trim().length < 10) {
      setErro("Conte seu aprendizado em pelo menos 10 caracteres.");
      return;
    }
    setLoading("sintese");
    const sequencia = ++requisicao.current;
    setErro("");
    try {
      const resultado = await comFallbackLocal(
        () => gerarDicaEQuiz(j.aprendizado),
        () => assistenteLocal.gerarDicaEQuiz(j.aprendizado),
      );
      if (sequencia !== requisicao.current) return;
      concluirEncontro(resultado);
      avancar(6);
    } catch {
      setErro("Seu aprendizado está salvo. Tente sintetizar novamente.");
    } finally {
      if (sequencia === requisicao.current) setLoading(null);
    }
  }
  function publicar() {
    try {
      publicarDemo();
      toast.success(
        "Dica publicada no perfil da convidada nesta demonstração.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível publicar.",
      );
    }
  }
  function reset() {
    reiniciarJornada();
    setVisaoInicio(true);
    setErro("");
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  }
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={loading ?? step}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -7 }}
          transition={{ duration: 0.22 }}
        >
          {loading ? (
            <div className="loading-screen" role="status" aria-live="polite">
              <div className="loading-orbit">
                <Sparkles size={35} strokeWidth={1.2} />
              </div>
              <span className="eyebrow" style={{ marginBottom: 14 }}>
                Boas conexões começam aqui
              </span>
              <h2>
                {loading === "match"
                  ? "A IA está mapeando a rede…"
                  : loading === "pauta"
                    ? "Preparando esse encontro…"
                    : "Transformando a troca em saber…"}
              </h2>
              <p>
                {loading === "match"
                  ? "Cruzando experiências para encontrar alguém que pode iluminar seu caminho."
                  : loading === "pauta"
                    ? "Três perguntas para fazer os vinte minutos valerem a pena."
                    : "Seu aprendizado pode ser a inspiração de outra mulher."}
              </p>
              <LoaderCircle className="spinner" size={20} color="#ab91c8" />
            </div>
          ) : (
            <>
              {step > 1 && (
                <div className="page-topline">
                  {!publicado && step !== 4 ? (
                    <button
                      className="back-button"
                      aria-label="Voltar uma etapa"
                      onClick={() =>
                        avancar((step === 5 ? 3 : step - 1) as Step)
                      }
                    >
                      <ArrowLeft size={17} />
                    </button>
                  ) : (
                    <span className="eyebrow">Sua Faísca</span>
                  )}
                  <span style={{ fontSize: 10 }}>Uma troca que transforma</span>
                  <div
                    className="step-indicator"
                    aria-label={`Etapa ${step} de 6`}
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <span
                        key={i}
                        className={`step-dot ${i < step ? "active" : ""}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="home-layout">
                  <div className="greeting">
                    <span className="eyebrow">
                      Seu próximo passo começa em uma conversa
                    </span>
                    <h1 className="greeting-line">
                      Bom te ver, <strong>Ana</strong>
                      <span className="wave" aria-label="Olá">
                        ✺
                      </span>
                    </h1>
                    <p>Você tem muito a ensinar. E um mundo para descobrir.</p>
                  </div>
                  {j.step > 1 && j.match && (
                    <div className="resume-card">
                      <span>
                        Sua conversa com {perfil.nome.split(" ")[0]} está salva.
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => avancar(j.step)}
                      >
                        Continuar
                        <ArrowRight size={12} />
                      </Button>
                    </div>
                  )}
                  <section className="hero">
                    <div className="hero-top">
                      <span className="hero-icon">
                        <Sparkles size={14} />
                      </span>
                      ENCONTRE SUA FAÍSCA
                    </div>
                    <h2>
                      O que você quer
                      <br />
                      <em>aprender hoje?</em>
                    </h2>
                    <p className="hero-description">
                      Existe uma mulher na nossa rede que já viveu
                      <br />o que você está querendo descobrir.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void buscar();
                      }}
                    >
                      <div className="hero-form">
                        <label className="sr-only" htmlFor="pedido">
                          O que você quer aprender hoje?
                        </label>
                        <textarea
                          id="pedido"
                          className="hero-textarea"
                          placeholder="Ex.: quero apresentar meu primeiro projeto à diretoria, mas não sei por onde começar…"
                          value={j.pedido}
                          maxLength={1500}
                          onChange={(e) => {
                            atualizarJornada({ pedido: e.target.value });
                            setErro("");
                          }}
                          aria-describedby={erro ? "pedido-erro" : undefined}
                        />
                        <span className="input-count">
                          {j.pedido.length}/1500
                        </span>
                      </div>
                      <div className="prompt-chips">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="prompt-chip"
                            onClick={() =>
                              atualizarJornada({
                                pedido:
                                  s === "Apresentar um projeto"
                                    ? "Quero apresentar meu primeiro projeto à diretoria. Como posso me preparar?"
                                    : s === "Descomplicar os dados"
                                      ? "Quero aprender a transformar dados e indicadores em uma apresentação mais clara."
                                      : "Quero desenvolver minha liderança e compartilhar experiências com minha equipe.",
                              })
                            }
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {erro && (
                        <p
                          id="pedido-erro"
                          className="field-error"
                          role="alert"
                          style={{ color: "#ffe1e9" }}
                        >
                          {erro}
                        </p>
                      )}
                      <Button
                        className="hero-cta"
                        type="submit"
                        disabled={j.pedido.trim().length < 5}
                      >
                        <Sparkles size={16} />
                        Encontrar minha Faísca
                        <ArrowRight size={16} />
                      </Button>
                    </form>
                    <div className="hero-foot">
                      <Clock3 size={11} />
                      20 minutos de conversa. Novas possibilidades.
                    </div>
                  </section>
                  <HomeNetwork />
                </div>
              )}
              {step === 2 && j.match && (
                <>
                  <span className="eyebrow" style={{ marginTop: 27 }}>
                    Uma conexão cheia de possibilidades
                  </span>
                  <h1 className="step-heading">
                    Sua próxima troca
                    <br />
                    tem um nome.
                  </h1>
                  <p className="step-description">
                    Experiências diferentes. Um desafio em comum.
                  </p>
                  <section className="match-card">
                    <span className="pill">
                      <Sparkles size={12} />
                      UMA FAÍSCA PARA VOCÊ
                    </span>
                    <div className="match-avatar">
                      <Avatar
                        nome={perfil.nome}
                        src={perfil.avatar}
                        size={92}
                      />
                    </div>
                    <h2>{perfil.nome}</h2>
                    <p className="match-role">
                      {perfil.cargo} · {perfil.area}
                    </p>
                    <p className="match-location">
                      <MapPin size={11} />
                      {perfil.cidade}
                    </p>
                    <div className="tags">
                      {perfil.tags.map((t) => (
                        <span className="tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="match-motive">{j.match.motivo_conexao}</p>
                    <div className="evidence">
                      <span className="evidence-label">
                        <Quote size={13} />
                        Uma experiência que faz a conexão
                      </span>
                      <p>“{j.match.evidencia}”</p>
                    </div>
                    <p className="match-footer">
                      <ShieldCheck size={11} />
                      Baseado nas experiências compartilhadas na rede
                    </p>
                  </section>
                  {j.match.leitura && (
                    <details className="curadoria-explanation">
                      <summary>Por que esta Faísca faz sentido?</summary>
                      <h3>{j.match.leitura.foco}</h3>
                      <ul>
                        {j.match.leitura.criterios.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      <p>{j.match.leitura.limite}</p>
                      <p className="input-hint">
                        A curadoria usa seu pedido, objetivos e experiências do
                        catálogo. Foto e conversas de chat não entram nessa
                        análise.
                      </p>
                    </details>
                  )}
                  <div className="action-stack">
                    <Button
                      onClick={() => setConviteAberto(true)}
                      className="full-width"
                    >
                      <Coffee size={17} />
                      Convidar para um café (20 min)
                      <ArrowRight size={15} />
                    </Button>
                    <Button variant="ghost" onClick={() => void buscar(true)}>
                      Buscar outra conexão
                    </Button>
                  </div>
                  <Fonte fonte={j.match.fonte} />
                </>
              )}
              {step === 3 && j.pauta && (
                <>
                  <div className="success-icon" style={{ marginTop: 25 }}>
                    <CheckCheck size={27} />
                  </div>
                  <span className="eyebrow">
                    Um tempo para trocar, um espaço para crescer
                  </span>
                  <h1 className="step-heading">
                    Convite aceito.
                    <br />
                    Café combinado!
                  </h1>
                  <p className="step-description">
                    {perfil.nome.split(" ")[0]} aceitou o convite na
                    demonstração.
                    <br />A gente preparou um começo para essa conversa.
                  </p>
                  <div className="session-summary">
                    <Avatar nome={perfil.nome} src={perfil.avatar} size={43} />
                    <div>
                      <strong>Você + {perfil.nome.split(" ")[0]}</strong>
                      <small>
                        <Clock3 size={10} style={{ verticalAlign: "middle" }} />
                        20 min ·{" "}
                        {j.horario
                          ? new Intl.DateTimeFormat("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(j.horario))
                          : "Horário combinado"}
                      </small>
                    </div>
                    <Coffee
                      size={19}
                      color="#bb9ed2"
                      style={{ marginLeft: "auto" }}
                    />
                  </div>
                  <div className="section-heading">
                    <h2>Três perguntas, muitas possibilidades</h2>
                    <Sparkles size={15} color="#b49ac9" />
                  </div>
                  <div className="faisca-plan">
                    <strong>Vinte minutos com intenção</strong>
                    <span>0–3 min · alinhar o desafio</span>
                    <span>3–15 min · trocar experiências</span>
                    <span>15–20 min · combinar um próximo passo</span>
                  </div>
                  <ul className="agenda-list">
                    {j.pauta.perguntas.map((p, i) => (
                      <li key={i}>
                        <label className="agenda-question">
                          <input type="checkbox" />
                          <span>{p}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="full-width"
                    onClick={() => {
                      atualizarJornada({ inicio_chamada: Date.now() });
                      avancar(4);
                    }}
                  >
                    <Video size={18} />
                    Iniciar videochamada
                    <ArrowRight size={15} />
                  </Button>
                  <div className="tip-box">
                    <Lightbulb size={16} />
                    <span>
                      Não precisa ter todas as respostas. Às vezes, compartilhar
                      o caminho já é a maior ajuda.
                    </span>
                  </div>
                  <Fonte fonte={j.pauta.fonte} />
                </>
              )}
              {step === 4 && j.inicio_chamada && (
                <CallRoom
                  perfil={perfil}
                  inicio={j.inicio_chamada}
                  onEncerrar={() => avancar(5)}
                />
              )}
              {step === 5 && (
                <>
                  <div className="success-icon lilac" style={{ marginTop: 25 }}>
                    <Sparkles size={25} />
                  </div>
                  <span className="eyebrow">
                    O encontro termina. O saber continua.
                  </span>
                  <h1 className="step-heading">
                    O que ficou
                    <br />
                    dessa conversa?
                  </h1>
                  <p className="step-description">
                    Toda experiência tem algo que merece circular.
                    <br />
                    Conte o que você aprendeu com {perfil.nome.split(" ")[0]}.
                  </p>
                  <div className="learning-card">
                    <Avatar nome={perfil.nome} src={perfil.avatar} size={41} />
                    <div>
                      <strong>Um café com {perfil.nome.split(" ")[0]}</strong>
                      <p>
                        Uma troca pequena no tempo.
                        <br />
                        Grande nas possibilidades.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={sintetizar}>
                    <label className="form-label" htmlFor="aprendizado">
                      Qual aprendizado você quer levar adiante?
                    </label>
                    <textarea
                      id="aprendizado"
                      className="text-area"
                      rows={7}
                      maxLength={3000}
                      placeholder="Ex.: aprendi com a Carla que uma boa apresentação começa pelo objetivo. Preciso mostrar os indicadores certos e deixar clara a decisão que espero da diretoria…"
                      value={j.aprendizado}
                      onChange={(e) => {
                        atualizarJornada({ aprendizado: e.target.value });
                        setErro("");
                      }}
                    />
                    <p className="input-hint">
                      {j.aprendizado.length}/3000 · Use apenas informações
                      fictícias nesta apresentação.
                    </p>
                    {erro && (
                      <p className="field-error" role="alert">
                        {erro}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="full-width"
                      style={{ marginTop: 22 }}
                      disabled={j.aprendizado.trim().length < 10}
                    >
                      <Sparkles size={17} />
                      Sintetizar com IA
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                  <div className="tip-box">
                    <Heart size={16} />
                    <span>
                      O saber da outra ganha reconhecimento quando você conta
                      como ele fez a diferença.
                    </span>
                  </div>
                </>
              )}
              {step === 6 && j.resultado && (
                <>
                  <div className="success-icon lilac" style={{ marginTop: 25 }}>
                    <Lightbulb size={25} />
                  </div>
                  <span className="eyebrow">
                    De uma conversa para toda a rede
                  </span>
                  <h1 className="step-heading">
                    Seu aprendizado
                    <br />
                    pode ir mais longe.
                  </h1>
                  <p className="step-description">
                    Uma dica para compartilhar. Um saber para reconhecer.
                  </p>
                  <article className="article-card">
                    <div className="article-authors">
                      <Avatar nome={ana.nome} src={ana.avatar} size={26} />
                      <Avatar
                        nome={perfil.nome}
                        src={perfil.avatar}
                        size={26}
                      />
                      <span>
                        Uma troca de Ana e {perfil.nome.split(" ")[0]}
                      </span>
                    </div>
                    <h2>{j.resultado.titulo}</h2>
                    <p className="article-text">{j.resultado.dica}</p>
                    <div className="tags" style={{ marginTop: 17 }}>
                      <span className="tag">
                        <Sparkles size={10} />
                        {j.resultado.saber_reconhecido}
                      </span>
                      <span className="tag">Aprendi com ela</span>
                    </div>
                    <button
                      className="text-link"
                      style={{ marginTop: 16 }}
                      onClick={() => {
                        alternarLista("salvos", j.resultado!.titulo);
                        toast.success(
                          state.salvos.includes(j.resultado!.titulo)
                            ? "Dica removida dos salvos."
                            : "Dica salva neste dispositivo.",
                        );
                      }}
                    >
                      <Bookmark
                        size={13}
                        fill={
                          state.salvos.includes(j.resultado.titulo)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {state.salvos.includes(j.resultado.titulo)
                        ? "Dica salva"
                        : "Salvar para depois"}
                    </button>
                    {j.resultado.trecho_aprendizado && (
                      <details className="curadoria-explanation">
                        <summary>De onde veio esta síntese?</summary>
                        <p>
                          Trecho das suas anotações usado para apoiar a dica:
                        </p>
                        <blockquote>
                          {j.resultado.trecho_aprendizado}
                        </blockquote>
                        <p>
                          Revise a dica antes de autorizar. A síntese pode
                          precisar de ajustes; volte às anotações para gerar
                          outra versão.
                        </p>
                      </details>
                    )}
                    <Quiz
                      key={j.resultado.titulo}
                      perguntas={j.resultado.perguntas}
                    />
                  </article>
                  <Fonte fonte={j.resultado.fonte} />
                  {!publicado ? (
                    <>
                      <Button
                        variant="outline"
                        className="full-width"
                        style={{ marginBottom: 16 }}
                        onClick={() => {
                          atualizarJornada({
                            consentimento_ana: false,
                            consentimento_convidada: false,
                          });
                          avancar(5);
                        }}
                      >
                        Revisar minhas anotações e gerar outra síntese
                      </Button>
                      <section className="consent-card">
                        <strong style={{ display: "block", marginBottom: 10 }}>
                          Uma dica só é pública quando as duas querem.
                        </strong>
                        <label>
                          <input
                            type="checkbox"
                            checked={j.consentimento_ana}
                            onChange={(e) =>
                              autorizarPublicacaoDemo("ana", e.target.checked)
                            }
                          />
                          <span>
                            Eu, Ana, autorizo compartilhar esta dica e
                            reconhecer o saber da convidada.
                          </span>
                        </label>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="full-width"
                          disabled={j.consentimento_convidada}
                          onClick={() => {
                            autorizarPublicacaoDemo("convidada", true);
                            toast.success(
                              `${perfil.nome.split(" ")[0]} autorizou na simulação.`,
                            );
                          }}
                        >
                          {j.consentimento_convidada ? (
                            <>
                              <Check size={13} />
                              {perfil.nome.split(" ")[0]} autorizou na simulação
                            </>
                          ) : (
                            <>
                              Simular autorização de {perfil.nome.split(" ")[0]}
                            </>
                          )}
                        </Button>
                      </section>
                      <Button
                        className="full-width"
                        style={{ marginTop: 15 }}
                        disabled={
                          !j.consentimento_ana || !j.consentimento_convidada
                        }
                        onClick={publicar}
                      >
                        <Sparkles size={16} />
                        Publicar no perfil de {perfil.nome.split(" ")[0]}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="publish-success" role="status">
                        <CheckCircle2 size={20} />
                        Publicado! O saber de {perfil.nome.split(" ")[0]} ganhou
                        reconhecimento nesta demo.
                      </div>
                      <Button
                        asChild
                        className="full-width"
                        style={{ marginTop: 14 }}
                      >
                        <Link href={`/perfil?usuaria=${perfil.slug}`}>
                          Ver perfil de {perfil.nome.split(" ")[0]}
                          <ArrowUpRight size={15} />
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    className="full-width"
                    style={{ marginTop: 10 }}
                    onClick={reset}
                  >
                    Voltar ao início
                  </Button>
                </>
              )}
              {erro && step !== 1 && step !== 5 && (
                <p className="field-error" role="alert">
                  {erro}
                </p>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <Dialog open={conviteAberto} onOpenChange={setConviteAberto}>
        <DialogContent>
          <span className="icon-tile peach">
            <Coffee size={22} />
          </span>
          <DialogTitle>Vinte minutos para uma boa troca.</DialogTitle>
          <DialogDescription>
            Convide {perfil.nome.split(" ")[0]} e simule o aceite da convidada.
            Este encontro não será enviado nem agendado fora da apresentação.
          </DialogDescription>
          <div className="date-choices">
            {["Hoje", "Amanhã", "Em 2 dias"].map((d, i) => (
              <button
                key={d}
                className={`date-choice ${dia === i ? "active" : ""}`}
                onClick={() => setDia(i)}
                aria-pressed={dia === i}
              >
                <CalendarDays size={17} />
                <strong>{d}</strong>
                <span>20 minutos</span>
              </button>
            ))}
          </div>
          <Button className="full-width" onClick={() => void aceitarConvite()}>
            <CheckCheck size={16} />
            Simular aceite de {perfil.nome.split(" ")[0]}
          </Button>
          <p className="input-hint" style={{ textAlign: "center" }}>
            Só a convidada pode aceitar no fluxo real.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
function Fonte({ fonte }: { fonte: "ia" | "demonstracao" }) {
  return (
    <p className="source-label">
      <Sparkles size={10} />
      {fonte === "ia"
        ? "Conteúdo gerado por IA com perfis fictícios"
        : "Exemplo de apresentação · conteúdo simulado"}
    </p>
  );
}
