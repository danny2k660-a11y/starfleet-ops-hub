import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — STO Command Center" }] }),
  component: Page,
});

function Page() {
  return <PlaceholderPage title="Inventory" subtitle="Stored gear and account stock" description="Inventory storage is reserved for a future data module. The live app currently tracks fitted equipment through character and build loadouts instead of a nonexistent inventory table." planned={["Account and character storage","Item quantities and locations","Search and filtering","Transfer and storage history"]} />;
}
