import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Rocket, Wrench, ListChecks, Database, Package, Palette, Activity, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";

// Fleet totals are distinct STO ships, not character assignment rows.
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — STO Command Center" }, { name: "description", content: "Your STO fleet, characters, builds and project status." }] }),
  component: Dashboard,
});

type Card = { label: string; icon: LucideIcon; to: NonNullable<LinkProps["to"]>; key: string; hint: string };
const cards: Card[] = [
  { label: "Characters", icon: Users, to: "/characters", key: "characters", hint: "Captains in your roster" },
  { label: "Ships", icon: Rocket, to: "/ships", key: "ships", hint: "Registered vessels" },
  { label: "Space Builds", icon: Wrench, to: "/builds", key: "builds", hint: "Ship configurations" },
  { label: "Ground Builds", icon: Wrench, to: "/ground-builds", key: "ground-builds", hint: "Character ground loadouts" },
  { label: "Ship Planner", icon: ListChecks, to: "/ship-planner", key: "planner", hint: "Claim and assign ships" },
  { label: "Inventory", icon: Package, to: "/inventory", key: "inventory", hint: "Tracked equipment" },
  { label: "Resources", icon: Database, to: "/resources", key: "resources", hint: "Currencies and materials" },
  { label: "Themes", icon: Palette, to: "/themes", key: "themes", hint: "Theme presets & custom rules" },
];

