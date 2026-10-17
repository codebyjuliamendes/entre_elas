import {
  listarRelatos,
  relatarProblema,
  resolverRelato,
} from "@/lib/piloto/relatos";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { getDb, verificarErro } from "@/lib/db/client";
import { salvarPerfilPiloto, consentirIA } from "@/lib/piloto/acoes";
import { comContextoIA, identificarIA, consumirIA } from "@/lib/piloto/ia";
import * as faisca from "@/lib/domain/faisca";
vi.mock("@/lib/integrations/stream", () => ({
  sincronizarPerfil: vi.fn().mockRejectedValue(new Error("offline")),
  criarCanal: vi.fn(),
}));
vi.mock("@/lib/integrations/daily", () => ({
  criarSala: vi.fn().mockRejectedValue(new Error("offline")),
  tokenSala: vi.fn(),
  encerrarSala: vi.fn(),
}));
const enabled = process.env.TEST_DATABASE === "true";
describe.skipIf(!enabled)(
  "Piloto com Postgres real e serviços externos simulados",
  () => {
    const auths = [randomUUID(), randomUUID()];
    const pids: string[] = [];
    const fids: string[] = [];
    const chave = "teste:" + randomUUID();
    beforeAll(async () => {
      if (
        new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname !== "127.0.0.1"
      )
        throw new Error("Somente banco local");
      vi.stubEnv("APP_MODE", "piloto");
      for (const auth of auths) {
        const { data, error } = await getDb().rpc("piloto_provisionar", {
          auth_id: auth,
        });
        verificarErro(error);
        pids.push(data!);
        await getDb()
          .from("piloto_contas")
          .update({ onboarding: true })
          .eq("profile_id", data!);
      }
    });
    afterAll(async () => {
      await getDb().from("piloto_mensagens").delete().in("faisca_id", fids);
      await getDb().from("posts").delete().in("origem_faisca_id", fids);
      await getDb().from("ia_jobs").delete().in("profile_id", pids);
      await getDb().from("faiscas").delete().in("id", fids);
      await getDb().from("piloto_contas").delete().in("auth_user_id", auths);
      await getDb()
        .from("piloto_limites")
        .delete()
        .in("chave", [
          chave,
          ...pids.map((p) => "ia:" + p),
          ...pids.map((p) => "relato:" + p),
        ]);
      await getDb().from("profiles").delete().in("id", pids);
      vi.unstubAllEnvs();
    });
    it("provisionamento concorrente cria um perfil próprio, sem assumir o seed", async () => {
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          getDb().rpc("piloto_provisionar", { auth_id: auths[0] }),
        ),
      );
      for (const r of results) {
        verificarErro(r.error);
        expect(r.data).toBe(pids[0]);
      }
      expect(pids[0]).not.toBe(auths[0]);
      expect(pids[0]).not.toBe("00000000-0000-4000-8000-000000000001");
    });
    it("limite distribuído é atômico sob concorrência", async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          getDb().rpc("piloto_consumir", {
            chave_input: chave,
            janela_input: "2026-10-15T00:00:00Z",
            limite_input: 5,
          }),
        ),
      );
      results.forEach((r) => verificarErro(r.error));
      expect(results.filter((r) => r.data === true)).toHaveLength(5);
    });
    it("IA exige identidade e consentimento e respeita revogação", async () => {
      await expect(consumirIA()).rejects.toThrow("conta verificada");
      await comContextoIA(async () => {
        identificarIA(pids[0]);
        await expect(consumirIA()).rejects.toThrow("Autorize");
        await consentirIA(pids[0], true);
        await expect(consumirIA()).resolves.toBeUndefined();
        await consentirIA(pids[0], false);
        await expect(consumirIA()).rejects.toThrow("Autorize");
      });
    });
    it("perfil persiste sem IA e ignora tentativa de alterar identidade", async () => {
      await salvarPerfilPiloto(
        {
          id: pids[1],
          nome: "Pessoa do piloto",
          cargo: "Analista",
          area: "Dados",
          cidade: "Recife",
          regional: "Nordeste",
          interesses: ["Indicadores"],
          objetivos: ["Aprender liderança"],
        },
        pids[0],
      );
      const { data, error } = await getDb()
        .from("profiles")
        .select("nome")
        .eq("id", pids[0])
        .single();
      verificarErro(error);
      expect(data?.nome).toBe("Pessoa do piloto");
    });
    it("convite para seed é recusado; aceite e publicação exigem as duas contas", async () => {
      const base = {
        chave_pedido: randomUUID(),
        solicitante_id: pids[0],
        convidada_id: pids[1],
        pedido: "Quero conversar sobre indicadores",
        tema: "Indicadores na prática",
        horarios_propostos: [new Date(Date.now() + 86400000).toISOString()],
      };
      await expect(
        faisca.criarFaisca(
          { ...base, convidada_id: "00000000-0000-4000-8000-000000000002" },
          pids[0],
        ),
      ).rejects.toThrow("perfil concluído");
      const f = await faisca.criarFaisca(base, pids[0]);
      fids.push(f.id);
      await expect(
        faisca.aceitarFaisca(
          { faisca_id: f.id, horario: base.horarios_propostos[0] },
          pids[0],
        ),
      ).rejects.toThrow("convidada");
      await faisca.aceitarFaisca(
        { faisca_id: f.id, horario: base.horarios_propostos[0] },
        pids[1],
      );
      await faisca.registrarAnotacoes(
        {
          faisca_id: f.id,
          texto: "Aprendi a escolher indicadores para uma decisão.",
        },
        pids[0],
      );
      await faisca.registrarAnotacoes(
        {
          faisca_id: f.id,
          texto: "Compartilhei como analisar a qualidade dos dados.",
        },
        pids[1],
      );
      await faisca.concluirManualmente(
        {
          faisca_id: f.id,
          texto:
            "Definir a decisão antes dos indicadores ajuda a manter o foco.",
        },
        pids[0],
      );
      const versao = await faisca.obterFaisca(f.id, pids[0]);
      await faisca.autorizarPiloto(
        { faisca_id: f.id, resumo: versao.resumo },
        pids[0],
      );
      await expect(faisca.publicarComoDica(f.id, pids[0])).rejects.toThrow(
        "duas participantes",
      );
      await faisca.revisarResumoPiloto(
        {
          faisca_id: f.id,
          texto:
            "Uma revisão fundamentada: conferir a qualidade das fontes antes de selecionar os indicadores.",
        },
        pids[1],
      );
      await expect(
        faisca.autorizarPiloto(
          { faisca_id: f.id, resumo: versao.resumo },
          pids[0],
        ),
      ).rejects.toThrow("síntese mudou");
      const atual = await faisca.obterFaisca(f.id, pids[0]);
      expect(atual.publicacao_autorizada_por).toHaveLength(0);
      await faisca.autorizarPiloto(
        { faisca_id: f.id, resumo: atual.resumo },
        pids[0],
      );
      await faisca.autorizarPiloto(
        { faisca_id: f.id, resumo: atual.resumo },
        pids[1],
      );
      const a = await faisca.publicarComoDica(f.id, pids[0]);
      const b = await faisca.publicarComoDica(f.id, pids[1]);
      expect(a.id).toBe(b.id);
    });
    it("repetir um envio concorrente não duplica o convite e não permite trocar seu conteúdo", async () => {
      const base = {
        chave_pedido: randomUUID(),
        solicitante_id: pids[0],
        convidada_id: pids[1],
        pedido: "Compartilhar experiências com indicadores",
        tema: "Indicadores",
        horarios_propostos: [new Date(Date.now() + 86400000).toISOString()],
      };
      const resultados = await Promise.all(
        Array.from({ length: 8 }, () => faisca.criarFaisca(base, pids[0])),
      );
      fids.push(resultados[0].id);
      expect(new Set(resultados.map((f) => f.id)).size).toBe(1);
      await expect(
        faisca.criarFaisca(
          { ...base, pedido: "Um pedido diferente com a mesma chave" },
          pids[0],
        ),
      ).rejects.toThrow("outro convite");
      const { count, error } = await getDb()
        .from("faiscas")
        .select("id", { count: "exact", head: true })
        .eq("solicitante_id", pids[0])
        .eq("chave_pedido", base.chave_pedido);
      verificarErro(error);
      expect(count).toBe(1);
    });
    it("busca do piloto exclui o catálogo fictício", async () => {
      const vetor = JSON.stringify([1, ...Array(767).fill(0)]);
      const { data, error } = await getDb().rpc("buscar_saberes_piloto", {
        query_embedding: vetor,
        limite: 10,
        excluir_profile_id: pids[0],
      });
      verificarErro(error);
      expect(data?.every((p) => pids.includes(p.profile_id))).toBe(true);
    });
    it("indexa o conjunto completo com snapshot e rejeita alteração concorrente", async () => {
      await consentirIA(pids[0], true);
      await getDb()
        .from("profiles")
        .update({ interesses: ["Primeiro", "Segundo"] })
        .eq("id", pids[0]);
      const leitura = await getDb()
        .from("profiles")
        .select("*")
        .eq("id", pids[0])
        .single();
      verificarErro(leitura.error);
      const vetor = JSON.stringify([1, ...Array(767).fill(0)]); // Vetor sintético somente neste teste local.
      const args = {
        usuaria_id: pids[0],
        perfil_lido: leitura.data!,
        saberes_input: [
          { saber: "Primeiro", embedding: vetor },
          { saber: "Segundo", embedding: "[1,2]" },
        ],
      };
      expect(
        (await getDb().rpc("piloto_indexar_perfil", args)).error,
      ).not.toBeNull();
      const antes = await getDb()
        .from("saberes")
        .select("id")
        .eq("profile_id", pids[0])
        .eq("fonte", "perfil")
        .eq("saber", "Primeiro");
      expect(antes.data).toHaveLength(0);
      args.saberes_input[1].embedding = vetor;
      const r = await getDb().rpc("piloto_indexar_perfil", args);
      verificarErro(r.error);
      expect(r.data).toEqual({ ok: true, indexados: 2 });
      await getDb()
        .from("profiles")
        .update({ interesses: ["Terceiro"] })
        .eq("id", pids[0]);
      expect(
        (await getDb().rpc("piloto_indexar_perfil", args)).error?.message,
      ).toContain("mudou");
      const busca = await getDb().rpc("buscar_saberes_piloto", {
        query_embedding: vetor,
        limite: 10,
        excluir_profile_id: pids[1],
      });
      verificarErro(busca.error);
      expect(busca.data?.some((p) => p.profile_id === pids[0])).toBe(false);
      await consentirIA(pids[0], false);
      expect(
        (await getDb().rpc("piloto_indexar_perfil", args)).error?.message,
      ).toContain("Autorize");
    });
    it("relatos são privados, ignoram autoria forjada e só liderança pode resolver", async () => {
      const r = await relatarProblema(pids[0], {
        categoria: "ia",
        descricao: "Não encontrei uma conexão para meu pedido de teste.",
        profile_id: pids[1],
      });
      expect(r.profile_id).toBe(pids[0]);
      expect(
        (await listarRelatos(pids[0], false)).some((x) => x.id === r.id),
      ).toBe(true);
      expect(
        (await listarRelatos(pids[1], false)).some((x) => x.id === r.id),
      ).toBe(false);
      expect(
        (await listarRelatos(pids[1], true)).some((x) => x.id === r.id),
      ).toBe(true);
      await expect(
        resolverRelato({ relato_id: r.id, resolvido: true }, false),
      ).rejects.toMatchObject({ status: 403 });
      expect(
        (await resolverRelato({ relato_id: r.id, resolvido: true }, true))
          .estado,
      ).toBe("resolvido");
    });
  },
);
