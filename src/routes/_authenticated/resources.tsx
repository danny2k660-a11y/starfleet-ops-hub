import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({ meta: [{ title: "Resources — STO Command Center" }] }),
  component: Page,
});

function Page() {
  return <PlaceholderPage title="Resources" subtitle="Currencies and stockpiles" description="Resource tracking is reserved for a future data module. No resource-balance table exists in the live database, so this screen no longer attempts broken queries." planned={["Dilithium and currencies","Upgrade materials","Event and campaign tokens","Character versus account balances"]} />;
}
