import type { CSSProperties } from "react";
import { coresMarca, tracoFaisca, viewBoxFaisca } from "@/lib/identidade";
export function SimboloFaisca({
  className = "",
  size = 40,
  degrade = false,
}: {
  className?: string;
  size?: number;
  /** Aplica o degradê oficial coral → roxo da designer. */
  degrade?: boolean;
}) {
  return (
    <svg
      viewBox={viewBoxFaisca}
      width={size}
      height={size}
      className={`marca-simbolo ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {degrade && (
        <defs>
          <linearGradient id="faisca-degrade">
            <stop stopColor={coresMarca.coral} />
            <stop offset="1" stopColor={coresMarca.roxoProfundo} />
          </linearGradient>
        </defs>
      )}
      <path
        fill={degrade ? "url(#faisca-degrade)" : "currentColor"}
        d={tracoFaisca}
      />
    </svg>
  );
}
export function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`marca ${className}`}>
      <SimboloFaisca />
      <span className="marca-nome">
        entre<span>elas</span>
        <b aria-hidden="true">.</b>
      </span>
    </span>
  );
}
// Ícone próprio da marca no lugar do brilho genérico associado a IA.
export function IconeFaisca({
  size = 16,
  color,
  style,
  className = "",
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true";
}) {
  return (
    <svg
      viewBox={viewBoxFaisca}
      width={size}
      height={size}
      className={`icone-faisca ${className}`}
      style={{ color, ...style }}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d={tracoFaisca} />
    </svg>
  );
}
