import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as s from "@/lib/schemas/entities";
import { ANA, criarDemonstracao, idDemo } from "@/lib/piloto/demonstracao/dados";
import { criarSimulador } from "@/lib/piloto/demonstracao/simulador";
import { indicadoresPilotoSchema } from "@/lib/piloto/metricas";

type Indicacao = { profile_id: string; motivo: string; evidencias: string[] };

describe("demonstração pública do piloto", () => {
  it("monta uma rede fictícia que respeita os contratos do app", () => {
    const { dados, indicadores } = criarDemonstracao();
    expect(z.array(s.profile).parse(dados.pessoas).length).toBeGreaterThan(10);
    z.array(s.faisca).parse(dados.faiscas);
    z.array(s.post).parse(dados.posts);
    z.array(s.event).parse(dados.eventos);
    z.array(s.saber).parse(dados.saberes);
    indicadoresPilotoSchema.parse(indicadores);
    expect(new Set(dados.faiscas.map((f) => f.status))).toEqual(
      new Set(["pendente", "aceita", "realizada"]),
    );
  });

  it("indica pessoas com vagas, nunca a própria visitante, citando evidências", async () => {
    const estado = criarDemonstracao();
    const api = criarSimulador(estado);
    const indicacoes = (await api("/api/faiscas/buscar", {
      pedido: "Vou apresentar indicadores à diretoria pela primeira vez",
    })) as Indicacao[];
    expect(indicacoes.length).toBeGreaterThan(0);
    expect(indicacoes.length).toBeLessThanOrEqual(3);
    for (const i of indicacoes) {
      expect(i.profile_id).not.toBe(ANA);
      expect(estado.dados.disponibilidade[i.profile_id].estado).toBe("aberta");
      expect(i.evidencias[0]).toContain("declara no perfil");
    }
  });

  it("só a convidada aceita e não há convite para quem pausou", async () => {
    const api = criarSimulador(criarDemonstracao());
    await expect(
      api("/api/faiscas/aceitar", {
        faisca_id: idDemo(106),
        horario: new Date().toISOString(),
      }),
    ).rejects.toThrow("Só a convidada");
    await expect(
      api("/api/faiscas", {
        convidada_id: idDemo(10),
        pedido: "Quero aprender sobre regulação",
        tema: "Regulação",
        horarios_propostos: [new Date().toISOString()],
      }),
    ).rejects.toThrow("não está recebendo convites");
  });

  it("a dica só é publicada depois que as duas autorizam", async () => {
    const estado = criarDemonstracao();
    const api = criarSimulador(estado);
    const faisca_id = idDemo(104);
    await expect(api("/api/faiscas/publicar", { faisca_id })).rejects.toThrow(
      "as duas autorizam",
    );
    await api("/api/faiscas/autorizar", { faisca_id, resumo: {} });
    await api("/api/faiscas/publicar", { faisca_id });
    expect(
      estado.dados.posts.some((p) => p.origem_faisca_id === faisca_id),
    ).toBe(true);
  });

  it("não chama rotas fora da demonstração", async () => {
    const api = criarSimulador(criarDemonstracao());
    await expect(api("/api/auth/sair", {})).rejects.toThrow(
      "não está disponível na demonstração",
    );
  });
});
