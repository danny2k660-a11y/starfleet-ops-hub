import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({
    meta: [
      { title: "Equipment — STO Command Center" },
      { name: "description", content: "Weapons, consoles, deflectors and other fittings, ready to be linked into loadouts." },
      { property: "og:title", content: "Equipment — STO Command Center" },
      { property: "og:description", content: "Weapons, consoles, deflectors and other fittings, ready to be linked into loadouts." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Equipment"
      subtitle="Fittings and gear"
      description="Weapons, consoles, deflectors and other fittings, ready to be linked into loadouts."
      planned={["Equipment catalogue", "Mods and rarity", "Slot compatibility", "Loadout assignment"]}
    />
  );
}
