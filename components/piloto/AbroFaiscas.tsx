"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/piloto/browser";
import {
  OPCOES_FAISCAS_POR_MES,
  descreverDisponibilidade,
  type Disponibilidade,
} from "@/lib/domain/disponibilidade";
const rotulo = (n: number) =>
  n === 0 ? "Pausar convites" : `Até ${n} por mês`;
const descricao = (n: number) =>
  n === 0 ? "Não receber convites por enquanto" : `Receber até ${n} convites`;
// Quem oferece ajuda decide quanto pode oferecer; a curadoria respeita esse limite.
export function AbroFaiscas({
  atual,
  atualizar,
}: {
  atual: Disponibilidade;
  atualizar: () => Promise<void>;
}) {
  const [escolha, setEscolha] = useState(atual.limite),
    [busy, setBusy] = useState(false);
  async function salvar() {
    setBusy(true);
    try {
      await api("/api/piloto/disponibilidade", { faiscas_por_mes: escolha });
      await atualizar();
      toast.success(
        escolha
          ? `Você abriu até ${escolha} Faíscas por mês.`
          : "Novos convites pausados.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pilot-card abro-faiscas" aria-labelledby="abro-faiscas">
      <h2 id="abro-faiscas">Configurar disponibilidade</h2>
      <p className="abro-faiscas-sub">
        Escolha quantos convites você topa receber por mês. Quando as vagas
        acabam, a curadoria indica outras pessoas.
      </p>
      <div
        className="abro-opcoes"
        role="radiogroup"
        aria-label="Faíscas por mês"
      >
        {OPCOES_FAISCAS_POR_MES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={escolha === n}
            className="abro-opcao"
            disabled={busy}
            onClick={() => setEscolha(n)}
          >
            <span>
              <strong>{rotulo(n)}</strong>
              <small>{descricao(n)}</small>
            </span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <button
        type="button"
        className="abro-salvar"
        disabled={busy || escolha === atual.limite}
        onClick={() => void salvar()}
      >
        Salvar preferência
      </button>
      <p className="input-hint">Agora: {descreverDisponibilidade(atual)}.</p>
    </section>
  );
}
