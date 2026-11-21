import { PlansBoard } from "@/components/PlansBoard";
import { PageTitle } from "@/components/ui";
import { LIBRARY, PLANS, PLAN_TEMPLATES } from "@/lib/data";

export const metadata = { title: "Plans — Arcwell" };

export default function PlansPage() {
  const needs = PLANS.filter((p) => p.status === "none").length;
  return (
    <>
      <PageTitle title="Plans" sub={`${needs} clients need a plan · saved plans show up in each client's Arcwell app`} />
      <PlansBoard plans={PLANS} templates={PLAN_TEMPLATES} library={LIBRARY} />
    </>
  );
}
