"use client";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
const abas = z.enum([
  "faiscas",
  "rede",
  "comunidades",
  "saberes",
  "agenda",
  "perfil",
  "lideranca",
  "ajuda",
]);
export function useNavegacaoPiloto() {
  const params = useSearchParams();
  const tab = abas.catch("faiscas").parse(params.get("aba") ?? "faiscas");
  const encontro = z
    .uuid()
    .nullable()
    .catch(null)
    .parse(params.get("encontro"));
  function atualizar(aba: string, id: string | null) {
    const url = new URL(window.location.href);
    url.searchParams.set("aba", abas.parse(aba));
    if (id) url.searchParams.set("encontro", z.uuid().parse(id));
    else url.searchParams.delete("encontro");
    if (url.href !== window.location.href)
      window.history.pushState(null, "", url);
  }
  return {
    tab,
    encontro,
    setTab: (aba: string) => atualizar(aba, null),
    setEncontro: (id: string | null) =>
      atualizar(
        abas
          .catch("faiscas")
          .parse(
            new URL(window.location.href).searchParams.get("aba") ?? "faiscas",
          ),
        id,
      ),
  };
}
