import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Rocket, Wrench, ListChecks, Database } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — STO Command Center" },
      {
        name: "description",
        content: "Overview of your Star Trek Online characters, ships, builds and projects.",
      },
      { property: "og:title", content: "Dashboard — STO Command Center" },
      {
        property: "og:description",
        content: "Overview of your characters, ships, builds and projects.",
      },
    ],
  }),
  component: Dashboard,
});

type Card = {
  label: string;
  icon: LucideIcon;
  to: NonNullable<LinkProps["to"]>;
  hint: string;
};

const cards: Card[] = [
  { label: "Characters", icon: Users, to: "/characters", hint: "No characters added yet" },
  { label: "Ships", icon: Rocket, to: "/ships", hint: "No ships assigned yet" },
  { label: "Active builds", icon: Wrench, to: "/builds", hint: "No builds in progress" },
  { label: "Active projects", icon: ListChecks, to: "/projects", hint: "No projects tracked" },
  { label: "Resources", icon: Database, to: "/resources", hint: "No resources logged" },
];

function Dashboard() {
  return (
    <AppShell title="Dashboard" subtitle="Fleet status overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="panel group p-5 transition-shadow hover:glow-primary"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="lcars-label">{card.label}</p>
                <p className="mt-2 font-display text-3xl text-primary">0</p>
              </div>
              <card.icon className="size-5 shrink-0 text-accent" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="panel mt-6 p-5">
        <p className="lcars-label">System notice</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the application shell. Each module is ready to be built out in turn — the ship
          database, personal ship instances, builds, loadouts and equipment will connect in that
          order.
        </p>
      </div>
    </AppShell>
  );
}
