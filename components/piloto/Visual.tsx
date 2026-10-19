"use client";
import { motion, useReducedMotion } from "framer-motion";
import { SimboloFaisca } from "@/components/Marca";
const CORES = ["#fc544c", "#f25fa8", "#a330a5", "#0f094c"] as const;
// Cor estável por pessoa, para o mesmo avatar ter sempre a mesma cor.
function corDe(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CORES[h % CORES.length];
}
const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
export function Avatar({
  id,
  nome,
  foto,
  tamanho = 48,
}: {
  id: string;
  nome: string;
  foto?: string | null;
  tamanho?: number;
}) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.38 };
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element -- foto em data URL salva pela própria participante
    <img className="pilot-avatar-mini" src={foto} alt="" style={estilo} />
  ) : (
    <span
      className="pilot-avatar-mini"
      aria-hidden="true"
      style={{ ...estilo, background: corDe(id) }}
    >
      {iniciais(nome)}
    </span>
  );
}
// Explosão curta de faíscas para marcar um convite aceito ou uma dica publicada.
// Cada novo valor de "disparo" recria a animação; as faíscas terminam invisíveis.
export function Centelhas({ disparo }: { disparo: number }) {
  const reduzir = useReducedMotion();
  if (!disparo || reduzir) return null;
  return (
    <div className="pilot-centelhas" aria-hidden="true" key={disparo}>
      {Array.from({ length: 14 }, (_, i) => {
        const angulo = (i / 14) * Math.PI * 2;
        const raio = 140 + (i % 3) * 50;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angulo) * raio,
              y: Math.sin(angulo) * raio,
              scale: 0.6 + (i % 4) * 0.2,
              opacity: 0,
              rotate: 180,
            }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          >
            <SimboloFaisca size={28} degrade={i % 2 === 0} />
          </motion.span>
        );
      })}
    </div>
  );
}
