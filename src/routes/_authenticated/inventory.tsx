import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — STO Command Center" },
      { name: "description", content: "A per-character view of what you actually own and where it is stored." },
      { property: "og:title", content: "Inventory — STO Command Center" },
      { property: "og:description", content: "A per-character view of what you actually own and where it is stored." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Inventory"
      subtitle="Stored items"
      description="A per-character view of what you actually own and where it is stored."
      planned={["Per-character inventory", "Bank and account storage", "Item quantities", "Quick assignment to builds"]}
    />
  );
}
