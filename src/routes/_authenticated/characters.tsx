import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/characters")({
  head: () => ({
    meta: [
      { title: "Characters — STO Command Center" },
      { name: "description", content: "Each character owns its own ships, builds and equipment. Nothing is shared between characters unless you say so." },
      { property: "og:title", content: "Characters — STO Command Center" },
      { property: "og:description", content: "Each character owns its own ships, builds and equipment. Nothing is shared between characters unless you say so." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Characters"
      subtitle="Your STO captains"
      description="Each character owns its own ships, builds and equipment. Nothing is shared between characters unless you say so."
      planned={["Character roster", "Faction, career and species", "Level and progression", "Per-character equipment access"]}
    />
  );
}
