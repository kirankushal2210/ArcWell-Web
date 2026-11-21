"use client";

import Link from "next/link";
import { useState } from "react";
import type { Invoice, Tier } from "@/lib/data";
import { daysUntil, inr, longDate, prorate, tierPrice, withGst, type PlanUsage } from "@/lib/domain";
import { Button, Card, Pills, SectionTitle, buttonClass } from "./ui";
import { Icon } from "./icons";

type Period = "monthly" | "yearly";

/**
 * The coach's own subscription: current plan and client band, every tier side by side, a
 * prorated preview before any upgrade, and GST invoices.
 */
export function Billing({
  tiers,
  currentId,
  usage,
  nextCharge,
  invoices,
  gstRate,
}: {
  tiers: Tier[];
  currentId: Tier["id"];
  usage: PlanUsage;
  nextCharge: string;
  invoices: Invoice[];
  gstRate: number;
}) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [current, setCurrent] = useState(currentId);
  const [preview, setPreview] = useState<Tier | null>(null);
  const [notice, setNotice] = useState("");
  const [pendingDowngrade, setPendingDowngrade] = useState<Tier | null>(null);
  const cur = tiers.find((t) => t.id === current) as Tier;
  const daysLeft = Math.max(0, daysUntil(nextCharge) ?? 0);
  const fits = (t: Tier) => t.maxClients === null || usage.active <= t.maxClients;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-brand bg-brand p-5 text-onBrand shadow-md lg:col-span-1">
          <p className="text-sm opacity-80">Current plan</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{cur.name}</p>
          <p className="tnum mt-1 font-mono text-md">{inr(cur.monthlyInr)} / month + GST</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brandPress" aria-hidden>
            <div className="h-full rounded-full bg-card" style={{ width: `${usage.pct}%` }} />
          </div>
          <p className="tnum mt-2 font-mono text-sm">
            {usage.active} of {cur.maxClients ?? "unlimited"} active clients
          </p>
        </div>
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted">Next charge</p>
              <p className="tnum mt-1 font-mono text-xl font-medium">{longDate(nextCharge)}</p>
              <p className="text-sm text-muted">in {daysLeft} days</p>
            </div>
            <div>
              <p className="text-sm text-muted">Amount</p>
              <p className="tnum mt-1 font-mono text-xl font-medium">{inr(withGst(cur.monthlyInr, gstRate).total)}</p>
              <p className="text-sm text-muted">incl. {Math.round(gstRate * 100)}% GST</p>
            </div>
            <div>
              <p className="text-sm text-muted">Client band</p>
              <p className="mt-1 text-xl font-medium">{cur.clients}</p>
              <p className={`text-sm ${usage.over ? "font-medium text-brandInk" : "text-muted"}`}>
                {usage.over ? `${usage.active - usage.limit} over the band: upgrade to keep adding clients` : "within your band"}
              </p>
            </div>
          </div>
          {pendingDowngrade ? (
            <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-base">
              Moving to {pendingDowngrade.name} on {longDate(nextCharge)}. Downgrades take effect at renewal.{" "}
              <button type="button" className="font-medium text-brandInk underline" onClick={() => setPendingDowngrade(null)}>
                Cancel
              </button>
            </p>
          ) : null}
        </Card>
      </div>

      {notice ? (
        <p role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-success bg-tintSuccess px-4 py-2.5 text-base text-success">
          <span className="flex items-center gap-2">
            <Icon name="check" size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="close" size={14} />
          </button>
        </p>
      ) : null}

      <SectionTitle right={<Pills<Period> value={period} onChange={setPeriod} label="Billing period" options={[{ key: "monthly", label: "Monthly" }, { key: "yearly", label: "Yearly · 2 months free" }]} />}>Plans</SectionTitle>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiers.map((t) => {
          const isCurrent = t.id === current;
          const price = tierPrice(t, period === "yearly");
          const up = t.monthlyInr > cur.monthlyInr;
          return (
            <div key={t.id} className={`flex flex-col rounded-xl border bg-card p-4 shadow-sm ${isCurrent ? "border-brand ring-1 ring-[var(--brand)]" : "border-line"}`}>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{t.name}</p>
                {isCurrent ? <span className="rounded-full bg-tintBrand px-2 py-0.5 text-xs font-medium text-brandInk">Current</span> : null}
              </div>
              <p className="text-sm text-muted">{t.clients}</p>
              <p className="tnum mt-3 font-mono text-2xl font-medium">
                {price === 0 ? "₹0" : inr(price)}
                <span className="font-sans text-sm font-normal text-muted"> / {period === "yearly" ? "year" : "month"}</span>
              </p>
              <p className="text-xs text-muted">{price ? `+ ${Math.round(gstRate * 100)}% GST` : "Free forever"}</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                {t.includes.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Icon name="check" size={14} className="mt-0.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <p className="mt-4 text-center text-sm text-muted">Your plan</p>
              ) : !fits(t) ? (
                <p className="mt-4 text-center text-sm text-muted">Too small for {usage.active} clients</p>
              ) : (
                <Button variant={up ? "primary" : "secondary"} className="mt-4 w-full" onClick={() => setPreview(t)}>
                  {up ? `Upgrade to ${t.name}` : `Move to ${t.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {preview ? (
        <ChangeDialog
          from={cur}
          to={preview}
          daysLeft={daysLeft}
          nextCharge={nextCharge}
          gstRate={gstRate}
          onClose={() => setPreview(null)}
          onConfirm={() => {
            const p = prorate(cur, preview, daysLeft);
            if (p.downgrade) {
              setPendingDowngrade(preview);
              setNotice(`${preview.name} starts at your renewal on ${longDate(nextCharge)}.`);
            } else {
              setCurrent(preview.id);
              setPendingDowngrade(null);
              setNotice(`You're on ${preview.name} now. ${inr(withGst(p.now, gstRate).total)} for the rest of this cycle is added to your next invoice.`);
            }
            setPreview(null);
          }}
        />
      ) : null}

      <SectionTitle>Invoices</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-base">
          <thead className="border-b border-line bg-surface text-left text-sm text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Invoice</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Plan</th>
              <th className="px-4 py-2.5 text-right font-medium">Total incl. GST</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="tnum px-4 py-2.5 font-mono text-sm">{inv.id}</td>
                <td className="tnum px-4 py-2.5 font-mono text-sm">{longDate(inv.date)}</td>
                <td className="px-4 py-2.5">{inv.plan}</td>
                <td className="tnum px-4 py-2.5 text-right font-mono">{inr(withGst(inv.amountInr, gstRate).total)}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-tintSuccess px-2 py-0.5 text-xs font-medium text-success">
                    <Icon name="check" size={11} /> {inv.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/coach/billing/${inv.id}`} className={buttonClass("quiet")}>
                    GST invoice
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ChangeDialog({
  from,
  to,
  daysLeft,
  nextCharge,
  gstRate,
  onClose,
  onConfirm,
}: {
  from: Tier;
  to: Tier;
  daysLeft: number;
  nextCharge: string;
  gstRate: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const p = prorate(from, to, daysLeft);
  const now = withGst(p.now, gstRate);
  const monthly = withGst(to.monthlyInr, gstRate);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-labelledby="change-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="change-title" className="text-lg font-semibold">
          {p.downgrade ? `Move to ${to.name}` : `Upgrade to ${to.name}`}
        </h2>
        {p.downgrade ? (
          <p className="mt-2 text-base text-muted">
            Downgrades take effect at renewal, so nothing changes until {longDate(nextCharge)}. From then you pay {inr(monthly.total)} a month including GST.
          </p>
        ) : (
          <dl className="mt-4 space-y-2 text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                Difference for the {daysLeft} days left
              </dt>
              <dd className="tnum font-mono">{inr(now.amount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">GST {Math.round(gstRate * 100)}%</dt>
              <dd className="tnum font-mono">{inr(now.gst)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-2 font-medium">
              <dt>Due now</dt>
              <dd className="tnum font-mono">{inr(now.total)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-sm text-muted">
              <dt>From {longDate(nextCharge)}</dt>
              <dd className="tnum font-mono">{inr(monthly.total)} / month</dd>
            </div>
          </dl>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{p.downgrade ? "Schedule the change" : "Confirm upgrade"}</Button>
        </div>
      </div>
    </div>
  );
}
