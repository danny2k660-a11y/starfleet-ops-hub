import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — STO Command Center" }] }),
  component: Page,
});

function Page() {
  return <PlaceholderPage title="Projects" subtitle="Long-term fleet operations" description="Project tracking is reserved for a future data module. Build status and ship planning now live in the build and ship-planner workflows." planned={["Build goals","Upgrade plans","Reputation and campaign goals","Task tracking"]} />;
}
