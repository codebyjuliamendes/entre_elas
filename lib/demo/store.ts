"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  estadoDemoSchema,
  jornadaSchema,
  postComunidadeSchema,
  comentarioDemoSchema,
  type EstadoDemo,
  type JornadaDemo,
} from "./schemas";
import {
  comJornada,
  retomarEncontroState,
  criarEstadoInicial,
  jornadaInicial,
  restaurarEstado,
  selecionarConexao,
  aceitarConviteState,
  concluirEncontroState,
  publicarState,
  cancelarEncontroState,
  autorizarState,
  validarComunidade,
} from "./estado";
import { ANA_ID, perfisDemo } from "./catalogo";
import { nomeProduto, nomesBackupAceitos } from "@/lib/identidade";
import { postsIniciais } from "./conteudo";
export { jornadaInicial };
export const estadoInicial = criarEstadoInicial();
const KEY = "entre-elas:apresentacao:v1";
let snapshot: EstadoDemo | undefined;
let aviso: string | null = null;
let protegerOriginal = false;
const listeners = new Set<() => void>();
function emitir() {
  listeners.forEach((fn) => fn());
}
function getSnapshot(): EstadoDemo {
  if (typeof window === "undefined") return estadoInicial;
  if (snapshot) return snapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    snapshot = raw ? restaurarEstado(JSON.parse(raw)) : criarEstadoInicial();
  } catch {
    snapshot = criarEstadoInicial();
    protegerOriginal = true;
    aviso =
      "Não foi possível ler os dados locais. O arquivo original foi preservado e esta sessão continua em memória. Importe um backup ou confirme um reinício nas configurações.";
  }
  return snapshot;
}
function storage(event: StorageEvent) {
  if (event.key === KEY || event.key === null) {
    snapshot = undefined;
    protegerOriginal = false;
    aviso = null;
    getSnapshot();
    emitir();
  }
}
function subscribe(callback: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", storage);
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) window.removeEventListener("storage", storage);
  };
}
export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => estadoInicial);
}
export function useAvisoLocal() {
  return useSyncExternalStore(
    subscribe,
    () => aviso,
    () => null,
  );
}
export function atualizarDemo(updater: (state: EstadoDemo) => EstadoDemo) {
  const proximo = estadoDemoSchema.parse(updater(getSnapshot()));
  snapshot = proximo;
  if (protegerOriginal) {
    emitir();
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(proximo));
    aviso = null;
  } catch {
    aviso =
      "O navegador não conseguiu salvar. Seu progresso continua nesta sessão; exporte um backup antes de fechar.";
  }
  emitir();
}
export function atualizarJornada(patch: Partial<JornadaDemo>) {
  atualizarDemo((s) =>
    comJornada(
      s,
      jornadaSchema.parse({
        ...(patch.pedido !== undefined &&
        patch.pedido !== s.jornada.pedido &&
        s.jornada.match
          ? jornadaInicial
          : s.jornada),
        ...patch,
      }),
    ),
  );
}
export function reiniciarJornada() {
  atualizarDemo((s) => ({ ...s, jornada: { ...jornadaInicial } }));
}
export function escolherConexao(entrada: unknown) {
  atualizarDemo((s) => selecionarConexao(s, entrada));
}
export function aceitarConvite(entrada: unknown) {
  atualizarDemo((s) => aceitarConviteState(s, entrada));
}
export function concluirEncontro(entrada: unknown) {
  atualizarDemo((s) => concluirEncontroState(s, entrada));
}
export function autorizarPublicacaoDemo(
  participante: "ana" | "convidada",
  valor: boolean,
) {
  atualizarDemo((s) => autorizarState(s, participante, valor));
}
export function publicarDemo() {
  const id = getSnapshot().jornada.convite_id;
  atualizarDemo((s) => publicarState(s));
  return z.uuid().parse(id);
}
export function cancelarEncontro(id: string) {
  atualizarDemo((s) => cancelarEncontroState(s, id));
}
export function alternarLista(
  lista: "comunidades" | "eventos" | "salvos" | "curtidas",
  id: string,
) {
  z.string().min(1).max(200).parse(id);
  if (lista === "comunidades") validarComunidade(id);
  atualizarDemo((s) => ({
    ...s,
    [lista]: s[lista].includes(id)
      ? s[lista].filter((x) => x !== id)
      : [...s[lista], id],
  }));
}
export function criarPostDemo(entrada: unknown) {
  const input = z
    .object({
      comunidade_id: postComunidadeSchema.shape.comunidade_id,
      titulo: postComunidadeSchema.shape.titulo,
      corpo: postComunidadeSchema.shape.corpo,
    })
    .parse(entrada);
  if (!getSnapshot().comunidades.includes(input.comunidade_id))
    throw new Error("Entre na comunidade para compartilhar uma publicação.");
  const post = postComunidadeSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    autora_id: ANA_ID,
    created_at: new Date().toISOString(),
  });
  atualizarDemo((s) => ({ ...s, posts: [post, ...s.posts].slice(0, 100) }));
  return post.id;
}
export function comentarDemo(entrada: unknown) {
  const input = comentarioDemoSchema
    .pick({ post_id: true, corpo: true })
    .parse(entrada);
  const s = getSnapshot();
  const post = [...postsIniciais, ...s.posts].find(
    (p) => p.id === input.post_id,
  );
  if (!post) throw new Error("Publicação não encontrada.");
  if (!s.comunidades.includes(post.comunidade_id))
    throw new Error("Entre na comunidade para comentar.");
  const comentario = comentarioDemoSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    autora_id: ANA_ID,
    created_at: new Date().toISOString(),
  });
  atualizarDemo((s) => ({
    ...s,
    comentarios: [...s.comentarios, comentario].slice(-500),
  }));
}
export function exportarBackup() {
  return JSON.stringify(
    {
      aplicativo: nomeProduto,
      exportado_em: new Date().toISOString(),
      dados: getSnapshot(),
    },
    null,
    2,
  );
}
export function importarBackup(texto: string) {
  if (new TextEncoder().encode(texto).byteLength > 10_000_000)
    throw new Error("O arquivo deve ter até 10 MB.");
  const arquivo = z
    .object({ aplicativo: z.enum(nomesBackupAceitos), dados: z.unknown() })
    .parse(JSON.parse(texto));
  const dados = restaurarEstado(arquivo.dados);
  protegerOriginal = false;
  atualizarDemo(() => dados);
}
export function limparDadosLocais() {
  protegerOriginal = false;
  atualizarDemo(() => criarEstadoInicial());
}
export function marcarNotificacoes(ids: string[]) {
  const novos = z.array(z.string().max(100)).max(200).parse(ids);
  atualizarDemo((s) => ({
    ...s,
    notificacoes_lidas: [...new Set([...s.notificacoes_lidas, ...novos])].slice(
      -500,
    ),
  }));
}

export function retomarEncontro(id: string) {
  atualizarDemo((s) => retomarEncontroState(s, id));
}

export function iniciarComPessoa(entrada: unknown) {
  const id = z.uuid().parse(entrada);
  const p = perfisDemo.find((p) => p.id === id && p.id !== ANA_ID);
  if (!p) throw new Error("Pessoa não encontrada.");
  reiniciarJornada();
  atualizarJornada({
    pedido: `Quero aprender sobre ${p.saberes[0].toLowerCase()}.`,
  });
  escolherConexao({
    perfil_sugerido_id: p.id,
    motivo_conexao: `Você escolheu conversar com ${p.nome.split(" ")[0]} sobre uma experiência compartilhada na rede.`,
    evidencia: p.evidencia,
    fonte: "demonstracao",
  });
}
