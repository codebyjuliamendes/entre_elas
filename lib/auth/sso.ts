import { z } from "zod";
/** Provedores de login corporativo que o Supabase Auth atende. "azure" é a conta Microsoft (Entra ID). */
export const provedoresSso = ["google", "azure"] as const;
export type ProvedorSso = (typeof provedoresSso)[number];
export const rotuloSso: Record<ProvedorSso, string> = {
  google: "Google",
  azure: "Microsoft",
};
/** Ligados por instalação em NEXT_PUBLIC_LOGIN_SSO, ex.: "azure,google". Vazio: só e-mail. */
export function provedoresAtivos(): ProvedorSso[] {
  const pedidos = (process.env.NEXT_PUBLIC_LOGIN_SSO ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase());
  return provedoresSso.filter((p) => pedidos.includes(p));
}
export const provedorInput = z.enum(provedoresSso);
