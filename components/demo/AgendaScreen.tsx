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
} from "lucide-react";
import { toast } from "sonner";
import { eventosDemo, obterPerfilDemo } from "@/lib/demo/catalogo";
import { useDemo, alternarLista, atualizarDemo } from "@/lib/demo/store";
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
}
export function AgendaScreen() {
  const state = useDemo();
  const [semana, setSemana] = useState(0);
  const [dia, setDia] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<Item | null>(null);
  const dias = Array.from(
    { length: 7 },
    (_, i) => new Date(Date.UTC(2026, 9, 12 + semana * 7 + i, 15)),
  );
  const itens: Item[] = [
    ...eventosDemo.map((e) => ({
      ...e,
      data: new Date(Date.UTC(e.ano, e.mes - 1, e.dia, 15)),
    })),
    ...state.convites.map((c) => ({
      id: c.id,
      titulo: `Café com ${obterPerfilDemo(c.perfil_id).nome.split(" ")[0]}`,
      descricao: c.tema,
      tipo: "faisca",
      data: new Date(c.horario),
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
        (dia === null ||
          (e.data.getUTCDate() === dia &&
            e.data.getUTCMonth() === dias[0].getUTCMonth())),
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
              setDia(null);
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Próxima semana"
            onClick={() => {
              setSemana((x) => x + 1);
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
            className={`calendar-day ${dia === d.getUTCDate() ? "active" : ""} ${itens.some((e) => e.data.getUTCDate() === d.getUTCDate() && e.data.getUTCMonth() === d.getUTCMonth()) ? "has-event" : ""}`}
            aria-pressed={dia === d.getUTCDate()}
            aria-label={`Dia ${d.getUTCDate()}`}
            onClick={() => setDia(d.getUTCDate())}
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
      {dia !== null && (
        <button
          className="text-link"
          style={{ marginBottom: 17 }}
          onClick={() => setDia(null)}
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
              <h2>{dia === null ? "Próximos encontros" : `Dia ${dia}`}</h2>
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
                        ? "FAÍSCA"
                        : e.tipo === "evento"
                          ? "EVENTO"
                          : "COMUNIDADE"}
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
              {detalhe.tipo === "faisca" ? (
                <Button
                  variant="outline"
                  className="full-width"
                  style={{ marginTop: 18 }}
                  disabled={detalhe.cancelada}
                  onClick={() => {
                    atualizarDemo((s) => ({
                      ...s,
                      convites: s.convites.map((c) =>
                        c.id === detalhe.id
                          ? { ...c, status: "cancelada" as const }
                          : c,
                      ),
                    }));
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
