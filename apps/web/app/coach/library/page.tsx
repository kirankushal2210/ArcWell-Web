import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { LIBRARY } from "@/lib/data";

/** Muscle groups map to the training pillar's family of tints, so the grid scans by body part. */
const REGION: Record<string, string> = {
  Quadriceps: "Legs",
  Hamstrings: "Legs",
  Glutes: "Legs",
  Chest: "Push",
  Shoulders: "Push",
  Lats: "Pull",
  "Upper back": "Pull",
  Traps: "Pull",
  Abdominals: "Core",
};

const REGION_STYLE: Record<string, string> = {
  Legs: "bg-tintBrand text-brandInk",
  Push: "bg-tintWarning text-warning",
  Pull: "bg-tintInfo text-recovery",
  Core: "bg-tintSuccess text-success",
};

export default function LibraryPage() {
  const withDemo = LIBRARY.filter((e) => e.demo).length;
  return (
    <>
      <PageTitle title="Library" sub="Exercises with demos, and the Indian food and recipe database" />

      <SectionTitle right={<span className="tnum font-mono">{withDemo} of {LIBRARY.length} have a demo</span>}>Exercises</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {LIBRARY.map((e) => {
          const region = REGION[e.muscle] ?? "Core";
          return (
            <Card key={e.name} className="group flex flex-col gap-4 p-0 transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong">
              <div className={`relative grid h-28 place-items-center rounded-t-xl ${e.demo ? "bg-surface" : "bg-card"} border-b border-line`}>
                {e.demo ? (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-onBrand shadow-md transition-transform duration-[120ms] ease-quiet group-hover:scale-105">
                    <Icon name="play" size={16} />
                    <span className="sr-only">Demo video available</span>
                  </span>
                ) : (
                  <span className="text-sm text-faint">No demo yet</span>
                )}
                <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${REGION_STYLE[region]}`}>{region}</span>
              </div>
              <div className="px-5 pb-4">
                <p className="text-md font-semibold">{e.name}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {e.muscle} · {e.equipment}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Foods and recipes</SectionTitle>
      <Card className="flex flex-wrap items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tintSuccess text-success" aria-hidden>
          <Icon name="list" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-md font-semibold">Indian foods by household measure</p>
          <p className="mt-1 text-base text-muted">Katori, roti, piece and gram, plus recipes with macros. The food and recipe tables arrive with the database phase.</p>
        </div>
      </Card>
    </>
  );
}
