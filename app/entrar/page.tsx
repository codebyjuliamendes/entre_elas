import { Suspense } from "react";
import { Login } from "@/components/piloto/Login";
import { dominiosPermitidos } from "@/lib/piloto/config";
export default function Page() {
  return (
    <Suspense fallback={<p>Preparando acesso…</p>}>
      <Login dominios={dominiosPermitidos()} />
    </Suspense>
  );
}
