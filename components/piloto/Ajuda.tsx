"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, dataHora } from "@/lib/piloto/browser";
import type { Relato } from "@/lib/piloto/relatos";
import { toast } from "sonner";
const categorias = {
  acesso: "Entrada na conta",
  ia: "Curadoria e IA",
  convite: "Convites e horários",
  chat: "Mensagens",
  video: "Áudio ou vídeo",
  perfil: "Meu perfil",
  outro: "Outro assunto",
};
export function Ajuda({
  lider,
  pessoas,
}: {
  lider: boolean;
  pessoas: { id: string; nome: string }[];
}) {
  const [categoria, setCategoria] = useState("ia"),
    [descricao, setDescricao] = useState(""),
    [itens, setItens] = useState<Relato[]>([]),
    [busy, setBusy] = useState(false),
    [erro, setErro] = useState(""),
    [carregando, setCarregando] = useState(true);
  const carregar = useCallback(async () => {
    try {
      setItens(await api<Relato[]>("/api/piloto/relatos", {}));
      setErro("");
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível consultar seus relatos.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void carregar(), 0);
    return () => clearTimeout(t);
  }, [carregar]);
  async function enviar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/piloto/relatar", { categoria, descricao });
      setDescricao("");
      await carregar();
      toast.success("Relato salvo para acompanhamento pela liderança.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Precisa de ajuda?</h1>
      <section className="pilot-card">
        <h2>Você pode continuar mesmo quando uma integração falha</h2>
        <details>
          <summary>Não recebi o link de entrada</summary>
          <p>
            Confira o e-mail digitado e o spam. Solicite um novo link e abra no
            mesmo navegador e dispositivo. O envio depende do provedor de
            e-mail; este formulário não reenvia links.
          </p>
        </details>
        <details>
          <summary>A IA não encontrou uma conexão</summary>
          <p>
            Descreva uma situação concreta e a habilidade que precisa. A outra
            pessoa precisa ter saberes indexados e autorizar a IA. Você também
            pode escolher uma pessoa diretamente na rede.
          </p>
        </details>
        <details>
          <summary>Não consegui entrar na chamada</summary>
          <p>
            Confira a permissão de câmera e microfone do navegador. Vocês podem
            continuar pelo chat. A Faísca permanece salva se a integração de
            vídeo estiver indisponível.
          </p>
        </details>
        <details>
          <summary>Minha síntese não representa a conversa</summary>
          <p>
            Revise o texto antes de autorizar. Vocês podem escrever uma síntese
            manual. Uma revisão exige novas autorizações das duas pessoas.
          </p>
        </details>
      </section>
      <form className="pilot-card" onSubmit={enviar}>
        <h2>Relatar um problema</h2>
        <p>
          O relato fica privado para você e a liderança. Não é enviado à IA nem
          a outras participantes. Não há atendimento automático ou garantia de
          resposta imediata.
        </p>
        <label htmlFor="relato-categoria">Onde aconteceu?</label>
        <select
          id="relato-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          disabled={busy}
        >
          {Object.entries(categorias).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="relato-descricao">
          O que aconteceu e o que você esperava?
        </label>
        <textarea
          id="relato-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          disabled={busy}
          aria-describedby="relato-aviso"
        />
        <p id="relato-aviso" className="input-hint">
          Não inclua senhas, chaves ou conversas privadas. Até dez relatos por
          conta/hora.
        </p>
        <button
          className="pilot-button"
          disabled={busy || descricao.trim().length < 10}
        >
          Salvar relato
        </button>
      </form>
      <section aria-label="Acompanhamento dos relatos">
        <h2>{lider ? "Relatos para acompanhar" : "Seus relatos"}</h2>
        {carregando && <p role="status">Consultando relatos salvos…</p>}
        {erro && (
          <p role="alert">
            {erro}{" "}
            <button onClick={() => void carregar()}>Tentar novamente</button>
          </p>
        )}
        {!carregando && !erro && !itens.length && (
          <p>Nenhum relato registrado.</p>
        )}
        {itens.map((r) => (
          <article className="pilot-card" key={r.id}>
            <h3>
              {categorias[r.categoria]} ·{" "}
              {r.estado === "aberto" ? "Em aberto" : "Resolvido"}
            </h3>
            <small>
              Relato {r.id.slice(0, 8)} · {dataHora(r.created_at)}
            </small>
            {lider && (
              <p>
                Participante:{" "}
                {pessoas.find((p) => p.id === r.profile_id)?.nome ??
                  "Conta do piloto"}
              </p>
            )}
            <p style={{ whiteSpace: "pre-wrap" }}>{r.descricao}</p>
            {lider && (
              <button
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void api("/api/piloto/resolver-relato", {
                    relato_id: r.id,
                    resolvido: r.estado !== "resolvido",
                  })
                    .then(carregar)
                    .catch((e) => toast.error(e.message))
                    .finally(() => setBusy(false));
                }}
              >
                {r.estado === "aberto"
                  ? "Marcar como resolvido"
                  : "Reabrir relato"}
              </button>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
