import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Entre Elas",
    short_name: "Entre Elas",
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
    background_color: "#faf9fc",
    theme_color: "#7352c7",
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
