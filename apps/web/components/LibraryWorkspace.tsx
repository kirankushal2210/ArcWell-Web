"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Client, Exercise, Food, Recipe } from "@/lib/data";
import { dietTargets, dietTotals, searchFoods, type DietItem } from "@/lib/domain";
import { Button, Card, Empty, Pills, inputClass } from "./ui";
import { Icon } from "./icons";

type Tab = "exercises" | "foods" | "recipes" | "diet";
const TABS: Record<Tab, string> = { exercises: "Exercises", foods: "Indian foods", recipes: "Recipes", diet: "Diet builder" };

const REGION: Record<string, string> = {
  Quadriceps: "Legs",
  Hamstrings: "Legs",
  Glutes: "Legs",
  Chest: "Push",
  Shoulders: "Push",
  Lats: "Pull",
  "Upper back": "Pull",
  Traps: "Pull",
  Grip: "Pull",
  Abdominals: "Core",
  "Full body": "Full body",
};
const REGION_STYLE: Record<string, string> = {
  Legs: "bg-tintBrand text-brandInk",
  Push: "bg-tintWarning text-warning",
  Pull: "bg-tintInfo text-recovery",
  Core: "bg-tintSuccess text-success",
  "Full body": "bg-raised text-ink",
};
const MUSCLES = ["Quadriceps", "Hamstrings", "Glutes", "Chest", "Shoulders", "Lats", "Upper back", "Traps", "Grip", "Abdominals", "Full body"];
const EQUIPMENT = ["Barbell", "Dumbbell", "Kettlebell", "Cable", "Machine", "Bodyweight", "Band"];

