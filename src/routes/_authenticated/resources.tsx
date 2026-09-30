import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resources — STO Command Center" },
      { name: "description", content: "Dilithium, marks, upgrade materials and other resources you track across characters." },
      { property: "og:title", content: "Resources — STO Command Center" },
      { property: "og:description", content: "Dilithium, marks, upgrade materials and other resources you track across characters." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Resources"
      subtitle="Currencies and materials"
      description="Dilithium, marks, upgrade materials and other resources you track across characters."
      planned={["Currency balances", "Per-character totals", "Material stockpiles", "Spending plans"]}
    />
  );
}
