"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
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
  Heart,
  Bookmark,
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
  atualizarDemo,
  atualizarJornada,
  reiniciarJornada,
  publicarDemo,
  alternarLista,
} from "@/lib/demo/store";
import { perfisDemo, ana, obterPerfilDemo } from "@/lib/demo/catalogo";
import { horarioDaDemo } from "@/lib/demo/tempo";
import { pedidoSchema, type Step } from "@/lib/demo/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
export function Journey() {
  const state = useDemo();
  const j = state.jornada;
  const [step, setStep] = useState<Step>(1);
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
  const ultimoConvite = state.convites.at(-1);
  const publicado = state.publicacoes.some((p) => p.id === ultimoConvite?.id);
  function avancar(n: Step) {
    setErro("");
    setStep(n);
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
    try {
      const match = await matchFaisca(
        input.data,
        outra ? j.match?.perfil_sugerido_id : undefined,
      );
      atualizarJornada({
        match,
        pauta: null,
        resultado: null,
        consentimento_ana: false,
        consentimento_convidada: false,
      });
      avancar(2);
    } catch {
      setErro(
        "Não conseguimos completar essa etapa. Sua ideia está salva; tente novamente.",
      );
      toast.error("Não foi possível encontrar a conexão agora.");
    } finally {
      setLoading(null);
    }
  }
  async function aceitarConvite() {
    setConviteAberto(false);
    setLoading("pauta");
    setErro("");
    try {
      const pauta = await gerarPauta(j.pedido, ana.nome, perfil.nome);
      const horario = horarioDaDemo(dia);
      atualizarDemo((s) => ({
        ...s,
        convites: [
          ...s.convites,
          {
            id: crypto.randomUUID(),
            perfil_id: perfil.id,
            tema: j.pedido,
            horario,
            status: "aceita" as const,
          },
        ].slice(-50),
      }));
      atualizarJornada({ pauta, horario });
      avancar(3);
      toast.success(
        `${perfil.nome.split(" ")[0]} aceitou na simulação. Café combinado!`,
      );
    } catch {
      setErro("Não conseguimos preparar a pauta agora. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }
  async function sintetizar(event: FormEvent) {
    event.preventDefault();
    if (j.aprendizado.trim().length < 10) {
      setErro("Conte seu aprendizado em pelo menos 10 caracteres.");
      return;
    }
    setLoading("sintese");
    setErro("");
    try {
      const resultado = await gerarDicaEQuiz(j.aprendizado);
      atualizarJornada({ resultado });
      avancar(6);
    } catch {
      setErro("Seu aprendizado está salvo. Tente sintetizar novamente.");
    } finally {
      setLoading(null);
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
    setStep(1);
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
                <>
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
                  <div className="section-heading">
                    <h2>Uma conversa pode mudar tudo</h2>
                  </div>
                  <div className="how-grid">
                    {[
                      {
                        icon: Lightbulb,
                        title: "Conte seu desafio",
                        desc: (
                          <>
                            Toda pergunta é um
                            <br />
                            bom começo.
                          </>
                        ),
                        cor: "peach",
                      },
                      {
                        icon: Coffee,
                        title: "Conecte experiências",
                        desc: (
                          <>
                            Um café de 20 min
                            <br />
                            com quem já viveu.
                          </>
                        ),
                        cor: "lilac",
                      },
                      {
                        icon: Sparkles,
                        title: "Faça o saber circular",
                        desc: (
                          <>
                            O que você aprende
                            <br />
                            inspira a rede.
                          </>
                        ),
                        cor: "mint",
                      },
                    ].map(({ icon: Icon, title, desc, cor }) => (
                      <div className="how-item" key={title}>
                        <span className={`how-icon ${cor}`}>
                          <Icon size={17} strokeWidth={1.5} />
                        </span>
                        <strong>{title}</strong>
                        <small>{desc}</small>
                      </div>
                    ))}
                  </div>
                  <div className="section-heading">
                    <h2>Saberes que estão por perto</h2>
                    <Link className="text-link" href="/comunidades">
                      Explorar a rede
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                  {perfisDemo.slice(1).map((p) => (
                    <Link href={`/perfil?usuaria=${p.slug}`} key={p.id}>
                      <Card className="person-card">
                        <Avatar nome={p.nome} src={p.avatar} size={46} />
                        <div>
                          <h3>{p.nome}</h3>
                          <p>
                            {p.cargo} · {p.regional}
                          </p>
                          <div className="tags">
                            <span className="tag">{p.tags[0]}</span>
                            <span className="tag">{p.tags[1]}</span>
                          </div>
                        </div>
                        <span className="person-spark">
                          <Sparkles size={14} />
                        </span>
                      </Card>
                    </Link>
                  ))}
                  <div className="network-card">
                    <div className="avatar-stack">
                      {perfisDemo.map((p) => (
                        <Avatar
                          key={p.id}
                          nome={p.nome}
                          src={p.avatar}
                          size={29}
                        />
                      ))}
                    </div>
                    <div>
                      <strong>Juntas, a gente vai mais longe.</strong>
                      <p>Uma rede feita de histórias, experiências e você.</p>
                    </div>
                    <Heart size={17} color="#b8a6ce" />
                  </div>
                </>
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
                    <Quiz
                      key={j.resultado.titulo}
                      perguntas={j.resultado.perguntas}
                    />
                  </article>
                  <Fonte fonte={j.resultado.fonte} />
                  {!publicado ? (
                    <>
                      <section className="consent-card">
                        <strong style={{ display: "block", marginBottom: 10 }}>
                          Uma dica só é pública quando as duas querem.
                        </strong>
                        <label>
                          <input
                            type="checkbox"
                            checked={j.consentimento_ana}
                            onChange={(e) =>
                              atualizarJornada({
                                consentimento_ana: e.target.checked,
                              })
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
                            atualizarJornada({ consentimento_convidada: true });
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
