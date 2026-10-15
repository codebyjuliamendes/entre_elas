import { notFound } from "next/navigation";
import Debug from "./debug";
export const dynamic = "force-dynamic";
export default function Dev() {
  if (process.env.APP_MODE === "piloto" || process.env.DEMO_MODE !== "true")
    notFound();
  return <Debug />;
}
