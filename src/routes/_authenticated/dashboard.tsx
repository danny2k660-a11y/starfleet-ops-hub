import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Rocket, Wrench, ListChecks, Database, Package, Palette, Target, Activity, ChevronRight } from "lucide-react";
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
  { label: "Themes", icon: Palette, to: "/themes", key: "themes", hint: "Theme presets & custom rules" },
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
  const projects = useQuery({ queryKey: ["dashboard-projects"], queryFn: async () => { const { count, error } = await supabase.from("projects" as never).select("id",{count:"exact",head:true}); if(error) throw error; return count ?? 0; }});
  const resources = useQuery({ queryKey: ["dashboard-resources"], queryFn: async () => { const { count, error } = await supabase.from("resource_balances" as never).select("id",{count:"exact",head:true}); if(error) throw error; return count ?? 0; }});
  const themeRules = useQuery({ queryKey: ["dashboard-theme-rules"], queryFn: async () => { const { count, error } = await supabase.from("theme_rules" as never).select("id",{count:"exact",head:true}); if(error) throw error; return count ?? 0; }});
  const recentShips = useQuery({ queryKey: ["dashboard-recent-ships"], queryFn: async () => { const { data, error } = await supabase.from("user_ships").select("id,custom_name,characters(name),sto_ships(name),builds(name,status)").order("created_at",{ascending:false}).limit(5); if(error) throw error; return data as any[]; }});
  const activeProjects = useQuery({ queryKey: ["dashboard-active-projects"], queryFn: async () => { const { data, error } = await supabase.from("projects" as never).select("id,name,status,priority,progress,characters(name)").eq("status","active").order("updated_at",{ascending:false}).limit(5); if(error) throw error; return data as any[]; }});
  const attention = useQuery({ queryKey: ["dashboard-attention"], queryFn: async () => {
    const [shipsRes, buildsRes, projectsRes, resourcesRes] = await Promise.all([
      supabase.from("user_ships").select("id,current_build_id,custom_name").is("current_build_id", null),
      supabase.from("builds").select("id,name,status").neq("status","retired").neq("status","active"),
      supabase.from("projects" as never).select("id,name,status,progress").eq("status","active"),
      supabase.from("resource_balances" as never).select("id,name,quantity,target").gt("target",0),
    ]);
    if (shipsRes.error) throw shipsRes.error;
    if (buildsRes.error) throw buildsRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (resourcesRes.error) throw resourcesRes.error;
    const resourcesNearTarget = (resourcesRes.data ?? []).filter((x: any) => Number(x.quantity ?? 0) < Number(x.target ?? 0) && Number(x.quantity ?? 0) / Number(x.target ?? 1) >= 0.8);
    return { shipsWithoutBuild: shipsRes.data ?? [], draftBuilds: buildsRes.data ?? [], activeProjects: projectsRes.data ?? [], resourcesNearTarget };
  }});
  const counts: Record<string, number | null> = { characters: characters.data ?? null, ships: ships.data ?? null, builds: builds.data ?? null, projects: projects.data ?? null, resources: resources.data ?? null, themes: themeRules.data ?? null };

  return <AppShell title="Dashboard" subtitle="Fleet status overview">
    <div className="space-y-6">
      <div><p className="lcars-label">Command overview</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Fleet Operations</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your personal STO command centre. Character ownership stays separate, ships stay assigned to their captains, and builds stay attached to ships.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <Link key={card.key} to={card.to} className="panel group p-5 transition hover:border-primary hover:glow-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{card.label}</p><p className="mt-2 font-display text-3xl text-primary">{counts[card.key] ?? "—"}</p></div><card.icon className="size-5 text-accent" /></div><p className="mt-3 text-sm text-muted-foreground">{card.hint}</p></Link>)}</div>
      <div className="panel p-5">
        <div className="flex items-center justify-between"><div><p className="lcars-label">Command attention</p><h3 className="font-display text-lg text-primary">Fleet readiness queue</h3></div><Activity className="size-5 text-accent" /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/ships" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Ships without build</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.shipsWithoutBuild.length ?? "—"}</p></Link>
          <Link to="/builds" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Builds needing work</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.draftBuilds.length ?? "—"}</p></Link>
          <Link to="/projects" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Active projects</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.activeProjects.length ?? "—"}</p></Link>
          <Link to="/resources" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Resources nearly funded</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.resourcesNearTarget.length ?? "—"}</p></Link>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5"><div className="flex items-center justify-between"><div><p className="lcars-label">Fleet registry</p><h3 className="font-display text-lg text-primary">Recent ships</h3></div><Link to="/ships" className="text-xs text-accent">View all <ChevronRight className="inline size-3"/></Link></div><div className="mt-3 space-y-2">{(recentShips.data??[]).length ? (recentShips.data??[]).map((s:any)=><Link key={s.id} to="/ships" className="flex items-center justify-between rounded border border-border p-3 hover:border-primary"><div><p className="font-medium">{s.custom_name}</p><p className="text-xs text-muted-foreground">{s.sto_ships?.name??"Unknown"} · {s.characters?.name??"Unassigned"}</p></div><span className="text-xs text-accent">{s.builds?.name??"No build"}</span></Link>) : <p className="text-sm text-muted-foreground">No ships registered yet.</p>}</div></div>
        <div className="panel p-5"><div className="flex items-center justify-between"><div><p className="lcars-label">Mission control</p><h3 className="font-display text-lg text-primary">Active projects</h3></div><Link to="/projects" className="text-xs text-accent">View all <ChevronRight className="inline size-3"/></Link></div><div className="mt-3 space-y-2">{(activeProjects.data??[]).length ? (activeProjects.data??[]).map((p:any)=><Link key={p.id} to="/projects" className="block rounded border border-border p-3 hover:border-primary"><div className="flex justify-between gap-2"><span className="font-medium">{p.name}</span><span className="text-xs text-accent">{p.progress??0}%</span></div><p className="mt-1 text-xs text-muted-foreground">{p.characters?.name??"Account operation"} · {p.priority??"normal"} priority</p></Link>) : <p className="text-sm text-muted-foreground">No active projects.</p>}</div></div>
      </div>
      <div className="panel p-5"><p className="lcars-label">System architecture</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded border border-border p-3"><b>Characters</b><p className="text-muted-foreground">Owners of ships and gear.</p></div><div className="rounded border border-border p-3"><b>Ships</b><p className="text-muted-foreground">Your owned instances linked to the STO catalogue.</p></div><div className="rounded border border-border p-3"><b>Builds</b><p className="text-muted-foreground">Saved configurations ready for loadouts.</p></div></div></div>
    </div>
  </AppShell>;
}
