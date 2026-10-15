"use client";
import { useEffect } from "react";
export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    let desmontado = false;
    function atualizar() {
      if (!document.hidden)
        navigator.serviceWorker
          .getRegistration()
          .then((r) => r?.update())
          .catch(() => {});
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => {
        if (!desmontado)
          document.addEventListener("visibilitychange", atualizar);
      })
      .catch(() => {});
    return () => {
      desmontado = true;
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, []);
  return null;
}
