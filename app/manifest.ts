import { coresMarca } from "@/lib/identidade";
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tecida",
    short_name: "Tecida",
    description:
      "Saber que conecta. Uma rede de mulheres que compartilham experiências.",
    start_url: "/",
    id: "/",
    scope: "/",
    shortcuts: [
      { name: "Encontrar uma Faísca", url: "/" },
      { name: "Biblioteca de saberes", url: "/saberes" },
      { name: "Minha agenda", url: "/agenda" },
    ],
    display: "standalone",
    background_color: coresMarca.fundo,
    theme_color: coresMarca.azul,
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
