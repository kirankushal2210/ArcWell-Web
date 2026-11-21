import { Billing } from "@/components/Billing";
import { PageTitle } from "@/components/ui";
import { CLIENTS, COACH, GST_RATE, INVOICES, TIERS } from "@/lib/data";
import { planUsage } from "@/lib/domain";

export const metadata = { title: "Plan and billing — Arcwell" };

export default function BillingPage() {
  return (
    <>
      <PageTitle title="Plan and billing" sub="Your Arcwell subscription, your client band and your GST invoices" />
      <Billing tiers={TIERS} currentId="coach" usage={planUsage(CLIENTS, COACH.clientLimit)} nextCharge={COACH.nextCharge} invoices={INVOICES} gstRate={GST_RATE} />
    </>
  );
}
