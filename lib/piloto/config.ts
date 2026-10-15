import { z } from "zod";
import { ErroDominio } from "@/lib/domain/erros";
export const pilotoAtivo = () => process.env.APP_MODE === "piloto";
export function emailsPermitidos() {
  return (process.env.PILOT_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}
export function exigirEmail(email: unknown) {
  const valor = z.email().max(254).parse(email).toLowerCase();
  if (!pilotoAtivo() || !emailsPermitidos().includes(valor))
    throw new ErroDominio(
      "Acesso disponível somente às pessoas convidadas para o piloto.",
      403,
    );
  return valor;
}
export function origemApp() {
  return z.url().parse(process.env.APP_URL);
}
export function lider(email: string) {
  return (process.env.PILOT_LEADER_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .includes(email.toLowerCase());
}
