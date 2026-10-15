import { AgendaScreen } from "@/components/demo/AgendaScreen";
import { diaLocal } from "@/lib/demo/calendario";
export const dynamic = "force-dynamic";
export default function Agenda() {
  return <AgendaScreen hoje={diaLocal()} />;
}
