import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({ meta: [{ title: "Themes — STO Command Center" }] }),
  component: Page,
});

function Page() {
  return <PlaceholderPage title="Themes" subtitle="Theme identity and compliance" description="Theme support is planned, but the live database does not yet contain theme rules. The build editor therefore avoids pretending that theme compliance is active." planned={["Terran and Mirror themes","Canon and screen-accurate rules","Required and forbidden equipment","Build compliance checks"]} />;
}
