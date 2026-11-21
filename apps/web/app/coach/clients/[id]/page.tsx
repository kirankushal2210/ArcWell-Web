import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileTabs } from "@/components/ProfileTabs";
import { Icon } from "@/components/icons";
import { CHECK_INS, CLIENTS, MESSAGES, PLANS, SAMPLE_WEEK } from "@/lib/data";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = CLIENTS.find((c) => c.id === id);
  if (!client) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link href="/coach" className="inline-flex items-center gap-1 text-base text-muted transition-colors duration-[120ms] ease-quiet hover:text-brandInk">
          <Icon name="chevron" size={14} className="rotate-180" />
          All clients
        </Link>
      </nav>
      <ProfileTabs
        client={client}
        plan={PLANS.find((p) => p.clientId === client.id)}
        checkIns={CHECK_INS.filter((k) => k.clientId === client.id)}
        messages={MESSAGES.filter((m) => m.clientId === client.id)}
        week={SAMPLE_WEEK}
      />
    </>
  );
}
