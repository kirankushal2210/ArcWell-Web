import { Onboarding } from "@/components/Onboarding";
import { PageTitle } from "@/components/ui";
import { GOAL_SUGGESTIONS, PLAN_TEMPLATES } from "@/lib/data";

export const metadata = { title: "Get started — Arcwell" };

export default function GetStartedPage() {
  return (
    <>
      <PageTitle title="Set up your workspace" sub="You, your first client, their first week and an invite. About five minutes" />
      <Onboarding templates={PLAN_TEMPLATES} goals={GOAL_SUGGESTIONS} />
    </>
  );
}
