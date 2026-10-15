import Image from "next/image";
import { cn } from "./ui/utils";
export function Avatar({
  nome,
  src,
  size = 48,
  className,
}: {
  nome: string;
  src: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      className={cn("avatar", className)}
      src={src}
      alt={`Retrato ilustrado de ${nome}`}
      width={size}
      height={size}
      unoptimized
    />
  );
}
