import { StreamChat } from "stream-chat";
import { z } from "zod";
import { getDb, verificarErro } from "@/lib/db/client";
import { profile, id } from "@/lib/schemas/entities";

let client: StreamChat | undefined;

function temStream(): boolean {
  return Boolean(process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET);
}

function stream() {
  if (!temStream()) {
    throw new Error("Stream credentials not configured");
  }
  return (client ??= StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!,
  ));
}

export async function sincronizarPerfil(entrada: unknown): Promise<true> {
  if (!temStream()) return true;
  const p = profile.parse(entrada);
  await stream().upsertUser({
    id: p.id,
    name: p.nome,
    image: p.foto_url ?? undefined,
  });
  return z.literal(true).parse(true);
}

export function gerarToken(usuaria: string): string {
  if (!temStream()) {
    return "sb-" + id.parse(usuaria);
  }
  return z
    .string()
    .min(1)
    .parse(
      stream().createToken(
        id.parse(usuaria),
        Math.floor(Date.now() / 1000) + 3600,
      ),
    );
}

export async function criarCanal(entrada: unknown): Promise<string> {
  const input = z
    .object({
      id: z.string().regex(/^[a-z0-9_-]+$/),
      participantes: z.array(id).min(1),
      criadora: id,
    })
    .parse(entrada);
  if (!temStream()) {
    return input.id;
  }
  const canal = stream().channel("messaging", input.id, {
    members: input.participantes,
    created_by_id: input.criadora,
  });
  await canal.create();
  return z.string().parse(canal.id);
}

export async function adicionarMembro(canal: string, usuaria: string) {
  if (!temStream()) return true;
  await stream()
    .channel("messaging", z.string().parse(canal))
    .addMembers([id.parse(usuaria)]);
  return z.literal(true).parse(true);
}

export async function removerMembro(canal: string, usuaria: string) {
  if (!temStream()) return true;
  await stream()
    .channel("messaging", z.string().parse(canal))
    .removeMembers([id.parse(usuaria)]);
  return z.literal(true).parse(true);
}

function extrairFaiscaId(canal: string): string {
  return canal.replace(/^faisca-/, "");
}

export async function ultimasMensagens(canal: string, usuaria: string) {
  if (!temStream()) {
    const fid = extrairFaiscaId(canal);
    const { data, error } = await getDb()
      .from("piloto_mensagens")
      .select("texto")
      .eq("faisca_id", fid)
      .order("created_at", { ascending: false })
      .limit(10);
    verificarErro(error);
    return (data ?? []).map((m) => m.texto ?? "");
  }
  const c = stream().channel("messaging", z.string().parse(canal));
  const data = await c.query({ messages: { limit: 10 } });
  if (!data.members.some((m) => m.user_id === id.parse(usuaria)))
    throw new Error("Usuária não participa do canal.");
  return z
    .array(z.string())
    .max(10)
    .parse(data.messages.map((m) => m.text ?? ""));
}

export async function lerMensagens(canal: string, usuaria: string) {
  if (!temStream()) {
    const fid = extrairFaiscaId(canal);
    const { data, error } = await getDb()
      .from("piloto_mensagens")
      .select("id, texto, autora_id, created_at")
      .eq("faisca_id", fid)
      .order("created_at", { ascending: true })
      .limit(50);
    verificarErro(error);
    return (data ?? []).map((m) => ({
      id: m.id,
      texto: m.texto ?? "",
      autora_id: m.autora_id,
      created_at: String(m.created_at),
    }));
  }
  const c = stream().channel("messaging", z.string().parse(canal));
  const data = await c.query({ messages: { limit: 50 } });
  if (!data.members.some((m) => m.user_id === id.parse(usuaria)))
    throw new Error("Sem acesso ao canal.");
  return z
    .array(
      z.object({
        id: z.string(),
        texto: z.string(),
        autora_id: id,
        created_at: z.string(),
      }),
    )
    .parse(
      data.messages.map((m) => ({
        id: m.id,
        texto: m.text ?? "",
        autora_id: m.user?.id,
        created_at: String(m.created_at),
      })),
    );
}

export async function enviarMensagem(
  canal: string,
  usuaria: string,
  texto: string,
) {
  const textoLimpo = z.string().trim().min(1).max(2000).parse(texto);
  if (!temStream()) {
    const fid = extrairFaiscaId(canal);
    const msgId = crypto.randomUUID();
    const agora = new Date().toISOString();
    const { error } = await getDb()
      .from("piloto_mensagens")
      .insert({
        id: msgId,
        faisca_id: fid,
        autora_id: id.parse(usuaria),
        texto: textoLimpo,
        created_at: agora,
      });
    verificarErro(error);
    return { id: msgId };
  }
  await lerMensagens(canal, usuaria);
  const response = await stream()
    .channel("messaging", canal)
    .sendMessage({
      text: textoLimpo,
      user_id: id.parse(usuaria),
    });
  return z.object({ id: z.string() }).parse(response.message);
}
