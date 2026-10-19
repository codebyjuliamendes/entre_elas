"use client";
import { useState, type FormEvent } from "react";
import type { Profile } from "@/lib/schemas/entities";
import type { EstadoIndexacao } from "@/lib/domain/perfil-indexacao";
import { api } from "@/lib/piloto/browser";
import { toast } from "sonner";
const campos = [
  ["nome", "Seu nome"],
  ["cargo", "Cargo ou ocupação"],
  ["area", "Área"],
  ["cidade", "Cidade"],
  ["regional", "Regional"],
] as const;
export function PerfilPiloto({
  perfil,
  ia,
  atualizar,
  concluir = false,
  indexacao,
  objetivoInicial = "",
}: {
  perfil: Profile;
  ia: boolean;
  atualizar: () => Promise<void>;
  concluir?: boolean;
  indexacao: EstadoIndexacao;
  /** Pedido feito na primeira tela; vira o primeiro objetivo se não houver outro. */
  objetivoInicial?: string;
}) {
  const [form, setForm] = useState(
      Object.fromEntries(
        campos.map(([k]) => [
          k,
          ["A preencher", "Nova participante"].includes(perfil[k])
            ? ""
            : perfil[k],
        ]),
      ) as Record<(typeof campos)[number][0], string>,
    ),
    [saberes, setSaberes] = useState(perfil.interesses.join(", ")),
    [objetivos, setObjetivos] = useState(
      perfil.objetivos.length
        ? perfil.objetivos.join("\n")
        : objetivoInicial.trim().replace(/\s+/g, " ").slice(0, 160),
    ),
    [relato, setRelato] = useState(""),
    [busy, setBusy] = useState(false),
    [sugerido, setSugerido] = useState(false);
  async function salvar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/piloto/perfil", {
        ...form,
        interesses: saberes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        objetivos: objetivos
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if (ia) {
        try {
          await api("/api/piloto/indexar", {});
        } catch {
          toast.warning(
            "Seu perfil foi salvo. A indexação da busca não terminou; tente atualizar seus saberes depois no perfil.",
          );
        }
      }
      if (concluir) await api("/api/piloto/onboarding", {});
      await atualizar();
      toast.success("Perfil salvo no servidor.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function sugerir() {
    setBusy(true);
    try {
      const p = await api<Profile>("/api/piloto/perfil-ia", { texto: relato });
      setForm({
        nome: p.nome,
        cargo: p.cargo,
        area: p.area,
        cidade: p.cidade,
        regional: p.regional,
      });
      setSaberes(p.interesses.join(", "));
      setObjetivos(p.objetivos.join("\n"));
      setSugerido(true);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "IA indisponível. Preencha manualmente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pilot-card">
      <h2>Conte sua experiência, do seu jeito</h2>
      {ia && (
        <>
          <label htmlFor="relato-perfil">
            Conte brevemente o que faz, o que sabe e o que quer aprender
          </label>
          <textarea
            id="relato-perfil"
            value={relato}
            minLength={20}
            maxLength={2000}
            onChange={(e) => setRelato(e.target.value)}
          />
          <button
            disabled={busy || relato.trim().length < 20}
            onClick={() => void sugerir()}
          >
            Sugerir meu perfil com IA
          </button>
        </>
      )}
      {sugerido && (
        <p role="status">
          Este é um rascunho da IA. Revise os campos e confirme somente o que
          representa você.
        </p>
      )}
      <form onSubmit={salvar}>
        {campos.map(([k, label]) => (
          <div key={k}>
            <label htmlFor={`perfil-${k}`}>{label}</label>
            <input
              id={`perfil-${k}`}
              required
              minLength={2}
              maxLength={100}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </div>
        ))}
        <label htmlFor="perfil-saberes">Saberes que pode compartilhar</label>
        <input
          id="perfil-saberes"
          value={saberes}
          maxLength={647}
          onChange={(e) => setSaberes(e.target.value)}
        />
        <p className="input-hint">
          Até oito saberes, separados por vírgula, com até 80 caracteres cada.
        </p>
        <label htmlFor="perfil-objetivos">O que quer aprender</label>
        <textarea
          id="perfil-objetivos"
          value={objetivos}
          maxLength={804}
          onChange={(e) => setObjetivos(e.target.value)}
        />
        <p className="input-hint">
          Até cinco objetivos, um por linha. As outras pessoas do piloto podem
          ver seu perfil e sua foto.
        </p>
        <button className="pilot-button" disabled={busy}>
          {concluir ? "Salvar perfil e começar" : "Salvar meu perfil"}
        </button>
      </form>
      {ia && (
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void api<{ indexados: number }>("/api/piloto/indexar", {})
              .then(async (r) => {
                await atualizar();
                if (r.indexados)
                  toast.success(
                    "Seus saberes estão disponíveis para a busca com IA.",
                  );
                else
                  toast.info(
                    "Adicione ao menos um saber ao perfil para aparecer na busca.",
                  );
              })
              .catch((e) => toast.error(e.message))
              .finally(() => setBusy(false));
          }}
        >
          Atualizar meus saberes na busca com IA
        </button>
      )}
      <section className="pilot-card" aria-label="Seu perfil na busca com IA">
        <h3>Seu perfil na busca com IA</h3>
        <p role="status">
          {
            {
              sem_consentimento:
                "Você continua na lista de pessoas. Autorize a IA para participar das indicações automáticas.",
              sem_saberes:
                "Adicione os saberes que deseja compartilhar e salve seu perfil.",
              pendente: `${indexacao.indexados} de ${indexacao.total} saberes indexados. Atualize a busca para incluir os que faltam.`,
              pronto: `${indexacao.indexados} saberes indexados. Seu perfil pode ser considerado pela curadoria; cada indicação depende do pedido.`,
            }[indexacao.estado]
          }
        </p>
        {indexacao.estado === "pendente" && (
          <p>Falta indexar: {indexacao.pendentes.join(", ")}.</p>
        )}
        <p className="input-hint">
          Este status corresponde ao perfil salvo no servidor. Alterações no
          formulário precisam ser salvas.
        </p>
      </section>
      <p className="input-hint">
        Salvar é independente da IA. Depois de salvar, atualize a busca para
        indexar suas experiências. Sem IA, as pessoas ainda podem encontrar e
        convidar você pela lista.
      </p>
    </section>
  );
}