export function LibraryWorkspace({ exercises, foods, recipes, clients, slots }: { exercises: Exercise[]; foods: Food[]; recipes: Recipe[]; clients: Client[]; slots: readonly string[] }) {
  const [tab, setTab] = useState<Tab>("exercises");
  const [lib, setLib] = useState(exercises);
  const [foodList, setFoodList] = useState(foods);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Library</h1>
          <p className="mt-1 text-md text-muted">Exercises with demos, Indian foods by household measure, recipes, and a diet builder</p>
        </div>
        <Pills<Tab> value={tab} onChange={setTab} label="Library sections" options={(Object.keys(TABS) as Tab[]).map((k) => ({ key: k, label: TABS[k] }))} />
      </div>
      {tab === "exercises" ? <Exercises items={lib} onAdd={(e) => setLib((l) => [e, ...l])} onUpdate={(e) => setLib((l) => l.map((x) => (x.name === e.name ? e : x)))} /> : null}
      {tab === "foods" ? <Foods items={foodList} onAdd={(f) => setFoodList((l) => [f, ...l])} /> : null}
      {tab === "recipes" ? <Recipes items={recipes} /> : null}
      {tab === "diet" ? <DietBuilder foods={foodList} clients={clients} slots={slots} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------- exercises */

function Exercises({ items, onAdd, onUpdate }: { items: Exercise[]; onAdd: (e: Exercise) => void; onUpdate: (e: Exercise) => void }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [open, setOpen] = useState<Exercise | null>(null);
  const [adding, setAdding] = useState(false);
  const regions = ["All", "Legs", "Push", "Pull", "Core", "Full body"];
  const shown = items.filter(
    (e) => (region === "All" || (REGION[e.muscle] ?? "Core") === region) && `${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const withDemo = items.filter((e) => e.demo || e.videoUrl).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Search value={q} onChange={setQ} placeholder="Exercise, muscle or equipment" label="Search exercises" />
        <Pills value={region} onChange={setRegion} label="Body region" options={regions.map((r) => ({ key: r, label: r }))} />
        <Button className="ml-auto" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> Add your own exercise
        </Button>
      </div>
      <p className="tnum mb-3 font-mono text-sm text-muted">
        {shown.length} shown · {withDemo} of {items.length} have a demo · clients see a “How to do this” button on every exercise in their app
      </p>
      {shown.length === 0 ? (
        <Empty title="No exercises match" body="Try another search or region, or add the exercise yourself." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((e) => {
            const r = REGION[e.muscle] ?? "Core";
            const hasDemo = e.demo || !!e.videoUrl;
            return (
              <button key={e.name} type="button" onClick={() => setOpen(e)} className="group overflow-hidden rounded-xl border border-line bg-card text-left shadow-sm transition-[border-color,transform] duration-[120ms] ease-quiet hover:border-strong active:scale-[0.99]">
                <div className="relative grid h-28 place-items-center border-b border-line bg-surface">
                  {hasDemo ? (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-onBrand shadow-md transition-transform duration-[120ms] ease-quiet group-hover:scale-105">
                      <Icon name="play" size={16} />
                    </span>
                  ) : (
                    <span className="text-sm text-faint">No demo yet</span>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium ${REGION_STYLE[r]}`}>{r}</span>
                  {e.custom ? <span className="absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-card">Yours</span> : null}
                </div>
                <div className="px-4 py-3">
                  <p className="text-md font-semibold">{e.name}</p>
                  <p className="text-sm text-muted">
                    {e.muscle} · {e.equipment}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {open ? <ExerciseDetail ex={open} onClose={() => setOpen(null)} onUpdate={(e) => { onUpdate(e); setOpen(e); }} /> : null}
      {adding ? (
        <AddExercise
          onClose={() => setAdding(false)}
          onAdd={(e) => {
            onAdd(e);
            setAdding(false);
          }}
        />
      ) : null}
    </>
  );
}

function ExerciseDetail({ ex, onClose, onUpdate }: { ex: Exercise; onClose: () => void; onUpdate: (e: Exercise) => void }) {
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog title={ex.name} onClose={onClose} wide>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          {ex.videoUrl ? (
            <video src={ex.videoUrl} controls className="aspect-video w-full rounded-lg bg-ink" aria-label={`${ex.name} demo`} />
          ) : ex.demo ? (
            <div className="grid aspect-video place-items-center rounded-lg border border-line bg-surface">
              <span className="flex flex-col items-center gap-2 text-muted">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-onBrand">
                  <Icon name="play" size={18} />
                </span>
                <span className="text-sm">Arcwell demo video</span>
              </span>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-strong p-4">
              <p className="text-base font-medium">No demo yet</p>
              <p className="mt-1 text-sm text-muted">Upload your own video or paste a link. Your clients see it on this exercise in their app.</p>
              <input ref={fileRef} type="file" accept="video/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpdate({ ...ex, videoUrl: URL.createObjectURL(f) }); }} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                  Upload a video
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <label htmlFor="ex-url" className="sr-only">
                  Video link
                </label>
                <input id="ex-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={`${inputClass} h-9`} />
                <Button variant="secondary" disabled={!/^https?:\/\//.test(url)} onClick={() => onUpdate({ ...ex, videoUrl: url })}>
                  Attach
                </Button>
              </div>
            </div>
          )}
        </div>
        <div>
          <dl className="space-y-2 text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Muscle</dt>
              <dd>{ex.muscle}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Equipment</dt>
              <dd>{ex.equipment}</dd>
            </div>
          </dl>
          <p className="mb-2 mt-4 text-sm font-medium text-muted">Coaching cues</p>
          {ex.cues.length ? (
            <ol className="space-y-2">
              {ex.cues.map((c, i) => (
                <li key={c} className="flex gap-3 text-base">
                  <span className="tnum grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tintBrand font-mono text-2xs font-medium text-brandInk">{i + 1}</span>
                  {c}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-base text-muted">No cues yet.</p>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function AddExercise({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Exercise) => void }) {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState(MUSCLES[0] as string);
  const [equipment, setEquipment] = useState(EQUIPMENT[0] as string);
  const [cues, setCues] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog title="Add your own exercise" onClose={onClose}>
      <div className="space-y-4">
        <FieldRow id="nx-name" label="Name">
          <input id="nx-name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} h-10`} />
        </FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow id="nx-muscle" label="Muscle">
            <select id="nx-muscle" value={muscle} onChange={(e) => setMuscle(e.target.value)} className={`${inputClass} h-10`}>
              {MUSCLES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow id="nx-eq" label="Equipment">
            <select id="nx-eq" value={equipment} onChange={(e) => setEquipment(e.target.value)} className={`${inputClass} h-10`}>
              {EQUIPMENT.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </FieldRow>
        </div>
        <FieldRow id="nx-cues" label="Cues, one per line">
          <textarea id="nx-cues" value={cues} onChange={(e) => setCues(e.target.value)} rows={3} className={`${inputClass} py-2`} />
        </FieldRow>
        <div>
          <input ref={fileRef} type="file" accept="video/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setVideoUrl(URL.createObjectURL(f)); }} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            {videoUrl ? <><Icon name="check" size={14} /> Video added</> : "Add a demo video"}
          </Button>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!name.trim()}
          onClick={() => onAdd({ name: name.trim(), muscle, equipment, demo: false, videoUrl, custom: true, cues: cues.split("\n").map((c) => c.trim()).filter(Boolean) })}
        >
          Add to library
        </Button>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ foods */

const CATEGORIES = ["All", "Grains", "Dal and legumes", "Vegetables", "Dairy", "Eggs, meat and fish", "Snacks", "Fruit", "Drinks"];

function Foods({ items, onAdd }: { items: Food[]; onAdd: (f: Food) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [adding, setAdding] = useState(false);
  const shown = searchFoods(items, q, cat);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Search value={q} onChange={setQ} placeholder="Try dahi, paruppu, chapati…" label="Search foods" />
        <label htmlFor="food-cat" className="sr-only">
          Category
        </label>
        <select id="food-cat" value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputClass} h-10 w-52`}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Button className="ml-auto" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14} /> Add your own food
        </Button>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-base">
          <thead className="border-b border-line bg-surface text-left text-sm text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Food</th>
              <th className="px-4 py-2.5 font-medium">Measure</th>
              <th className="px-4 py-2.5 text-right font-medium">kcal</th>
              <th className="px-4 py-2.5 text-right font-medium">Protein</th>
              <th className="px-4 py-2.5 text-right font-medium">Carbs</th>
              <th className="px-4 py-2.5 text-right font-medium">Fat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No food matches “{q}”. Add it yourself so your clients can log it.
                </td>
              </tr>
            ) : null}
            {shown.map((f) => (
              <tr key={f.id} className="hover:bg-surface">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{f.name}</span>
                  {f.custom ? <span className="ml-2 rounded-full bg-ink px-1.5 py-0.5 text-2xs text-card">Yours</span> : null}
                  <span className="block text-xs text-muted">
                    {f.category}
                    {f.aka.length ? ` · ${f.aka.join(", ")}` : ""}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {f.measure} <span className="tnum font-mono text-xs">({f.grams} g)</span>
                </td>
                <td className="tnum px-4 py-2.5 text-right font-mono">{f.kcal}</td>
                <td className="tnum px-4 py-2.5 text-right font-mono">{f.protein} g</td>
                <td className="tnum px-4 py-2.5 text-right font-mono text-muted">{f.carbs} g</td>
                <td className="tnum px-4 py-2.5 text-right font-mono text-muted">{f.fat} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-sm text-muted">Values per household measure. These sample values are replaced by the licensed food database, with its source recorded.</p>
      {adding ? <AddFood onClose={() => setAdding(false)} onAdd={(f) => { onAdd(f); setAdding(false); }} /> : null}
    </>
  );
}

function AddFood({ onClose, onAdd }: { onClose: () => void; onAdd: (f: Food) => void }) {
  const [v, setV] = useState({ name: "", aka: "", measure: "1 katori", grams: "150", kcal: "", protein: "", carbs: "", fat: "" });
  const num = (s: string) => Number(s.replace(",", "."));
  const valid = v.name.trim() && [v.grams, v.kcal, v.protein, v.carbs, v.fat].every((s) => s.trim() !== "" && Number.isFinite(num(s)) && num(s) >= 0);
  const field = (k: keyof typeof v, label: string, numeric = false) => (
    <FieldRow id={`nf-${k}`} label={label}>
      <input id={`nf-${k}`} value={v[k]} inputMode={numeric ? "decimal" : undefined} onChange={(e) => setV({ ...v, [k]: e.target.value })} className={`${inputClass} h-10 ${numeric ? "tnum font-mono" : ""}`} />
    </FieldRow>
  );
  return (
    <Dialog title="Add your own food" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">{field("name", "Name")}</div>
        <div className="col-span-2">{field("aka", "Other names, comma separated")}</div>
        {field("measure", "Measure")}
        {field("grams", "Grams per measure", true)}
        {field("kcal", "kcal", true)}
        {field("protein", "Protein g", true)}
        {field("carbs", "Carbs g", true)}
        {field("fat", "Fat g", true)}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!valid}
          onClick={() =>
            onAdd({
              id: `custom-${Date.now()}`,
              name: v.name.trim(),
              aka: v.aka.split(",").map((a) => a.trim()).filter(Boolean),
              category: "Snacks",
              measure: v.measure.trim() || "1 serving",
              grams: num(v.grams),
              kcal: num(v.kcal),
              protein: num(v.protein),
              carbs: num(v.carbs),
              fat: num(v.fat),
              custom: true,
            })
          }
        >
          Add food
        </Button>
      </div>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- recipes */

function Recipes({ items }: { items: Recipe[] }) {
  const [q, setQ] = useState("");
  const shown = items.filter((r) => `${r.name} ${r.region} ${r.tags.join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="mb-4">
        <Search value={q} onChange={setQ} placeholder="Recipe, region or tag" label="Search recipes" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-md font-semibold">{r.name}</p>
                <p className="text-sm text-muted">
                  {r.region} · {r.serving}
                </p>
              </div>
              <span className="tnum rounded-lg bg-surface px-2 py-1 text-right font-mono text-sm">
                <span className="block font-medium">{r.kcal}</span>
                <span className="text-2xs text-muted">kcal</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["Protein", r.protein, "bg-nutrition"],
                ["Carbs", r.carbs, "bg-warning"],
                ["Fat", r.fat, "bg-recovery"],
              ].map(([label, g, c]) => (
                <div key={label as string} className="rounded-lg border border-line px-2 py-1.5">
                  <p className="flex items-center justify-center gap-1 text-2xs text-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${c}`} aria-hidden />
                    {label}
                  </p>
                  <p className="tnum font-mono text-base font-medium">{g} g</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">{r.ingredients.join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.map((t) => (
                <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                  {t}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ----------------------------------------------------------- diet builder */

type Day = Record<string, DietItem[]>;

const SAMPLE_DAY: Day = {
  Breakfast: [{ foodId: "poha", qty: 1 }, { foodId: "egg", qty: 2 }, { foodId: "chai", qty: 1 }],
  Lunch: [{ foodId: "roti", qty: 2 }, { foodId: "dal", qty: 1 }, { foodId: "mixed-veg", qty: 1 }, { foodId: "curd", qty: 1 }],
  "Evening snack": [{ foodId: "sprouts", qty: 1 }, { foodId: "buttermilk", qty: 1 }],
  Dinner: [{ foodId: "rice", qty: 1 }, { foodId: "chicken-curry", qty: 1 }, { foodId: "salad", qty: 1 }],
};

function DietBuilder({ foods, clients, slots }: { foods: Food[]; clients: Client[]; slots: readonly string[] }) {
  const eligible = clients.filter((c) => c.weights.length > 0);
  const [clientId, setClientId] = useState(eligible[0]?.id ?? "");
  const client = clients.find((c) => c.id === clientId);
  const targets = client ? dietTargets(client) : null;
  const empty: Day = Object.fromEntries(slots.map((s) => [s, []]));
  const [day, setDay] = useState<Day>(empty);
  const [notice, setNotice] = useState("");
  const all = slots.flatMap((s) => day[s] ?? []);
  const totals = dietTotals(all, foods);

  const setSlot = (slot: string, items: DietItem[]) => {
    setDay((d) => ({ ...d, [slot]: items }));
    setNotice("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Card className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="diet-client" className="mb-1.5 block text-sm font-medium">
              Client
            </label>
            <select id="diet-client" value={clientId} onChange={(e) => { setClientId(e.target.value); setDay(empty); setNotice(""); }} className={`${inputClass} h-10`}>
              {eligible.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.goal}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={() => setDay(SAMPLE_DAY)}>
            Start from a sample Indian day
          </Button>
          <Button variant="quiet" onClick={() => setDay(empty)}>
            Clear
          </Button>
        </Card>

        {slots.map((slot) => (
          <MealSlot key={slot} slot={slot} items={day[slot] ?? []} foods={foods} onChange={(items) => setSlot(slot, items)} />
        ))}
      </div>

      <aside className="xl:sticky xl:top-20 xl:self-start">
        <Card>
          <p className="text-md font-semibold">Day totals</p>
          <p className="text-sm text-muted">{targets ? `Targets for ${client?.name.split(" ")[0]}: from their latest weight` : "Pick a client to see targets"}</p>
          <div className="mt-4 space-y-4">
            <TargetBar label="Calories" value={totals.kcal} target={targets?.kcal ?? null} unit="kcal" />
            <TargetBar label="Protein" value={totals.protein} target={targets?.protein ?? null} unit="g" />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-base">
            <div>
              <dt className="text-sm text-muted">Carbs</dt>
              <dd className="tnum font-mono">{Math.round(totals.carbs)} g</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Fat</dt>
              <dd className="tnum font-mono">{Math.round(totals.fat)} g</dd>
            </div>
          </dl>
          <Button
            className="mt-5 w-full"
            disabled={all.length === 0 || !client}
            onClick={() => setNotice(`Saved as ${client?.name.split(" ")[0]}'s meal plan. It shows in their Arcwell app with the same measures.`)}
          >
            Save to {client?.name.split(" ")[0] ?? "client"}&apos;s plan
          </Button>
          {notice ? (
            <p role="status" className="mt-3 flex gap-2 rounded-lg bg-tintSuccess px-3 py-2 text-sm text-success">
              <Icon name="check" size={14} className="mt-0.5 shrink-0" /> {notice}
            </p>
          ) : null}
        </Card>
      </aside>
    </div>
  );
}

function TargetBar({ label, value, target, unit }: { label: string; value: number; target: number | null; unit: string }) {
  const pct = target ? (value / target) * 100 : 0;
  const state = !target ? "none" : pct > 110 ? "over" : pct >= 90 ? "on" : "under";
  const color = state === "on" ? "bg-success" : state === "over" ? "bg-brand" : "bg-ink";
  const word = state === "on" ? "On target" : state === "over" ? "Over target" : state === "under" ? `${Math.round((target ?? 0) - value)} ${unit} to go` : "";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="tnum font-mono text-base">
          <span className="font-medium">{Math.round(value)}</span>
          {target ? <span className="text-muted"> / {target} {unit}</span> : ` ${unit}`}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
        <div className={`h-full rounded-full ${color} transition-[width] duration-[220ms] ease-quiet`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      {word ? <p className={`mt-1 text-xs ${state === "over" ? "text-brandInk" : state === "on" ? "text-success" : "text-muted"}`}>{word}</p> : null}
    </div>
  );
}

function MealSlot({ slot, items, foods, onChange }: { slot: string; items: DietItem[]; foods: Food[]; onChange: (items: DietItem[]) => void }) {
  const [picking, setPicking] = useState<{ mode: "add" } | { mode: "swap"; index: number } | null>(null);
  const t = dietTotals(items, foods);
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-md font-semibold">{slot}</p>
        <p className="tnum font-mono text-sm text-muted">
          {Math.round(t.kcal)} kcal · {Math.round(t.protein)} g protein
        </p>
      </div>
      {items.length === 0 ? <p className="px-5 py-4 text-sm text-muted">Nothing planned yet.</p> : null}
      <ul className="divide-y divide-line">
        {items.map((it, i) => {
          const f = foods.find((x) => x.id === it.foodId);
          if (!f) return null;
          return (
            <li key={`${it.foodId}-${i}`} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">{f.name}</span>
                <span className="tnum block font-mono text-xs text-muted">
                  {Math.round(f.kcal * it.qty)} kcal · {Math.round(f.protein * it.qty * 10) / 10} g protein
                </span>
              </span>
              <span className="flex items-center gap-1">
                <StepButton label={`Less ${f.name}`} onClick={() => onChange(items.map((x, k) => (k === i ? { ...x, qty: Math.max(0.5, x.qty - 0.5) } : x)))}>
                  −
                </StepButton>
                <span className="tnum w-24 text-center font-mono text-sm" aria-live="polite">
                  {it.qty} × {f.measure.replace(/^1 /, "")}
                </span>
                <StepButton label={`More ${f.name}`} onClick={() => onChange(items.map((x, k) => (k === i ? { ...x, qty: x.qty + 0.5 } : x)))}>
                  +
                </StepButton>
              </span>
              <Button variant="quiet" className="px-2" onClick={() => setPicking({ mode: "swap", index: i })}>
                Swap
              </Button>
              <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remove ${f.name}`} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-surface hover:text-ink">
                <Icon name="close" size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line px-5 py-2.5">
        <Button variant="quiet" className="px-2" onClick={() => setPicking({ mode: "add" })}>
          <Icon name="plus" size={14} /> Add food to {slot.toLowerCase()}
        </Button>
      </div>
      {picking ? (
        <FoodPicker
          foods={foods}
          title={picking.mode === "add" ? `Add to ${slot.toLowerCase()}` : "Swap for…"}
          onClose={() => setPicking(null)}
          onPick={(f) => {
            if (picking.mode === "add") onChange([...items, { foodId: f.id, qty: 1 }]);
            else onChange(items.map((x, k) => (k === picking.index ? { foodId: f.id, qty: 1 } : x)));
            setPicking(null);
          }}
        />
      ) : null}
    </Card>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-7 w-7 place-items-center rounded-md border border-line text-md transition-colors duration-[120ms] ease-quiet hover:border-strong active:scale-95">
      {children}
    </button>
  );
}

function FoodPicker({ foods, title, onClose, onPick }: { foods: Food[]; title: string; onClose: () => void; onPick: (f: Food) => void }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => searchFoods(foods, q).slice(0, 40), [foods, q]);
  return (
    <Dialog title={title} onClose={onClose}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. dahi or idli" aria-label="Search foods" className={`${inputClass} h-10`} />
      <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
        {shown.length === 0 ? <li className="px-3 py-4 text-center text-sm text-muted">Nothing matches.</li> : null}
        {shown.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => onPick(f)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface">
              <span>
                <span className="block text-base font-medium">{f.name}</span>
                <span className="block text-xs text-muted">{f.measure}</span>
              </span>
              <span className="tnum font-mono text-sm text-muted">
                {f.kcal} kcal · {f.protein} g
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- shared */

function Search({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-card px-3 text-muted shadow-sm transition-colors duration-[120ms] ease-quiet focus-within:border-brand hover:border-strong">
      <Icon name="search" size={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint" />
    </label>
  );
}

function FieldRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[color-mix(in_srgb,var(--text)_50%,transparent)] p-6" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div ref={ref} className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-xl border border-line bg-card p-6 shadow-md`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink">
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


