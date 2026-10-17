import { describe, it, expect } from "vitest";
import { calendarioFaisca } from "@/lib/domain/faisca-calendario";
import { faisca } from "@/lib/schemas/entities";
import { uuid } from "@/scripts/fixtures";
import { validarRespostaConvite } from "@/lib/domain/regras";
const base = faisca.parse({
  id: uuid(980),
  created_at: "2026-10-16T12:00:00Z",
  updated_at: "2026-10-16T12:00:00Z",
  solicitante_id: uuid(1),
  convidada_id: uuid(2),
  pedido: "Pedido privado",
  tema: "Dados; decisões, próximas ações\n" + "ação ".repeat(35),
  horarios_propostos: ["2050-01-01T12:00:00Z"],
  horario: "2050-01-01T12:00:00Z",
  status: "aceita",
  pauta: null,
  anotacoes: { [uuid(1)]: "Anotação confidencial" },
  resumo: null,
  publicacao_autorizada_por: [],
  stream_channel_id: "canal-privado",
  daily_room_url: "https://sala.daily.co/privada",
});
const gerar = (
  encontro = base,
  pessoa = uuid(1),
  origem = "https://entreelas.exemplo.com",
) => calendarioFaisca({ encontro, usuaria_id: pessoa, origem });
describe("Calendário real da Faísca", () => {
  it("exporta vinte minutos em UTC e link autenticado, sem chat, token ou anotações", () => {
    const ics = gerar().conteudo;
    expect(ics).toContain("DTSTART:20500101T120000Z\r\nDTEND:20500101T122000Z");
    expect(ics.replace(/\r\n /g, "")).toContain(
      `/piloto?aba=faiscas&encontro=${base.id}`,
    );
    for (const privado of [
      "Anotação confidencial",
      "Pedido privado",
      "canal-privado",
      "sala.daily.co",
      "fictício",
    ])
      expect(ics).not.toContain(privado);
    expect(gerar().nome).toBe(`faisca-${base.id}.ics`);
  });
  it("escapa conteúdo e respeita o limite por bytes de linhas UTF-8", () => {
    const ics = gerar().conteudo;
    expect(ics).toContain("Dados\\; decisões\\, próximas ações\\n");
    for (const linha of ics.split("\r\n"))
      expect(new TextEncoder().encode(linha).length).toBeLessThanOrEqual(75);
  });
  it("não exporta convite pendente nem encontro alheio ou origem com credenciais", () => {
    expect(() => gerar({ ...base, status: "pendente" })).toThrow("Confirme");
    expect(() => gerar(base, uuid(3))).toThrow("participantes");
    expect(() => gerar(base, uuid(1), "https://segredo@exemplo.com")).toThrow();
  });
  it("recusa um horário expirado mesmo que estivesse no convite", () => {
    const h = "2020-01-01T12:00:00Z";
    expect(() =>
      validarRespostaConvite(
        { ...base, status: "pendente", horarios_propostos: [h] },
        uuid(2),
        h,
      ),
    ).toThrow("já passou");
  });
});
