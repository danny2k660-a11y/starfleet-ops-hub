import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/builds")({
  head: () => ({
    meta: [
      { title: "Builds — STO Command Center" },
      { name: "description", content: "Builds belong to one of your ships and can hold several saved loadout variants." },
      { property: "og:title", content: "Builds — STO Command Center" },
      { property: "og:description", content: "Builds belong to one of your ships and can hold several saved loadout variants." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Builds"
      subtitle="Ship build configurations"
      description="Builds belong to one of your ships and can hold several saved loadout variants."
      planned={["Build per ship instance", "Multiple loadouts", "Build role and status", "Build notes"]}
    />
  );
}
