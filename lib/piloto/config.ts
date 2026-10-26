import { z } from "zod";
import { ErroDominio } from "@/lib/domain/erros";
export const pilotoAtivo = () =>
  process.env.APP_MODE === "piloto" ||
  (process.env.NODE_ENV === "production" &&
    process.env.APP_MODE !== "apresentacao");
export function exigirEmail(email: unknown) {
  const valor = z.string().trim().email().max(254).parse(email).toLowerCase();
  if (!pilotoAtivo())
    throw new ErroDominio(
      "O acesso por e-mail não está habilitado neste ambiente.",
      403,
    );
  const dominios = dominiosPermitidos();
  // Num piloto contratado, só e-mails da empresa entram; a liderança cadastrada sempre entra.
  if (dominios.length && !dominios.includes(valor.split("@")[1]) && !lider(valor))
    throw new ErroDominio(
      `Use seu e-mail da empresa (${dominios.map((d) => "@" + d).join(", ")}).`,
      403,
    );
  return valor;
}
export function dominiosPermitidos() {
  return (process.env.PILOT_EMAIL_DOMINIOS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
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
