import { tracoFaisca } from "@/lib/identidade";
export function SimboloFaisca({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 360 320"
      width={size}
      height={size}
      className={`marca-simbolo ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={tracoFaisca} />
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
