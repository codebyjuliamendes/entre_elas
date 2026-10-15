import { z } from "zod";
export const FUSO = "America/Sao_Paulo";
export function diaLocal(data = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function dataCivil(dia: string): Date {
  return new Date(z.iso.date().parse(dia) + "T12:00:00Z");
}
export function deslocarDia(dia: string, offset: number): string {
  const d = dataCivil(dia);
  d.setUTCDate(d.getUTCDate() + z.number().int().parse(offset));
  return d.toISOString().slice(0, 10);
}
export function inicioSemana(dia: string): string {
  const d = dataCivil(dia);
  return deslocarDia(dia, -((d.getUTCDay() + 6) % 7));
}
export function baixarArquivo(nome: string, texto: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function criarIcs(entrada: unknown): string {
  const input = z
    .object({
      id: z.string().min(1).max(100),
      titulo: z.string().min(1).max(160),
      descricao: z.string().max(5000),
      inicio: z.iso.datetime({ offset: true }),
      duracao: z.number().int().min(1).max(1440),
    })
    .parse(entrada);
  const inicio = new Date(input.inicio),
    fim = new Date(inicio.getTime() + input.duracao * 60000);
  const data = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const escapar = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Entre Elas//Agenda demonstrativa//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapar(input.id.replace(/[^a-zA-Z0-9-]/g, ""))}@entre-elas.local`,
    `DTSTAMP:${data(inicio)}`,
    `DTSTART:${data(inicio)}`,
    `DTEND:${data(fim)}`,
    `SUMMARY:${escapar(input.titulo)}`,
    `DESCRIPTION:${escapar(input.descricao + "\nEvento fictício da apresentação Entre Elas.")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return (
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
      .join("\r\n") + "\r\n"
  );
}
