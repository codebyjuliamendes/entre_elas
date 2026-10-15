import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Entre Elas",
    short_name: "Entre Elas",
    description:
      "Saber que conecta. Uma rede de mulheres que compartilham experiências.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9fc",
    theme_color: "#7352c7",
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
