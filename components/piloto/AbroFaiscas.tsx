"use client";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/piloto/browser";
import {
  OPCOES_FAISCAS_POR_MES,
  descreverDisponibilidade,
  type Disponibilidade,
} from "@/lib/domain/disponibilidade";
// Quem oferece ajuda decide quanto pode oferecer; a curadoria respeita esse limite.
export function AbroFaiscas({
  atual,
  atualizar,
}: {
  atual: Disponibilidade;
  atualizar: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function escolher(n: number) {
    setBusy(true);
    try {
      await api("/api/piloto/disponibilidade", { faiscas_por_mes: n });
      await atualizar();
      toast.success(
        n ? `Você abriu até ${n} Faíscas por mês.` : "Novos convites pausados.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pilot-card" aria-labelledby="abro-faiscas">
      <h2 id="abro-faiscas">Abro Faíscas</h2>
      <p>
        Quantos convites você topa receber a cada 30 dias? Quando as vagas
        acabam, a curadoria deixa de indicar você e sugere outras pessoas.
      </p>
      <div className="pilot-escolhas" role="group" aria-label="Faíscas por mês">
        {OPCOES_FAISCAS_POR_MES.map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            aria-pressed={atual.limite === n}
            onClick={() => void escolher(n)}
          >
            {n === 0 ? "Pausar" : `Até ${n}`}
          </button>
        ))}
      </div>
      <p className="input-hint">Agora: {descreverDisponibilidade(atual)}.</p>
    </section>
  );
}
