import Link from "next/link";
import { notFound } from "next/navigation";
import { LineChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { PrintButton } from "@/components/PrintButton";
import { BrandMark } from "@/components/Sidebar";
import { CLIENTS, COACH, MEASUREMENTS, PLANS } from "@/lib/data";
import { journeyView, longDate, measurementChange, signed, weighInDates, weightChange } from "@/lib/domain";

export const metadata = { title: "Progress report — Arcwell" };

/** A one-page progress report a coach can print or save as a PDF and send to the client. */
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = CLIENTS.find((c) => c.id === id);
  if (!client) notFound();

  const journey = journeyView(client.journey);
  const stage = journey.stages.find((s) => s.state === "current");
  const dates = weighInDates(client);
  const first = client.weights[0];
  const latest = client.weights[client.weights.length - 1];
  const measurements = MEASUREMENTS[client.id] ?? [];
  const plan = PLANS.find((p) => p.clientId === client.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/coach/clients/${client.id}`} className="inline-flex items-center gap-1 text-base text-muted hover:text-brandInk">
          <Icon name="chevron" size={14} className="rotate-180" /> Back to {client.name}
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-line bg-card p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="text-sm text-muted">Progress report</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{client.name}</h1>
            <p className="mt-1 text-md text-muted">
              {client.goal} · {stage?.label}
              {journey.totalWeeks ? `, week ${Math.min(journey.week, journey.totalWeeks)} of ${journey.totalWeeks}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <BrandMark size={24} />
              <span className="text-md font-semibold">Arcwell</span>
            </div>
            <p className="mt-2 text-sm text-muted">Coach {COACH.name}</p>
            <p className="tnum font-mono text-sm text-muted">{longDate(today)}</p>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-4 border-b border-line py-6">
          {[
            ["First weigh-in", first === undefined ? "—" : `${first} kg`],
            ["Latest", latest === undefined ? "—" : `${latest} kg`],
            ["Change", client.weights.length < 2 ? "—" : signed(weightChange(client.weights), " kg")],
            ["Goal", client.targetKg === null ? "—" : `${client.targetKg} kg`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="tnum mt-1 font-mono text-xl font-medium">{value}</p>
            </div>
          ))}
        </section>

        <section className="border-b border-line py-6">
          <h2 className="mb-2 text-lg font-semibold">Weight</h2>
          <LineChart
            values={client.weights}
            target={client.targetKg}
            height={200}
            startLabel={dates[0] ? longDate(dates[0]) : ""}
            endLabel={dates[dates.length - 1] ? longDate(dates[dates.length - 1] as string) : ""}
          />
        </section>

        <section className="border-b border-line py-6">
          <h2 className="mb-3 text-lg font-semibold">Measurements</h2>
          {measurements.length === 0 ? (
            <p className="text-base text-muted">No measurements logged yet.</p>
          ) : (
            <table className="w-full text-base">
              <thead className="text-left text-sm text-muted">
                <tr>
                  <th className="pb-2 font-medium">Measurement</th>
                  <th className="pb-2 text-right font-medium">First</th>
                  <th className="pb-2 text-right font-medium">Latest</th>
                  <th className="pb-2 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {measurements.map((m) => {
                  const change = measurementChange(m);
                  return (
                    <tr key={m.label}>
                      <td className="py-2">{m.label}</td>
                      <td className="py-2 text-right font-mono">{m.entries[0]?.value} {m.unit}</td>
                      <td className="py-2 text-right font-mono">{m.entries[m.entries.length - 1]?.value} {m.unit}</td>
                      <td className="py-2 text-right font-mono">{change === null ? "—" : `${change > 0 ? "+" : ""}${change} ${m.unit}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="py-6">
          <h2 className="mb-2 text-lg font-semibold">Training</h2>
          <p className="text-base text-muted">
            {plan && plan.status !== "none"
              ? `Week ${plan.week} of ${plan.weeks}, ${plan.days.length} training days a week. Adherence over the last four weeks: ${client.adherence === null ? "not measured yet" : `${client.adherence}%`}.`
              : "No training plan yet."}
          </p>
          <p className="mt-4 text-base">{journey.next.text}.</p>
        </section>
      </article>
    </div>
  );
}
