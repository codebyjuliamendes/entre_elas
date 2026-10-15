import { Suspense } from "react";
import { Login } from "@/components/piloto/Login";
export default function Page() {
  return (
    <Suspense fallback={<p>Preparando acesso…</p>}>
      <Login />
    </Suspense>
  );
}
