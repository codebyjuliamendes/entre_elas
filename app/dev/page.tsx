import { pilotoAtivo } from "@/lib/piloto/config";
import { notFound } from "next/navigation";
import Debug from "./debug";
export const dynamic = "force-dynamic";
export default function Dev() {
  if (pilotoAtivo() || process.env.DEMO_MODE !== "true") notFound();
  return <Debug />;
}
