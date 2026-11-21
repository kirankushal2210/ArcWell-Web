import { SettingsWorkspace } from "@/components/SettingsWorkspace";
import { CLIENTS, COACH, TEAM, TEAM_ACTIVITY } from "@/lib/data";
import { planUsage } from "@/lib/domain";

export const metadata = { title: "Settings — Arcwell" };

export default function SettingsPage() {
  return <SettingsWorkspace coach={COACH} usage={planUsage(CLIENTS, COACH.clientLimit)} team={TEAM} activity={TEAM_ACTIVITY} clients={CLIENTS} />;
}
