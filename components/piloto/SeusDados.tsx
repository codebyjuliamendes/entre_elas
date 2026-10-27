"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { api, emDemonstracao } from "@/lib/piloto/browser";
import { baixarArquivo } from "@/lib/browser/arquivo";
import type { DadosPiloto } from "@/lib/piloto/dados";

const CONFIRMACAO = "EXCLUIR";

/** Direitos de acesso e exclusão (LGPD) ao alcance da própria participante. */
export function SeusDados({ dados: d }: { dados: DadosPiloto }) {
  const router = useRouter();
  const demonstracao = emDemonstracao();
  const [abrirExclusao, setAbrirExclusao] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ texto: "", erro: false });
  const dia = new Date().toISOString().slice(0, 10);

  async function baixar() {
    setBusy(true);
    setStatus({ texto: "", erro: false });
    try {
      // Na demonstração não há servidor: a cópia sai do que está na tela, avisando que é fictícia.
      const copia = demonstracao
        ? { aviso: "Dados fictícios da demonstração.", perfil: d.perfil, faiscas: d.faiscas, saberes: d.saberes }
        : await api("/api/piloto/exportar", {});
      baixarArquivo(`tecida-meus-dados-${dia}.json`, JSON.stringify(copia, null, 2), "application/json");
      setStatus({ texto: "Arquivo baixado.", erro: false });
    } catch (e) {
      setStatus({ texto: e instanceof Error ? e.message : "Não foi possível baixar.", erro: true });
    } finally {
      setBusy(false);
    }
  }

  async function excluir() {
    setBusy(true);
    setStatus({ texto: "", erro: false });
    try {
      await api("/api/piloto/excluir-conta", { confirmacao });
      router.replace("/entrar?conta=excluida");
    } catch (e) {
      setStatus({ texto: e instanceof Error ? e.message : "Não foi possível excluir.", erro: true });
      setBusy(false);
    }
  }

  return (
    <section className="pilot-card pilot-seus-dados" aria-labelledby="seus-dados-titulo">
      <h2 id="seus-dados-titulo">Seus dados</h2>
      <p>
        Você pode baixar uma cópia de tudo o que é seu aqui ou apagar sua conta a qualquer momento.
      </p>
      <button type="button" disabled={busy} onClick={() => void baixar()}>
        <Download size={16} aria-hidden="true" /> Baixar meus dados
      </button>
      {!abrirExclusao ? (
        <button
          type="button"
          className="pilot-perigo"
          disabled={busy}
          onClick={() => setAbrirExclusao(true)}
        >
          <Trash2 size={16} aria-hidden="true" /> Excluir minha conta
        </button>
      ) : (
        <div className="pilot-exclusao" role="group" aria-labelledby="exclusao-titulo">
          <h3 id="exclusao-titulo">Excluir conta</h3>
          <ul>
            <li>Seu perfil, saberes, mensagens, comentários e publicações são apagados.</li>
            <li>Convites e Faíscas ainda não realizados são cancelados.</li>
            <li>Nas Faíscas que já aconteceram, a outra pessoa mantém as anotações dela; você aparece como “Participante removida”.</li>
            <li>Uma dica escrita em dupla continua com a outra autora.</li>
          </ul>
          {demonstracao ? (
            <p className="input-hint">Na demonstração nada é apagado: crie uma conta para usar este recurso.</p>
          ) : (
            <>
              <label htmlFor="confirmar-exclusao">
                Para confirmar, digite <strong>{CONFIRMACAO}</strong>
              </label>
              <input
                id="confirmar-exclusao"
                value={confirmacao}
                autoComplete="off"
                onChange={(e) => setConfirmacao(e.target.value)}
              />
              <button
                type="button"
                className="pilot-perigo"
                disabled={busy || confirmacao.trim().toUpperCase() !== CONFIRMACAO}
                onClick={() => void excluir()}
              >
                Excluir definitivamente
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAbrirExclusao(false);
              setConfirmacao("");
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      {status.texto && (
        <p role={status.erro ? "alert" : "status"} className={status.erro ? "aviso aviso-erro" : "input-hint"}>
          {status.texto}
        </p>
      )}
    </section>
  );
}
