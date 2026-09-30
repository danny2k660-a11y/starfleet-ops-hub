import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/ships")({
  head: () => ({
    meta: [
      { title: "Ships — STO Command Center" },
      { name: "description", content: "Your personally owned and named ships, each linked to an entry in the shared ship database." },
      { property: "og:title", content: "Ships — STO Command Center" },
      { property: "og:description", content: "Your personally owned and named ships, each linked to an entry in the shared ship database." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Ships"
      subtitle="Owned ship instances"
      description="Your personally owned and named ships, each linked to an entry in the shared ship database."
      planned={["Ship database entries", "Personal ship instances", "Assigned character", "Name and registry"]}
    />
  );
}
