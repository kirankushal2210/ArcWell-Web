import { LibraryWorkspace } from "@/components/LibraryWorkspace";
import { CLIENTS, FOODS, LIBRARY, MEAL_SLOTS, RECIPES } from "@/lib/data";

export const metadata = { title: "Library — Arcwell" };

export default function LibraryPage() {
  return <LibraryWorkspace exercises={LIBRARY} foods={FOODS} recipes={RECIPES} clients={CLIENTS} slots={MEAL_SLOTS} />;
}
