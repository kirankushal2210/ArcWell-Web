import { ClientsWorkspace } from "@/components/ClientsWorkspace";
import { CLIENTS, FORMER_CLIENTS } from "@/lib/data";

export const metadata = { title: "Clients — Arcwell" };

export default function ClientsPage() {
  return <ClientsWorkspace clients={CLIENTS} former={FORMER_CLIENTS} />;
}
