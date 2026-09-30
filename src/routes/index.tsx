import { createFileRoute, Link } from "@tanstack/react-router";
import { Radar, ShieldCheck, Rocket, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STO Command Center — Star Trek Online fleet manager" },
      {
        name: "description",
        content:
          "Track your Star Trek Online characters, ships, builds and loadouts in one dark, futuristic command console.",
      },
      { property: "og:title", content: "STO Command Center" },
      {
        property: "og:description",
        content:
          "Track your Star Trek Online characters, ships, builds and loadouts in one command console.",
      },
    ],
  }),
  component: Landing,
});

const highlights = [
  {
    icon: Rocket,
    title: "Ships & instances",
    text: "A shared ship database, kept separate from the ships you personally own and name.",
  },
  {
    icon: Wrench,
    title: "Builds & loadouts",
    text: "Multiple builds per ship, each with saved loadout variants.",
  },
  {
    icon: ShieldCheck,
    title: "Per-character",
    text: "Everything is scoped per character — nothing is assumed to be shared.",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/50 text-primary glow-primary">
            <Radar className="size-5" />
          </div>
          <span className="truncate font-display text-sm font-bold tracking-[0.2em]">
            STO COMMAND CENTER
          </span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-12 sm:px-8">
        <p className="lcars-label">Personal operations console</p>
        <h1 className="mt-3 text-3xl leading-tight sm:text-5xl">
          Command your <span className="text-primary">Star Trek Online</span> account
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Characters, ships, builds, loadouts, inventory and long-term projects — organised in
          one place, built to grow into a full ship and equipment database.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Enter the bridge</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.title} className="panel p-5">
              <h.icon className="size-5 text-accent" />
              <h2 className="mt-3 text-base">{h.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
