import { z } from "zod";
import { faisca, id } from "@/lib/schemas/entities";
import { exigirParticipante } from "./regras";
import { ErroDominio } from "./erros";
export function calendarioFaisca(entrada: unknown) {
  const {
    encontro: f,
    usuaria_id,
    origem,
  } = z
    .object({
      encontro: faisca,
      usuaria_id: id,
      origem: z.url().refine((v) => {
        const u = new URL(v);
        return (
          ["https:", "http:"].includes(u.protocol) &&
          !u.username &&
          !u.password &&
          !u.search &&
          !u.hash &&
          u.pathname === "/"
        );
      }),
    })
    .parse(entrada);
  exigirParticipante(f, usuaria_id);
  if (f.status !== "aceita" || !f.horario)
    throw new ErroDominio(
      "Confirme o horário da Faísca antes de adicionar ao calendário.",
      409,
    );
  const data = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const escapar = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const url = new URL("/piloto", origem);
  url.searchParams.set("aba", "faiscas");
  url.searchParams.set("encontro", f.id);
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tecida//Faiscas//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${f.id}@entreelas.app`,
    `DTSTAMP:${data(f.updated_at)}`,
    `DTSTART:${data(f.horario)}`,
    `DTEND:${data(new Date(Date.parse(f.horario) + 20 * 60000).toISOString())}`,
    `SUMMARY:${escapar("Faísca · " + f.tema.slice(0, 120))}`,
    `DESCRIPTION:${escapar("Conversa de 20 minutos. Abra sua conta na Tecida para acessar a Faísca. Este arquivo não envia convites nem confirma presença.")}`,
    `URL:${url.href}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const conteudo =
    linhas
      .map((l) => {
        let out = "",
          atual = "",
          bytes = 0;
        for (const c of l) {
          const n = new TextEncoder().encode(c).length;
          if (bytes + n > 74) {
            out += atual + "\r\n ";
            atual = "";
            bytes = 1;
          }
          atual += c;
          bytes += n;
        }
        return out + atual;
      })
      .join("\r\n") + "\r\n";
  return z
    .object({ nome: z.string(), conteudo: z.string() })
    .parse({ nome: `faisca-${f.id}.ics`, conteudo });
}
