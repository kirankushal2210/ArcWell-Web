import { PlansBoard } from "@/components/PlansBoard";
import { PageTitle } from "@/components/ui";
import { PLANS } from "@/lib/data";

export default function PlansPage() {
  const needs = PLANS.filter((p) => p.status === "none").length;
  return (
    <>
      <PageTitle title="Plans" sub={`${needs} clients need a plan · everyone else is on track`} />
      <PlansBoard plans={PLANS} />
    </>
  );
}
