import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDraft } from "@/components/AiDraft";
import { Icon } from "@/components/icons";
import { CLIENTS, COACH, LIBRARY, PLANS } from "@/lib/data";
import { draftNextBlock, validateDraft } from "@/lib/domain";

export const metadata = { title: "AI draft — Arcwell" };

/** Sample monthly usage until drafts are counted on the server. */
const AI_USAGE = { used: 3, cap: 20 };

export default async function AiDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = CLIENTS.find((c) => c.id === id);
  if (!client) notFound();
  const plan = PLANS.find((p) => p.clientId === id);
  const days = plan && plan.status !== "none" ? plan.days : [];
  const lines = draftNextBlock(days, LIBRARY);
  const checks = validateDraft(lines, days, LIBRARY);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link href={`/coach/clients/${client.id}`} className="inline-flex items-center gap-1 text-base text-muted hover:text-brandInk">
          <Icon name="chevron" size={14} className="rotate-180" /> {client.name}
        </Link>
      </nav>
      <h1 className="mb-1 text-3xl font-semibold tracking-[-0.03em]">AI draft</h1>
      <p className="mb-6 text-md text-muted">A proposed next block for {client.name}. You approve every line.</p>
      {days.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6 text-base text-muted">
          {client.name.split(" ")[0]} has no plan yet. Build a first week on the Plans screen; drafts build on the current plan.
        </p>
      ) : (
        <AiDraft clientId={client.id} clientName={client.name} lines={lines} checks={checks} elite={COACH.plan === "Elite"} used={AI_USAGE.used} cap={AI_USAGE.cap} />
      )}
    </>
  );
}