function useCount(table: "characters" | "user_ships" | "builds") {
  return useQuery({
    queryKey: ["dashboard-count", table],
    queryFn: async () => {
      if (table === "user_ships") {
        const { data, error } = await supabase
          .from("user_ships")
          .select("sto_ship_id")
          .eq("ownership_status", "owned")
          .not("character_id", "is", null);
        if (error) throw error;
        return new Set((data ?? []).map((row: any) => row.sto_ship_id).filter(Boolean)).size;
      }
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function Dashboard() {
  const characters = useCount("characters");
  const characterList = useQuery({
    queryKey: ["dashboard-character-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("id,name,faction").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const ships = useCount("user_ships");
  const builds = useCount("builds");
  const plannerShips = useQuery({ queryKey: ["dashboard-planner-ships"], queryFn: async () => {
    const { data, error } = await supabase.from("user_ships").select("sto_ship_id").eq("ownership_status","owned").not("character_id","is",null).is("current_build_id",null);
    if(error) throw error;
    return new Set((data ?? []).map((row: any) => row.sto_ship_id).filter(Boolean)).size;
  }});
  const recentShips = useQuery({ queryKey: ["dashboard-recent-ships"], queryFn: async () => { const { data, error } = await supabase.from("user_ships").select("id,custom_name,characters(name),sto_ships(name),builds(name,status)").order("created_at",{ascending:false}).limit(5); if(error) throw error; return data as any[]; }});
  const attentionShips = useQuery({ queryKey: ["dashboard-attention-ships"], queryFn: async () => {
    const { data, error } = await supabase.from("user_ships").select("sto_ship_id,custom_name,sto_ships(name)").eq("ownership_status","owned").not("character_id","is",null).is("current_build_id",null);
    if(error) throw error;
    return Array.from(new Map((data ?? []).map((row: any) => [row.sto_ship_id, row])).values());
  } });
  const attentionBuilds = useQuery({ queryKey: ["dashboard-attention-builds"], queryFn: async () => { const { data, error } = await supabase.from("builds").select("id,name,status").in("status",["draft","testing"]); if(error) throw error; return data ?? []; } });
  const attentionProjects = useQuery({ queryKey: ["dashboard-attention-projects"], queryFn: async () => { const { data, error } = await supabase.from("sto_projects").select("id,name,status").in("status",["planned","active","in_progress"]); if(error) throw error; return data ?? []; } });
  const attention = { data: { shipsWithoutBuild: attentionShips.data ?? [], draftBuilds: attentionBuilds.data ?? [], activeProjects: attentionProjects.data ?? [], resourcesNearTarget: [] }, isLoading: attentionShips.isLoading || attentionBuilds.isLoading || attentionProjects.isLoading, isError: !!(attentionShips.error || attentionBuilds.error || attentionProjects.error) };


  const readinessShips = useQuery({
    queryKey: ["dashboard-operational-readiness"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ships")
        .select("id,custom_name,character_id,current_build_id,ownership_status,sto_ships(*)")
        .not("current_build_id", "is", null)
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
        !!active,
        !!catalog && slots.length > 0 && slots.every((slot) => assignedSlots.has(slot.toLowerCase())),
        traits.length >= 5,
        !!catalog && expectedStations.length > 0 && expectedStations.every((station) => configuredStations.has(station.toLowerCase())),
      ];
      return { checks, complete: checks.filter(Boolean).length };
    });
    const passed = rows.reduce((sum, row) => sum + row.complete, 0);
    const total = rows.length * 6;
    return {
      shipCount: new Set((readinessShips.data ?? []).map((ship: any) => ship.sto_ship_id).filter(Boolean)).size,
      ready: rows.filter((row) => row.complete === 6).length,
      action: rows.filter((row) => row.complete < 6).length,
      percent: total ? Math.round((passed / total) * 100) : 0,
      scanning: readinessShips.isLoading || readinessLoadouts.isLoading || readinessConfig.isLoading,
      error: !!(readinessShips.error || readinessLoadouts.error || readinessConfig.error),
    };
  }, [readinessShips.data, readinessShips.isLoading, readinessShips.error, readinessLoadouts.data, readinessLoadouts.isLoading, readinessLoadouts.error, readinessConfig.data, readinessConfig.isLoading, readinessConfig.error, activeReadinessLoadouts]);

  const counts: Record<string, number | null> = { characters: characters.data ?? null, ships: ships.data ?? null, builds: builds.data ?? null, planner: plannerShips.data ?? null };

  return <AppShell title="Dashboard" subtitle="Fleet status overview">
    <div className="space-y-6">
      <div><p className="lcars-label">Command overview</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Fleet Operations</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your personal STO command centre. Character ownership stays separate, ships stay assigned to their captains, and builds stay attached to ships.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card => <Link key={card.key} to={card.to} className="panel group p-5 transition hover:border-primary hover:glow-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{card.label}</p><p className="mt-2 font-display text-3xl text-primary">{counts[card.key] ?? "—"}</p></div><card.icon className="size-5 text-accent" /></div><p className="mt-3 text-sm text-muted-foreground">{card.hint}</p></Link>)}</div>
      {(characters.isError || ships.isError || builds.isError || plannerShips.isError) && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-medium text-destructive">Some command data could not be loaded.</p><p className="mt-1 text-muted-foreground">Your existing fleet data is unchanged. Refresh the page or open the affected section directly for more detail.</p></div>}
      <div className="panel p-5">
        <div className="flex items-center justify-between"><div><p className="lcars-label">Command attention</p><h3 className="font-display text-lg text-primary">Build readiness queue</h3></div><Activity className="size-5 text-accent" /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/ships" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Ships without build</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.shipsWithoutBuild.length ?? "—"}</p></Link>
          <Link to="/builds" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Builds needing work</p><p className="mt-1 font-display text-2xl text-primary">{attention.data?.draftBuilds.length ?? "—"}</p></Link>
          <Link to="/ship-planner" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Ships awaiting build</p><p className="mt-1 font-display text-2xl text-primary">{plannerShips.data ?? "—"}</p></Link>
          <Link to="/ship-planner" className="rounded border border-border p-3 hover:border-primary"><p className="text-xs text-muted-foreground">Planner queue</p><p className="mt-1 font-display text-2xl text-primary">{plannerShips.data ?? "—"}</p></Link>
        </div>
      </div>
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="lcars-label">Operational readiness</p><h3 className="font-display text-lg text-primary">Six-point fleet scan</h3><p className="text-xs text-muted-foreground">Captain · build · active loadout · equipment · traits · bridge crew</p></div>
          <Link to="/ships" className="text-xs text-accent">Open fleet command <ChevronRight className="inline size-3"/></Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Fleet ships</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.shipCount}</p><p className="text-[10px] text-muted-foreground">owned vessels</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Fully ready</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.ready}</p><p className="text-[10px] text-muted-foreground">6/6 checks</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Action required</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : operational.action}</p><p className="text-[10px] text-muted-foreground">one or more checks missing</p></div>
          <div className="rounded border border-border p-3"><p className="lcars-label text-[10px]">Build readiness</p><p className="font-display text-2xl text-primary">{operational.scanning || operational.error ? "—" : `${operational.percent}%`}</p><p className="text-[10px] text-muted-foreground">{operational.error ? "scan unavailable" : operational.scanning ? "scanning…" : "operational checks passed"}</p></div>
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
            const characterRows = (characterList.data ?? []).map((character: any) => {
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
                        <p className="text-[10px] text-muted-foreground">6/6 ready</p>
                      </div>
                    </div>
                  </Link>
                ))
              : <p className="text-sm text-muted-foreground">No captains registered yet.</p>;
          })()}
        </div>
      </div>
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="lcars-label">Build pipeline</p><h3 className="font-display text-lg text-primary">Ships awaiting configuration</h3><p className="text-xs text-muted-foreground">Owned ships stay separate from builds until you explicitly create one.</p></div>
          <Link to="/ship-planner" className="text-xs text-accent">Open Ship Planner <ChevronRight className="inline size-3" /></Link>
        </div>
        <div className="mt-4 rounded border border-border bg-muted/10 p-4">
          <p className="font-display text-2xl text-primary">{plannerShips.data ?? "—"}</p>
          <p className="text-xs text-muted-foreground">owned ships currently waiting for a build</p>
        </div>
      </div>
      <div className="panel p-5"><p className="lcars-label">System architecture</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded border border-border p-3"><b>Characters</b><p className="text-muted-foreground">Owners of ships and gear.</p></div><div className="rounded border border-border p-3"><b>Ships</b><p className="text-muted-foreground">Your owned instances linked to the STO catalogue.</p></div><div className="rounded border border-border p-3"><b>Builds</b><p className="text-muted-foreground">Saved configurations ready for loadouts.</p></div></div></div>
    </div>
  </AppShell>;
}
