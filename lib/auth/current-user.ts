import { identificarIA } from "@/lib/piloto/ia";
import { pilotoAtivo } from "@/lib/piloto/config";
import { identidadePiloto } from "./piloto";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { id, profile, type Profile } from "@/lib/schemas/entities";
import { getDb, verificarErro } from "@/lib/db/client";
import { ErroDominio } from "@/lib/domain/erros";
function chave() {
  const valor = process.env.DEMO_COOKIE_SECRET;
  if (!valor || valor.length < 32)
    throw new ErroDominio(
      "Configure DEMO_COOKIE_SECRET com pelo menos 32 caracteres.",
      503,
    );
  return valor;
}
export function assinarCookie(profileId: string): string {
  const pid = id.parse(profileId);
  const payload = `${pid}.${Math.floor(Date.now() / 1000) + 86400}`;
  return z
    .string()
    .parse(
      `${payload}.${createHmac("sha256", chave()).update(payload).digest("hex")}`,
    );
}
export function validarCookie(cookie: string): string {
  const partes = /^([0-9a-fA-F-]{36})\.([0-9]{1,12})\.([0-9a-f]{64})$/.exec(
    z.string().max(180).catch("").parse(cookie),
  );
  if (!partes) throw new ErroDominio("Sessão de demo inválida.", 401);
  const [, pid, exp, assinatura] = partes;
  const agora = Date.now() / 1000;
  if (
    !id.safeParse(pid).success ||
    !Number.isSafeInteger(Number(exp)) ||
    Number(exp) <= agora ||
    Number(exp) > agora + 86460
  )
    throw new ErroDominio("Sessão de demo inválida.", 401);
  const esperado = createHmac("sha256", chave())
    .update(`${pid}.${exp}`)
    .digest("hex");
  if (!timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado)))
    throw new ErroDominio("Sessão de demo inválida.", 401);
  return id.parse(pid);
}
export async function getCurrentUser(): Promise<Profile> {
  if (pilotoAtivo()) {
    const u = (await identidadePiloto()).perfil;
    identificarIA(u.id);
    return u;
  }
  // Identidade fictícia restrita ao modo de apresentação.
  if (process.env.DEMO_MODE !== "true")
    throw new ErroDominio("SSO ainda não configurado.", 401);
  const cookie = (await cookies()).get("entre_elas_demo")?.value;
  if (!cookie) throw new ErroDominio("Entre como uma usuária da demo.", 401);
  const pid = validarCookie(cookie);
  const { data, error } = await getDb()
    .from("profiles")
    .select("*")
    .eq("id", pid)
    .maybeSingle();
  verificarErro(error);
  if (!data) throw new ErroDominio("Usuária não encontrada.", 401);
  return profile.parse(data);
}
