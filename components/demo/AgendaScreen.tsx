"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Check,
  Coffee,
  Download,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { eventosDemo, obterPerfilDemo } from "@/lib/demo/catalogo";
import {
  useDemo,
  alternarLista,
  cancelarEncontro,
  retomarEncontro,
} from "@/lib/demo/store";
import { useRouter } from "next/navigation";
import {
  inicioSemana,
  deslocarDia,
  dataCivil,
  diaLocal,
  criarIcs,
  baixarArquivo,
} from "@/lib/demo/calendario";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
interface Item {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  data: Date;
  horario: string;
  duracao: string;
  comunidade: string;
  cor: string;
  cancelada?: boolean;
  realizada?: boolean;
  inicio?: string;
  rascunho?: boolean;
}
export function AgendaScreen({ hoje }: { hoje: string }) {
  const router = useRouter();
  const state = useDemo();
  const [semana, setSemana] = useState(0);
  const [intervalo, setIntervalo] = useState<"todos" | "semana">("todos");
  const [dia, setDia] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Item | null>(null);
  const dias = Array.from({ length: 7 }, (_, i) =>
    dataCivil(deslocarDia(inicioSemana(hoje), semana * 7 + i)),
  );
  const itens: Item[] = [
    ...eventosDemo.map((e) => ({
      ...e,
      data: dataCivil(
        deslocarDia(
          hoje,
          e.id === "evento-lideranca" ? 1 : e.id === "comunidade-dados" ? 0 : 4,
        ),
      ),
      inicio: `${deslocarDia(hoje, e.id === "evento-lideranca" ? 1 : e.id === "comunidade-dados" ? 0 : 4)}T${e.horario}:00-03:00`,
    })),
    ...state.convites.map((c) => ({
      id: c.id,
      titulo: `Café com ${obterPerfilDemo(c.perfil_id).nome.split(" ")[0]}`,
      descricao: c.tema,
      tipo: "faisca",
      data: dataCivil(diaLocal(new Date(c.horario))),
      inicio: c.horario,
      realizada: c.status === "realizada",
      rascunho: !!c.rascunho,
      horario: new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(c.horario)),
      duracao: "20 min",
      comunidade:
        c.status === "realizada"
          ? "Faísca realizada"
          : c.status === "cancelada"
            ? "Faísca cancelada"
            : "Faísca aceita na simulação",
      cor: "peach",
      cancelada: c.status === "cancelada",
    })),
  ].sort((a, b) => a.data.getTime() - b.data.getTime());
  const filtro = (tipo: string) =>
    itens.filter(
      (e) =>
        (tipo === "tudo" || e.tipo === tipo) &&
        (intervalo === "todos" || (e.data >= dias[0] && e.data <= dias[6])) &&
        (dia === null || e.data.toISOString().slice(0, 10) === dia),
    );
  return (
    <>
      <span className="eyebrow" style={{ paddingTop: 16 }}>
        Tempo para o que faz você crescer
      </span>
      <h1 className="page-title">
        Sua agenda<span style={{ color: "#a080c9" }}>.</span>
      </h1>
      <p className="page-subtitle">Reserve um espaço para boas conversas.</p>
      <div className="calendar-header">
        <strong>
          {new Intl.DateTimeFormat("pt-BR", {
            timeZone: "UTC",
            month: "long",
            year: "numeric",
          }).format(dias[0])}
        </strong>
        <div className="calendar-arrows">
          <button
            aria-label="Semana anterior"
            onClick={() => {
              setSemana((x) => x - 1);
              setIntervalo("semana");
              setDia(null);
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Próxima semana"
            onClick={() => {
              setSemana((x) => x + 1);
              setIntervalo("semana");
              setDia(null);
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="calendar-days">
        {dias.map((d) => (
          <button
            key={d.toISOString()}
            className={`calendar-day ${dia === d.toISOString().slice(0, 10) ? "active" : ""} ${itens.some((e) => e.data.toISOString().slice(0, 10) === d.toISOString().slice(0, 10)) ? "has-event" : ""}`}
            aria-pressed={dia === d.toISOString().slice(0, 10)}
            aria-label={`Dia ${d.getUTCDate()}`}
            onClick={() => setDia(d.toISOString().slice(0, 10))}
          >
            <span>
              {new Intl.DateTimeFormat("pt-BR", {
                timeZone: "UTC",
                weekday: "short",
              })
                .format(d)
                .replace(".", "")}
            </span>
            <strong>{d.getUTCDate()}</strong>
          </button>
        ))}
      </div>
      {(dia !== null || intervalo === "semana") && (
        <button
          className="text-link"
          style={{ marginBottom: 17 }}
          onClick={() => {
            setDia(null);
            setIntervalo("todos");
          }}
        >
          Ver todos os encontros
        </button>
      )}
      <Tabs defaultValue="tudo">
        <TabsList aria-label="Filtrar agenda">
          <TabsTrigger value="tudo">Tudo</TabsTrigger>
          <TabsTrigger value="faisca">Faíscas</TabsTrigger>
          <TabsTrigger value="comunidade">Comunidade</TabsTrigger>
          <TabsTrigger value="evento">Eventos</TabsTrigger>
        </TabsList>
        {["tudo", "faisca", "comunidade", "evento"].map((tipo) => (
          <TabsContent key={tipo} value={tipo}>
            <div className="section-heading">
              <h2>
                {dia === null
                  ? intervalo === "semana"
                    ? "Nesta semana"
                    : "Próximos encontros"
                  : `Dia ${dataCivil(dia).getUTCDate()}`}
              </h2>
              <span className="eyebrow">
                {filtro(tipo).length} encontro
                {filtro(tipo).length === 1 ? "" : "s"}
              </span>
            </div>
            {filtro(tipo).length ? (
              filtro(tipo).map((e) => (
                <article key={e.id} className="event-card">
                  <div className={`event-date ${e.cor}`}>
                    <strong>{e.data.getUTCDate()}</strong>
                    <small>
                      {new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "UTC",
                        month: "short",
                      })
                        .format(e.data)
                        .replace(".", "")}
                    </small>
                  </div>
                  <div className="event-body">
                    <span className="tag">
                      {e.tipo === "faisca"
                        ? "Faísca"
                        : e.tipo === "evento"
                          ? "Evento"
                          : "Comunidade"}
                    </span>
                    <h3>{e.titulo}</h3>
                    <p className="event-meta">
                      <Clock3 size={10} />
                      {e.horario} · {e.duracao}
                    </p>
                    <p style={{ marginTop: 8 }}>{e.comunidade}</p>
                    <Button
                      variant={
                        state.eventos.includes(e.id) ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => setDetalhe(e)}
                    >
                      {state.eventos.includes(e.id) ? (
                        <>
                          <Check size={11} />
                          Presença confirmada
                        </>
                      ) : (
                        "Ver encontro"
                      )}
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <Coffee size={27} />
                <h3>Um espaço para uma nova conexão</h3>
                <p>
                  {tipo === "faisca"
                    ? "Sua próxima Faísca aparece aqui quando você combinar um café."
                    : "Ainda não há encontros nesse filtro. Que tal começar uma troca?"}
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/">Encontrar minha Faísca</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <div className="tip-box">
        <CalendarDays size={17} />
        <span>
          Agenda demonstrativa. As confirmações ficam neste dispositivo e não
          enviam convites externos.
        </span>
      </div>
      <Dialog
        open={!!detalhe}
        onOpenChange={(open) => {
          if (!open) setDetalhe(null);
        }}
      >
        <DialogContent>
          {detalhe && (
            <>
              <span className={`icon-tile ${detalhe.cor}`}>
                <CalendarDays size={22} />
              </span>
              <DialogTitle>{detalhe.titulo}</DialogTitle>
              <DialogDescription>{detalhe.descricao}</DialogDescription>
              <p className="input-hint">
                {new Intl.DateTimeFormat("pt-BR", {
                  timeZone: "UTC",
                  day: "numeric",
                  month: "long",
                }).format(detalhe.data)}{" "}
                · {detalhe.horario} · {detalhe.duracao}
                <br />
                {detalhe.comunidade}
              </p>
              {detalhe.inicio && !detalhe.cancelada && (
                <Button
                  className="full-width"
                  variant="secondary"
                  style={{ marginTop: 15 }}
                  onClick={() => {
                    baixarArquivo(
                      "entre-elas-encontro.ics",
                      criarIcs({
                        id: detalhe.id,
                        titulo: detalhe.titulo,
                        descricao: detalhe.descricao,
                        inicio: detalhe.inicio,
                        duracao:
                          detalhe.tipo === "faisca"
                            ? 20
                            : detalhe.duracao === "1 hora"
                              ? 60
                              : detalhe.duracao === "45 min"
                                ? 45
                                : 30,
                      }),
                      "text/calendar;charset=utf-8",
                    );
                    toast.success(
                      "Calendário exportado. O encontro continua sendo demonstrativo.",
                    );
                  }}
                >
                  <Download size={15} />
                  Adicionar ao meu calendário
                </Button>
              )}
              {detalhe.tipo === "faisca" &&
                !detalhe.cancelada &&
                detalhe.rascunho && (
                  <Button
                    className="full-width"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      try {
                        retomarEncontro(detalhe.id);
                        router.push("/?retomar=" + detalhe.id);
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Não foi possível retomar.",
                        );
                      }
                    }}
                  >
                    <Play size={15} />
                    {detalhe.realizada
                      ? "Ver aprendizado"
                      : "Retomar minha Faísca"}
                  </Button>
                )}
              {detalhe.tipo === "faisca" ? (
                <Button
                  variant="outline"
                  className="full-width"
                  style={{ marginTop: 18 }}
                  disabled={detalhe.cancelada || detalhe.realizada}
                  onClick={() => {
                    try {
                      cancelarEncontro(detalhe.id);
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível cancelar.",
                      );
                      return;
                    }
                    setDetalhe(null);
                    toast.success("Encontro cancelado na demonstração.");
                  }}
                >
                  Cancelar encontro simulado
                </Button>
              ) : (
                <Button
                  className="full-width"
                  style={{ marginTop: 18 }}
                  onClick={() => {
                    alternarLista("eventos", detalhe.id);
                    toast.success(
                      state.eventos.includes(detalhe.id)
                        ? "Participação removida da agenda local."
                        : "Presença confirmada na demonstração.",
                    );
                    setDetalhe(null);
                  }}
                >
                  {state.eventos.includes(detalhe.id)
                    ? "Cancelar minha participação"
                    : "Quero participar"}
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
