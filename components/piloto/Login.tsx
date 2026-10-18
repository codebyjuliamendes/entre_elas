"use client";
import { Marca, SimboloFaisca } from "@/components/Marca";
import { normalizarRetorno } from "@/lib/piloto/retorno";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export function Login() {
  const router = useRouter(),
    params = useSearchParams();
  const retorno = normalizarRetorno(params.get("retorno"));
  const [email, setEmail] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (params.get("renovar")) {
      void fetch("/api/auth/renovar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).then((r) => {
        if (r.ok) router.replace(retorno);
      });
    }
  }, [params, router, retorno]);
  async function entrar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, retorno }),
      });
      const data = await r.json();
      setStatus(
        r.ok
          ? "Link enviado. Abra seu e-mail neste mesmo navegador e dispositivo. Verifique também o spam. O link é pessoal e expira."
          : data.erro,
      );
    } catch {
      setStatus("Sem conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="pilot-login brand-login">
      <section
        className="login-story"
        aria-label="Entre Elas, saber que conecta"
      >
        <Marca />
        <div className="login-story-copy">
          <span className="eyebrow">SABER QUE CONECTA</span>
          <h1>Uma conversa pode abrir caminhos.</h1>
          <p>O que você viveu pode ser a Faísca que outra pessoa precisa.</p>
        </div>
        <div className="login-flare">
          <SimboloFaisca size={280} />
        </div>
        <p className="login-story-footer">
          Experiências que se encontram.
          <br />
          Saberes que vão mais longe.
        </p>
      </section>
      <section className="login-content" aria-labelledby="login-titulo">
        <span className="eyebrow">Seu espaço começa aqui</span>
        <h2 id="login-titulo">Entre na sua rede.</h2>
        <p>
          Digite seu e-mail para criar sua conta ou entrar. Você receberá um
          link de acesso, sem precisar de senha. Suas trocas ficarão salvas com
          segurança no servidor.
        </p>
        <form onSubmit={entrar}>
          <label className="form-label" htmlFor="email">
            Seu e-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="pilot-button" disabled={busy}>
            {busy ? "Enviando…" : "Receber link de entrada"}
          </button>
        </form>
        {params.get("erro") && (
          <p role="alert">
            Link inválido ou expirado. Solicite outro link neste navegador.
          </p>
        )}
        <p role="status">{status}</p>
        <p className="input-hint">
          A IA é opcional. Antes de usá-la, você verá os provedores envolvidos e
          poderá autorizar o envio dos seus textos. Não informe dados sensíveis,
          confidenciais ou de terceiros.
        </p>
        <p className="login-signature">
          Uma Faísca. Vinte minutos. Novas possibilidades.
        </p>
      </section>
    </main>
  );
}
