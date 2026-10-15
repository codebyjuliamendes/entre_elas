import { describe, it, expect } from "vitest";
import {
  diaLocal,
  inicioSemana,
  deslocarDia,
  criarIcs,
} from "@/lib/demo/calendario";
import { filtrarPessoas, recomendarPessoa } from "@/lib/demo/descoberta";
import { ANA_ID } from "@/lib/demo/catalogo";
describe("Calendário em São Paulo", () => {
  it("converte a virada de dia sem usar o fuso do servidor", () => {
    expect(diaLocal(new Date("2026-10-16T01:00:00Z"))).toBe("2026-10-15");
    expect(inicioSemana("2026-11-01")).toBe("2026-10-26");
    expect(deslocarDia("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("exporta UTC, escapa campos e não permite injetar linhas em ICS", () => {
    const ics = criarIcs({
      id: "exemplo",
      titulo: "Café, projetos; novas ideias\nBEGIN:VEVENT",
      descricao: "Troca de experiências",
      inicio: "2026-10-15T14:00:00-03:00",
      duracao: 20,
    });
    expect(ics).toContain("DTSTART:20261015T170000Z");
    expect(ics).toContain("DTEND:20261015T172000Z");
    expect(ics).toContain("Café\\, projetos\\;");
    expect(ics.match(/^BEGIN:VEVENT$/gm)).toHaveLength(1);
    for (const line of ics.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
describe("Descoberta com catálogo e evidências", () => {
  it("busca sem acentos e combina área e regional", () => {
    expect(filtrarPessoas({ busca: "automacao" }).map((p) => p.slug)).toContain(
      "helena",
    );
    expect(
      filtrarPessoas({ area: "Dados", regional: "Pará" }).map((p) => p.slug),
    ).toEqual(["daniela"]);
    expect(filtrarPessoas({ busca: "nada-inexistente" })).toEqual([]);
  });
  it("sugere competências específicas sem indicar a solicitante", () => {
    for (const [pedido, slug] of [
      ["Quero aprender energia solar", "fernanda"],
      ["Preciso de mentoria para liderar", "gabriela"],
      ["Quero aprender segurança em campo", "beatriz"],
      ["Preciso apresentar um projeto à diretoria", "carla"],
      ["Quero entender dados e planilhas", "daniela"],
    ]) {
      const p = recomendarPessoa(pedido);
      expect(p.slug).toBe(slug);
      expect(p.id).not.toBe(ANA_ID);
      expect(p.evidencia.length).toBeGreaterThan(10);
    }
  });
});
