"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { z } from "zod";
import { quizPerguntas } from "@/lib/schemas/entities";
import { Button } from "@/components/ui/button";
export function Quiz({
  perguntas,
}: {
  perguntas: z.infer<typeof quizPerguntas>;
}) {
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [corrigido, setCorrigido] = useState(false);
  const completo = Object.keys(respostas).length === 3;
  const acertos = perguntas.reduce(
    (n, p, i) => n + Number(respostas[i] === p.correta),
    0,
  );
  return (
    <section className="quiz-card" aria-label="Quiz do aprendizado">
      <div className="section-heading">
        <h2 style={{ fontSize: 16 }}>Vamos fixar esse saber?</h2>
        <span className="pill">3 perguntas</span>
      </div>
      {perguntas.map((p, i) => (
        <fieldset key={i} style={{ border: 0, padding: 0, margin: "20px 0" }}>
          <legend>
            <h3>
              {i + 1}. {p.pergunta}
            </h3>
          </legend>
          {p.alternativas.map((a, n) => (
            <button
              key={n}
              type="button"
              aria-pressed={respostas[i] === n}
              disabled={corrigido}
              className={`quiz-option ${respostas[i] === n ? "selected" : ""} ${corrigido && p.correta === n ? "correct" : ""} ${corrigido && respostas[i] === n && p.correta !== n ? "incorrect" : ""}`}
              onClick={() => setRespostas((s) => ({ ...s, [i]: n }))}
            >
              <span>{String.fromCharCode(65 + n)}</span>
              <span>{a}</span>
              {corrigido && p.correta === n && <CheckCircle2 size={14} />}
            </button>
          ))}
        </fieldset>
      ))}
      {corrigido ? (
        <>
          <p className="quiz-status" role="status">
            Você acertou {acertos} de 3. Toda troca é um jeito de aprender.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRespostas({});
              setCorrigido(false);
            }}
          >
            <RotateCcw size={13} />
            Tentar de novo
          </Button>
        </>
      ) : (
        <Button
          variant="secondary"
          className="full-width"
          disabled={!completo}
          onClick={() => setCorrigido(true)}
        >
          Conferir minhas respostas
        </Button>
      )}
    </section>
  );
}
