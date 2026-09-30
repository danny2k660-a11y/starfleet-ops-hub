import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — STO Command Center" },
      { name: "description", content: "Grinds, reputation projects, upgrades and anything else you are working towards." },
      { property: "og:title", content: "Projects — STO Command Center" },
      { property: "og:description", content: "Grinds, reputation projects, upgrades and anything else you are working towards." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Projects"
      subtitle="Long-term goals"
      description="Grinds, reputation projects, upgrades and anything else you are working towards."
      planned={["Project checklists", "Target dates", "Linked characters", "Progress tracking"]}
    />
  );
}
