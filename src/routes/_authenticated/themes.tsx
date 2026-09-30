import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({
    meta: [
      { title: "Themes — STO Command Center" },
      { name: "description", content: "Visual themes for the console, so you can match your favourite faction." },
      { property: "og:title", content: "Themes — STO Command Center" },
      { property: "og:description", content: "Visual themes for the console, so you can match your favourite faction." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Themes"
      subtitle="Interface appearance"
      description="Visual themes for the console, so you can match your favourite faction."
      planned={["Faction colour schemes", "Accent colours", "Density options", "Saved preferences"]}
    />
  );
}
