import { BusinessWorkspace } from "@/components/BusinessWorkspace";
import { CLIENTS, FORMER_CLIENTS, LEADS, REVENUE } from "@/lib/data";

export const metadata = { title: "Business — Arcwell" };

export default function BusinessPage() {
  return <BusinessWorkspace clients={CLIENTS} leads={LEADS} revenue={REVENUE} former={FORMER_CLIENTS} />;
}
