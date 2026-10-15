"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  estadoDemoSchema,
  jornadaSchema,
  publicacaoDemoSchema,
  type EstadoDemo,
  type JornadaDemo,
} from "./schemas";
import { ana, ANA_ID } from "./catalogo";
export const jornadaInicial: JornadaDemo = {
  step: 1,
  pedido: "",
  match: null,
  pauta: null,
  aprendizado: "",
  resultado: null,
  consentimento_ana: false,
  consentimento_convidada: false,
  horario: null,
  inicio_chamada: null,
};
export const estadoInicial: EstadoDemo = {
  versao: 1,
  jornada: jornadaInicial,
  publicacoes: [],
  convites: [],
  mensagens: [],
  comunidades: ["campo"],
  eventos: [],
  salvos: [],
  perfil: { bio: ana.bio, saberes: ana.saberes },
};
const KEY = "entre-elas:apresentacao:v1";
let snapshot: EstadoDemo | undefined;
const listeners = new Set<() => void>();
function getSnapshot(): EstadoDemo {
  if (typeof window === "undefined") return estadoInicial;
  if (snapshot) return snapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    snapshot = raw ? estadoDemoSchema.parse(JSON.parse(raw)) : estadoInicial;
  } catch {
    snapshot = estadoInicial;
  }
  return snapshot;
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  function storage(event: StorageEvent) {
    if (event.key === KEY) {
      snapshot = undefined;
      callback();
    }
  }
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", storage);
  };
}
export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => estadoInicial);
}
export function atualizarDemo(updater: (state: EstadoDemo) => EstadoDemo) {
  snapshot = estadoDemoSchema.parse(updater(getSnapshot()));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* A sessão continua utilizável se o armazenamento estiver indisponível. */
  }
  listeners.forEach((fn) => fn());
}
export function atualizarJornada(patch: Partial<JornadaDemo>) {
  atualizarDemo((state) => ({
    ...state,
    jornada: jornadaSchema.parse({ ...state.jornada, ...patch }),
  }));
}
export function reiniciarJornada() {
  atualizarDemo((state) => ({ ...state, jornada: { ...jornadaInicial } }));
}
export function publicarDemo(): string {
  const state = getSnapshot(),
    j = state.jornada;
  if (
    !j.resultado ||
    !j.match ||
    !j.consentimento_ana ||
    !j.consentimento_convidada
  )
    throw new Error("As duas participantes precisam autorizar a publicação.");
  const existente = state.publicacoes.find(
    (p) => p.id === state.convites.at(-1)?.id,
  );
  if (existente) return existente.id;
  const id = state.convites.at(-1)?.id ?? crypto.randomUUID();
  const post = publicacaoDemoSchema.parse({
    id,
    perfil_id: j.match.perfil_sugerido_id,
    autora_id: ANA_ID,
    ...j.resultado,
    created_at: new Date().toISOString(),
    consentimentos: [ANA_ID, j.match.perfil_sugerido_id],
  });
  atualizarDemo((s) => ({
    ...s,
    publicacoes: [post, ...s.publicacoes].slice(0, 50),
    convites: s.convites.map((c) =>
      c.id === id ? { ...c, status: "realizada" } : c,
    ),
  }));
  return id;
}
export function alternarLista(
  lista: "comunidades" | "eventos" | "salvos",
  id: string,
) {
  z.string().min(1).parse(id);
  atualizarDemo((s) => ({
    ...s,
    [lista]: s[lista].includes(id)
      ? s[lista].filter((x) => x !== id)
      : [...s[lista], id],
  }));
}
