import { z } from "zod";
import { ErroDominio } from "@/lib/domain/erros";
export const pilotoAtivo = () => process.env.APP_MODE === "piloto";
export function exigirEmail(email: unknown) {
  const valor = z.string().trim().email().max(254).parse(email).toLowerCase();
  if (!pilotoAtivo())
    throw new ErroDominio(
      "O acesso por e-mail não está habilitado neste ambiente.",
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
