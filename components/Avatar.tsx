"use client";
import { useDemo } from "@/lib/demo/store";
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
  const state = useDemo();
  const foto = src === "/avatars/ana.svg" ? state.perfil.foto : null;
  return (
    <Image
      className={cn("avatar", className)}
      src={foto ?? src}
      alt={`Foto de perfil de ${nome}`}
      width={size}
      height={size}
      unoptimized
    />
  );
}
