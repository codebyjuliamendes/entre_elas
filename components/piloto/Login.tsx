"use client";
import { Marca, SimboloFaisca } from "@/components/Marca";
import { normalizarRetorno } from "@/lib/piloto/retorno";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function Login() {
  const router = useRouter(),
    params = useSearchParams();
  const retorno = normalizarRetorno(params.get("retorno"));
  const [modo, setModo] = useState<"entrar" | "cadastrar">(
    params.get("modo") === "cadastrar" ? "cadastrar" : "entrar",
  );
  const [email, setEmail] = useState(""),
    [senha, setSenha] = useState(""),
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

  async function autenticar(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, modo, retorno }),
      });
      const data = await r.json();
      if (r.ok) {
        setStatus("Acesso liberado! Entrando…");
        router.replace(data.redirecionar || retorno || "/piloto");
      } else {
        setStatus(data.erro);
      }
    } catch {
      setStatus("Sem conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function pedirLinkPorEmail() {
    if (!email) {
      setStatus("Informe seu e-mail acima para receber o link.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, retorno, modo }),
      });
      const data = await r.json();
      setStatus(
        r.ok
          ? "Link enviado. Abra seu e-mail neste mesmo navegador e dispositivo. Verifique também o spam."
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
          <span className="eyebrow">Saber que conecta</span>
          <h1>Uma conversa pode abrir caminhos.</h1>
          <p>O que você viveu pode ser a Faísca que outra pessoa precisa.</p>
        </div>
        <div className="login-flare">
          <SimboloFaisca size={280} degrade />
        </div>
        <p className="login-story-footer">
          Experiências que se encontram.
          <br />
          Saberes que vão mais longe.
        </p>
      </section>
      <section className="login-content" aria-labelledby="login-titulo">
        <span className="eyebrow">Seu espaço começa aqui</span>
        <div className="login-modos" role="group" aria-label="Tipo de acesso">
          <button
            type="button"
            aria-pressed={modo === "entrar"}
            disabled={busy}
            onClick={() => {
              setModo("entrar");
              setStatus("");
            }}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            aria-pressed={modo === "cadastrar"}
            disabled={busy}
            onClick={() => {
              setModo("cadastrar");
              setStatus("");
            }}
          >
            Criar conta
          </button>
        </div>
        <h2 id="login-titulo">
          {modo === "entrar" ? "Entrar na minha conta." : "Crie sua conta."}
        </h2>
        <p>
          {modo === "entrar"
            ? "Digite seu e-mail e senha para acessar diretamente suas trocas e mentorias."
            : "É sua primeira vez? Escolha seu e-mail e crie sua senha para começar imediatamente."}
        </p>
        <form onSubmit={autenticar}>
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

          <label
            className="form-label"
            htmlFor="senha"
            style={{ marginTop: "1rem" }}
          >
            {modo === "cadastrar" ? "Crie uma senha" : "Sua senha"}
          </label>
          <input
            id="senha"
            type="password"
            autoComplete={
              modo === "entrar" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            maxLength={128}
            placeholder={modo === "cadastrar" ? "Mínimo 6 caracteres" : ""}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            className="pilot-button"
            disabled={busy}
            style={{ marginTop: "1.25rem" }}
          >
            {busy
              ? "Aguarde…"
              : modo === "entrar"
                ? "Entrar na conta"
                : "Criar minha conta"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            type="button"
            disabled={busy}
            onClick={pedirLinkPorEmail}
            style={{
              background: "none",
              border: "none",
              color: "#a330a5",
              textDecoration: "underline",
              fontSize: "0.85rem",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            {modo === "entrar"
              ? "Esqueceu a senha ou prefere link por e-mail?"
              : "Prefere receber link de confirmação por e-mail?"}
          </button>
        </div>

        <div className="login-ou" aria-hidden="true">
          <span>ou</span>
        </div>
        <a className="login-demo-botao" href="/demonstracao">
          <SimboloFaisca size={22} degrade />
          <span>
            <strong>Explorar sem cadastro</strong>
            <small>
              Veja o app funcionando com uma rede fictícia. Nada é salvo.
            </small>
          </span>
        </a>

        {params.get("erro") && (
          <p role="alert">
            Link inválido ou expirado. Entre com sua senha ou solicite outro
            link.
          </p>
        )}
        <p role="status">{status}</p>
        <p className="input-hint">
          A IA é opcional. Antes de usá-la, você verá os provedores envolvidos e
          poderá autorizar o envio dos seus textos. Não informe dados sensíveis,
          confidenciais ou de terceiros.
        </p>
        {process.env.NEXT_PUBLIC_DEMO_URL && (
          <a className="login-demo" href={process.env.NEXT_PUBLIC_DEMO_URL}>
            Ver a jornada guiada da apresentação →
          </a>
        )}
        <p className="login-signature">
          Uma Faísca. Vinte minutos. Novas possibilidades.
        </p>
      </section>
    </main>
  );
}
