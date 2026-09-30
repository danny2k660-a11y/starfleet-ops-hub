import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — STO Command Center" },
      { name: "description", content: "Account details, sign-in options and application preferences." },
      { property: "og:title", content: "Settings — STO Command Center" },
      { property: "og:description", content: "Account details, sign-in options and application preferences." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="Settings"
      subtitle="Account and preferences"
      description="Account details, sign-in options and application preferences."
      planned={["Profile details", "Sign-in methods", "Data export", "Danger zone"]}
    />
  );
}
