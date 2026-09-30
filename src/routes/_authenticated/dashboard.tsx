import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Rocket, Wrench, ListChecks, Database, Package, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — STO Command Center" }, { name: "description", content: "Your STO fleet, characters, builds and project status." }] }),
  component: Dashboard,
});

type Card = { label: string; icon: LucideIcon; to: NonNullable<LinkProps["to"]>; key: string; hint: string };
const cards: Card[] = [
  { label: "Characters", icon: Users, to: "/characters", key: "characters", hint: "Captains in your roster" },
  { label: "Ships", icon: Rocket, to: "/ships", key: "ships", hint: "Registered vessels" },
  { label: "Builds", icon: Wrench, to: "/builds", key: "builds", hint: "Saved configurations" },
  { label: "Projects", icon: ListChecks, to: "/projects", key: "projects", hint: "Goals and grinds" },
  { label: "Inventory", icon: Package, to: "/inventory", key: "inventory", hint: "Tracked equipment" },
  { label: "Resources", icon: Database, to: "/resources", key: "resources", hint: "Currencies and materials" },
  { label: "Themes", icon: Palette, to: "/themes", key: "themes", hint: "Theme presets" },
];

function useCount(table: "characters" | "user_ships" | "builds") {
  return useQuery({ queryKey: ["dashboard-count", table], queryFn: async () => {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  }});
}

function Dashboard() {
  const characters = useCount("characters");
  const ships = useCount("user_ships");
  const builds = useCount("builds");
  const counts: Record<string, number | null> = { characters: characters.data ?? null, ships: ships.data ?? null, builds: builds.data ?? null };

  return <AppShell title="Dashboard" subtitle="Fleet status overview">
    <div className="space-y-6">
      <div><p className="lcars-label">Command overview</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Fleet Operations</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your personal STO command centre. Character ownership stays separate, ships stay assigned to their captains, and builds stay attached to ships.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <Link key={card.key} to={card.to} className="panel group p-5 transition hover:border-primary hover:glow-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{card.label}</p><p className="mt-2 font-display text-3xl text-primary">{counts[card.key] ?? "—"}</p></div><card.icon className="size-5 text-accent" /></div><p className="mt-3 text-sm text-muted-foreground">{card.hint}</p></Link>)}</div>
      <div className="panel p-5"><p className="lcars-label">System architecture</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded border border-border p-3"><b>Characters</b><p className="text-muted-foreground">Owners of ships and gear.</p></div><div className="rounded border border-border p-3"><b>Ships</b><p className="text-muted-foreground">Your owned instances linked to the STO catalogue.</p></div><div className="rounded border border-border p-3"><b>Builds</b><p className="text-muted-foreground">Saved configurations ready for loadouts.</p></div></div></div>
    </div>
  </AppShell>;
}
