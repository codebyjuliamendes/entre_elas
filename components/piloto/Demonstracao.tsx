"use client";
import { useEffect, useState } from "react";
import { Piloto } from "./Piloto";
import { usarSimulador } from "@/lib/piloto/browser";
import { criarDemonstracao, idDemo } from "@/lib/piloto/demonstracao/dados";
import { criarSimulador } from "@/lib/piloto/demonstracao/simulador";

// Momentos que mostram o app inteiro em poucos cliques.
const ROTEIRO: {
  rotulo: string;
  aba: string;
  encontro?: number;
  foco?: string;
}[] = [
  { rotulo: "Peça uma Faísca à IA", aba: "faiscas", foco: "pedido-real" },
  { rotulo: "Aceite o convite da Sofia", aba: "faiscas", encontro: 101 },
  { rotulo: "Autorize a dica com a Renata", aba: "faiscas", encontro: 104 },
  { rotulo: "Veja o fórum da rede", aba: "comunidades" },
  { rotulo: "Abra o painel da liderança", aba: "lideranca" },
];

function ir(aba: string, encontro?: number, foco?: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("aba", aba);
  if (encontro) url.searchParams.set("encontro", idDemo(encontro));
  else url.searchParams.delete("encontro");
  window.history.pushState(null, "", url);
  if (foco)
    setTimeout(() => {
      const campo = document.getElementById(foco);
      campo?.scrollIntoView({ behavior: "smooth", block: "center" });
      campo?.focus({ preventScroll: true });
    }, 150);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Demonstracao() {
  const [aberto, setAberto] = useState(true);
  useEffect(() => {
    // O simulador vale só enquanto esta página estiver aberta.
    const atualizar = () => window.dispatchEvent(new Event("piloto:atualizar"));
    usarSimulador(criarSimulador(criarDemonstracao(), atualizar));
    atualizar();
    return () => usarSimulador(null);
  }, []);
  return (
    <>
      <aside className="demo-faixa" aria-label="Sobre a demonstração">
        <p>
          <strong>Você está na demonstração.</strong> Pessoas, conversas e
          números são fictícios e ficam só neste navegador. A curadoria de IA e
          a videochamada são simuladas.
        </p>
        {aberto && (
          <nav className="demo-roteiro" aria-label="Roteiro sugerido">
            {ROTEIRO.map((r, i) => (
              <button
                key={r.rotulo}
                type="button"
                onClick={() => ir(r.aba, r.encontro, r.foco)}
              >
                <span aria-hidden="true">{i + 1}</span>
                {r.rotulo}
              </button>
            ))}
          </nav>
        )}
        <button
          type="button"
          className="demo-ocultar"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Ocultar roteiro" : "Mostrar roteiro"}
        </button>
      </aside>
      <Piloto demonstracao />
    </>
  );
}
