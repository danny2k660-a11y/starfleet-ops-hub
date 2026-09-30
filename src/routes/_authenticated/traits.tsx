import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/traits")({
  head: () => ({
    meta: [
      { title: "Traits — STO Command Center" },
      { name: "description", content: "Trait tracking per character and per ship, including trait slots and unlocks." },
      { property: "og:title", content: "Traits — STO Command Center" },
      { property: "og:description", content: "Trait tracking per character and per ship, including trait slots and unlocks." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Traits"
      subtitle="Personal, starship and reputation traits"
      description="Trait tracking per character and per ship, including trait slots and unlocks."
      planned={["Personal traits", "Starship traits", "Reputation traits", "Active trait loadouts"]}
    />
  );
}
