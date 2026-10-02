import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Rocket, Wrench, ListChecks, Database, Package, Palette, Activity, ChevronRight } from "lucide-react";
import { useMemo } from "react";
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
  return useQuery({
    queryKey: ["dashboard-count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
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
      supabase.from("user_ships").select("id,current_build_id,custom_name").eq("ownership_status","owned").is("current_build_id", null),
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

  const readinessShips = useQuery({
    queryKey: ["dashboard-operational-readiness"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ships")
        .select("id,custom_name,character_id,current_build_id,theme_id,ownership_status,sto_ships(*)")
        .eq("ownership_status", "owned");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const readinessBuildIds = useMemo(
    () => (readinessShips.data ?? []).map((ship: any) => ship.current_build_id).filter(Boolean) as string[],
    [readinessShips.data],
  );
  const readinessLoadouts = useQuery({
    queryKey: ["dashboard-operational-loadouts", readinessBuildIds],
    enabled: readinessBuildIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("loadouts").select("id,build_id,is_active").in("build_id", readinessBuildIds);
      if (error) throw error;
      return data ?? [];
    },
  });
  const activeReadinessLoadouts = useMemo(
    () => (readinessLoadouts.data ?? []).filter((loadout: any) => loadout.is_active),
    [readinessLoadouts.data],
  );
  const activeReadinessLoadoutIds = useMemo(
    () => activeReadinessLoadouts.map((loadout: any) => loadout.id),
    [activeReadinessLoadouts],
  );
  const readinessConfig = useQuery({
    queryKey: ["dashboard-operational-config", activeReadinessLoadoutIds],
    enabled: activeReadinessLoadoutIds.length > 0,
    queryFn: async () => {
      const [equipment, traits, boffs] = await Promise.all([
        supabase.from("loadout_equipment").select("loadout_id,slot").in("loadout_id", activeReadinessLoadoutIds),
        supabase.from("loadout_traits").select("loadout_id,id").in("loadout_id", activeReadinessLoadoutIds),
        supabase.from("loadout_boffs").select("loadout_id,station").in("loadout_id", activeReadinessLoadoutIds),
      ]);
      if (equipment.error) throw equipment.error;
      if (traits.error) throw traits.error;
      if (boffs.error) throw boffs.error;
      return { equipment: equipment.data ?? [], traits: traits.data ?? [], boffs: boffs.data ?? [] };
    },
  });

  const operational = useMemo(() => {
    const rows = (readinessShips.data ?? []).map((ship: any) => {
      const active = activeReadinessLoadouts.find((loadout: any) => loadout.build_id === ship.current_build_id);
      const catalog = ship.sto_ships;
      const slots: string[] = [];
      const addSlots = (label: string, count: unknown) => {
        for (let i = 1; i <= Number(count || 0); i += 1) slots.push(`${label} ${i}`);
      };
      if (catalog) {
        addSlots("Fore Weapon", catalog.fore_weapon_slots);
        addSlots("Aft Weapon", catalog.aft_weapon_slots);
        if (catalog.experimental_weapon_slot || catalog.experimental_weapon) slots.push("Experimental Weapon");
        addSlots("Engineering Console", catalog.engineering_console_slots);
        addSlots("Science Console", catalog.science_console_slots);
        addSlots("Tactical Console", catalog.tactical_console_slots);
        addSlots("Universal Console", catalog.universal_console_slots);
        addSlots("Hangar Bay", catalog.hangar_bays);
        slots.push("Deflector", "Impulse Engines", "Warp Core", "Shields");
      }
      const expectedStations = catalog?.bridge_officer_stations && typeof catalog.bridge_officer_stations === "object"
        ? Array.isArray(catalog.bridge_officer_stations)
          ? catalog.bridge_officer_stations.map((entry: any) => typeof entry === "string" ? entry : entry?.station ?? entry?.name).filter(Boolean).map(String)
          : Object.keys(catalog.bridge_officer_stations)
        : [];
      const equipment = (readinessConfig.data?.equipment ?? []).filter((x: any) => x.loadout_id === active?.id);
      const traits = (readinessConfig.data?.traits ?? []).filter((x: any) => x.loadout_id === active?.id);
      const boffs = (readinessConfig.data?.boffs ?? []).filter((x: any) => x.loadout_id === active?.id);
      const assignedSlots = new Set(equipment.map((x: any) => String(x.slot ?? "").trim().toLowerCase()).filter(Boolean));
      const configuredStations = new Set(boffs.map((x: any) => String(x.station ?? "").trim().toLowerCase()).filter(Boolean));
      const checks = [
        !!ship.character_id,
        !!ship.current_build_id,
        !!ship.theme_id,
        !!active,
        !!catalog && slots.length > 0 && slots.every((slot) => assignedSlots.has(slot.toLowerCase())),
        traits.length > 0,
        !!catalog && expectedStations.length > 0 && expectedStations.every((station) => configuredStations.has(station.toLowerCase())),
      ];
      return { checks, complete: checks.filter(Boolean).length };
    });
    const passed = rows.reduce((sum, row) => sum + row.complete, 0);
    const total = rows.length * 7;
    return {
      shipCount: rows.length,
      ready: rows.filter((row) => row.complete === 7).length,
      action: rows.filter((row) => row.complete < 7).length,
      percent: total ? Math.round((passed / total) * 100) : 0,
      scanning: readinessShips.isLoading || readinessLoadouts.isLoading || readinessConfig.isLoading,
      error: !!(readinessShips.error || readinessLoadouts.error || readinessConfig.error),
    };
  }, [readinessShips.data, readinessShips.isLoading, readinessShips.error, readinessLoadouts.data, readinessLoadouts.isLoading, readinessLoadouts.error, readinessConfig.data, readinessConfig.isLoading, readinessConfig.error, activeReadinessLoadouts]);

  const counts: Record<string, number | null> = { characters: characters.data ?? null, ships: ships.data ?? null, builds: builds.data ?? null, projects: projects.data ?? null, resources: resources.data ?? null, themes: themeRules.data ?? null };

  return <AppShell title="Dashboard" subtitle="Fleet status overview">
    <div className="space-y-6">
      <div><p className="lcars-label">Command overview</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Fleet Operations</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your personal STO command centre. Character ownership stays separate, ships stay assigned to their captains, and builds stay attached to ships.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <Link key={card.key} to={card.to} className="panel group p-5 transition hover:border-primary hover:glow-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{card.label}</p><p className="mt-2 font-display text-3xl text-primary">{counts[card.key] ?? "—"}</p></div><card.icon className="size-5 text-accent" /></div><p className="mt-3 text-sm text-muted-foreground">{card.hint}</p></Link>)}</div>
      {(characters.isError || ships.isError || builds.isError || projects.isError || resources.isError || themeRules.isError) && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-medium text-destructive">Some command data could not be loaded.</p><p className="mt-1 text-muted-foreground">Your existing fleet data is unchanged. Refresh the page or open the affected section directly for more detail.</p></div>}
      <div className="panel p-5">
        <div className="flex items-center justify-between"><div><p className="lcars-label">Command attention</p><h3 className="font-display text-lg text-primary">Fleet readiness queue</h3></div><Activity className="size-5 text-accent" /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/ships" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Ships without build</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.shipsWithoutBuild.length ?? "—"}</p></Link>
          <Link to="/builds" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Builds needing work</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.draftBuilds.length ?? "—"}</p></Link>
          <Link to="/projects" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Active projects</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.activeProjects.length ?? "—"}</p></Link>
          <Link to="/resources" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Resources nearly funded</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.resourcesNearTarget.length ?? "—"}</p></Link>
        </div>
      </div>
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="lcars-label">Operational readiness</p><h3 className="font-display text-lg text-primary">Seven-point fleet scan</h3><p className="text-xs text-muted-foreground">Captain · build · theme · active loadout · equipment · traits · bridge crew</p></div>
          <Link to="/ships" className="text-xs text-accent">Open fleet command <ChevronRight className="inline size-3"/></Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Fleet ships</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.shipCount}</p><p className="text-[10px] text-muted-foreground">owned vessels</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Fully ready</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.ready}</p><p className="text-[10px] text-muted-foreground">7/7 checks</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Action required</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.action}</p><p className="text-[10px] text-muted-foreground">one or more checks missing</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Fleet score</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : `${operational.percent}%`}</p><p className="text-[10px] text-muted-foreground">{operational.error ? "scan unavailable" : operational.scanning ? "scanning…" : "operational checks passed"}</p></div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${operational.scanning || operational.error ? 0 : operational.percent}%` }} /></div>
      </div>
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="lcars-label">Personnel command</p>
            <h3 className="font-display text-lg text-primary">Captain readiness</h3>
            <p className="text-xs text-muted-foreground">Every captain stays isolated while their assigned fleet remains visible at a glance.</p>
          </div>
          <Link to="/characters" className="text-xs text-accent">Open personnel registry <ChevronRight className="inline size-3" /></Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(() => {
            const characterRows = (characters.data ?? []).map((character: any) => {
              const assigned = (readinessShips.data ?? []).filter((ship: any) => ship.character_id === character.id);
              const ready = assigned.filter((ship: any) => {
                const active = activeReadinessLoadouts.find((loadout: any) => loadout.build_id === ship.current_build_id);
                const catalog = ship.sto_ships;
                const slots: string[] = [];
                const add = (label: string, count: unknown) => {
                  for (let i = 1; i <= Number(count || 0); i += 1) slots.push(`${label} ${i}`);
                };
                if (catalog) {
                  add("Fore Weapon", catalog.fore_weapon_slots);
                  add("Aft Weapon", catalog.aft_weapon_slots);
                  if (catalog.experimental_weapon_slot || catalog.experimental_weapon) slots.push("Experimental Weapon");
                  add("Engineering Console", catalog.engineering_console_slots);
                  add("Science Console", catalog.science_console_slots);
                  add("Tactical Console", catalog.tactical_console_slots);
                  add("Universal Console", catalog.universal_console_slots);
                  add("Hangar Bay", catalog.hangar_bays);
                  slots.push("Deflector", "Impulse Engines", "Warp Core", "Shields");
                }
                const expectedStations = catalog?.bridge_officer_stations && typeof catalog.bridge_officer_stations === "object"
                  ? Array.isArray(catalog.bridge_officer_stations)
                    ? catalog.bridge_officer_stations.map((entry: any) => typeof entry === "string" ? entry : entry?.station ?? entry?.name).filter(Boolean).map(String)
                    : Object.keys(catalog.bridge_officer_stations)
                  : [];
                const equipment = (readinessConfig.data?.equipment ?? []).filter((x: any) => x.loadout_id === active?.id);
                const traits = (readinessConfig.data?.traits ?? []).filter((x: any) => x.loadout_id === active?.id);
                const boffs = (readinessConfig.data?.boffs ?? []).filter((x: any) => x.loadout_id === active?.id);
                const equipmentSlots = new Set(equipment.map((x: any) => String(x.slot ?? "").trim().toLowerCase()).filter(Boolean));
                const boffStations = new Set(boffs.map((x: any) => String(x.station ?? "").trim().toLowerCase()).filter(Boolean));
                const checks = [
                  !!ship.character_id,
                  !!ship.current_build_id,
                  !!ship.theme_id,
                  !!active,
                  !!catalog && slots.length > 0 && slots.every((slot) => equipmentSlots.has(slot.toLowerCase())),
                  traits.length > 0,
                  !!catalog && expectedStations.length > 0 && expectedStations.every((station) => boffStations.has(station.toLowerCase())),
                ];
                return checks.every(Boolean);
              }).length;
              return { character, assigned: assigned.length, ready };
            });
            return characterRows.length
              ? characterRows.map(({ character, assigned, ready }) => (
                  <Link key={character.id} to="/characters" className="rounded border border-border bg-muted/10 p-4 transition hover:border-primary">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="lcars-label">{character.faction ?? "Faction not set"}</p>
                        <p className="font-display text-base text-primary">{character.name}</p>
                      </div>
                      <Users className="size-4 text-accent" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded border border-border p-2">
                        <p className="font-display text-xl text-primary">{assigned}</p>
                        <p className="text-[10px] text-muted-foreground">assigned ships</p>
                      </div>
                      <div className="rounded border border-border p-2">
                        <p className="font-display text-xl text-primary">{ready}</p>
                        <p className="text-[10px] text-muted-foreground">7/7 ready</p>
                      </div>
                    </div>
                  </Link>
                ))
              : <p className="text-sm text-muted-foreground">No captains registered yet.</p>;
          })()}
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
