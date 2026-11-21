import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/PrintButton";
import { BrandMark } from "@/components/Sidebar";
import { COACH, GST_RATE, INVOICES } from "@/lib/data";
import { inr, longDate, withGst } from "@/lib/domain";

export const metadata = { title: "GST invoice — Arcwell" };

/** A printable GST invoice for one subscription charge. */
export default async function InvoicePage({ params }: { params: Promise<{ invoice: string }> }) {
  const { invoice } = await params;
  const inv = INVOICES.find((i) => i.id === invoice);
  if (!inv) notFound();
  const t = withGst(inv.amountInr, GST_RATE);
  const half = Math.round(t.gst / 2);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/coach/billing" className="inline-flex items-center gap-1 text-base text-muted hover:text-brandInk">
          <Icon name="chevron" size={14} className="rotate-180" /> Plan and billing
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-xl border border-line bg-card p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="text-lg font-semibold">Arcwell</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Tax invoice</p>
            <p className="tnum font-mono text-md font-medium">{inv.id}</p>
            <p className="tnum font-mono text-sm text-muted">{longDate(inv.date)}</p>
          </div>
        </header>
        <section className="grid grid-cols-2 gap-6 border-b border-line py-6 text-base">
          <div>
            <p className="text-sm text-muted">Billed to</p>
            <p className="font-medium">{COACH.name}</p>
            <p className="text-muted">{COACH.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Status</p>
            <p className="font-medium text-success">{inv.status}</p>
          </div>
        </section>
        <table className="mt-6 w-full text-base">
          <thead className="text-left text-sm text-muted">
            <tr>
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="py-2.5">
                Arcwell {inv.plan}
                <span className="block text-sm text-muted">Subscription for the period {inv.period.replace(" to ", " – ")}</span>
              </td>
              <td className="tnum py-2.5 text-right font-mono">{inr(t.amount)}</td>
            </tr>
            <tr>
              <td className="py-2.5 text-muted">CGST 9%</td>
              <td className="tnum py-2.5 text-right font-mono">{inr(half)}</td>
            </tr>
            <tr>
              <td className="py-2.5 text-muted">SGST 9%</td>
              <td className="tnum py-2.5 text-right font-mono">{inr(t.gst - half)}</td>
            </tr>
          </tbody>
          <tfoot className="border-t-2 border-ink">
            <tr>
              <td className="pt-3 font-semibold">Total</td>
              <td className="tnum pt-3 text-right font-mono text-lg font-medium">{inr(t.total)}</td>
            </tr>
          </tfoot>
        </table>
      </article>
    </div>
  );
}
