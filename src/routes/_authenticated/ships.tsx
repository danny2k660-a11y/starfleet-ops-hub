import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Rocket, ClipboardCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StoShip = Tables<"sto_ships">;
type Character = Tables<"characters">;
type Build = Tables<"builds">;
type UserShip = Tables<"user_ships"> & { sto_ships: StoShip | null; characters: Character | null; builds: Build | null };

const THEME_PRESETS = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Terran Empire" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Romulan" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Hur'q" },
  { id: "10000000-0000-4000-8000-000000000004", name: "Discovery-era Terran" },
  { id: "10000000-0000-4000-8000-000000000005", name: "Canon / Screen Accurate" },
];
function themeName(id: string | null | undefined) { return THEME_PRESETS.find((x) => x.id === id)?.name ?? "No theme assigned"; }

const NOT_POPULATED = "Ship data not yet populated";
const ALL = "__all__";
const NONE = "__none__";

export const Route = createFileRoute("/_authenticated/ships")({
  head: () => ({
    meta: [
      { title: "Ships — STO Command Center" },
      { name: "description", content: "Your personally owned ships, linked to the shared STO ship database and assigned to characters." },
      { property: "og:title", content: "Ships — STO Command Center" },
      { property: "og:description", content: "Your personally owned ships, linked to the shared STO ship database and assigned to characters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShipsPage,
});

function useData() {
  const ships = useQuery({
    queryKey: ["user_ships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ships")
        .select("*, sto_ships(*), characters(*), builds(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as UserShip[];
    },
  });
  const catalog = useQuery({
    queryKey: ["sto_ships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ships").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const characters = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const builds = useQuery({
    queryKey: ["builds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("builds").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  return { ships, catalog, characters, builds };
}

function tierLabel(s: UserShip) {
  if (s.t6x2_upgraded) return "T6-X2";
  if (s.t6x_upgraded) return "T6-X";
  if (s.t6_upgraded) return "T6 upgraded";
  return null;
}

function ShipsPage() {
  const { ships, catalog, characters, builds } = useData();
  const buildIds = useMemo(
    () => (ships.data ?? []).map((s) => s.current_build_id).filter(Boolean) as string[],
    [ships.data],
  );
  const fleetLoadouts = useQuery({
    queryKey: ["fleet_command_loadouts", buildIds],
    enabled: buildIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loadouts")
        .select("id,build_id,name,is_active,updated_at")
        .in("build_id", buildIds);
      if (error) throw error;
      return data ?? [];
    },
  });
  const activeLoadoutByBuild = useMemo(() => {
    const map = new Map<string, any>();
    for (const loadout of fleetLoadouts.data ?? []) {
      if (loadout.is_active) map.set(loadout.build_id, loadout);
    }
    return map;
  }, [fleetLoadouts.data]);
  const activeLoadoutIds = useMemo(
    () => Array.from(activeLoadoutByBuild.values()).map((l: any) => l.id),
    [activeLoadoutByBuild],
  );
  const fleetLoadoutConfig = useQuery({
    queryKey: ["fleet_loadout_config", activeLoadoutIds],
    enabled: activeLoadoutIds.length > 0,
    queryFn: async () => {
      const [equipment, traits, boffs] = await Promise.all([
        supabase.from("loadout_equipment").select("loadout_id,id,slot,quantity").in("loadout_id", activeLoadoutIds),
        supabase.from("loadout_traits").select("loadout_id,id,trait_type,slot").in("loadout_id", activeLoadoutIds),
        supabase.from("loadout_boffs").select("loadout_id,id,station,officer_name,specialization").in("loadout_id", activeLoadoutIds),
      ]);
      if (equipment.error) throw equipment.error;
      if (traits.error) throw traits.error;
      if (boffs.error) throw boffs.error;
      return { equipment: equipment.data ?? [], traits: traits.data ?? [], boffs: boffs.data ?? [] };
    },
  });
  const loadoutCoverageById = useMemo(() => {
    const map = new Map<string, {
      equipment: number;
      expectedEquipment: number;
      traits: number;
      boffs: number;
      expectedBoffs: number;
    }>();
    for (const id of activeLoadoutIds) {
      const loadout = Array.from(activeLoadoutByBuild.values()).find((entry: any) => entry.id === id);
      const ship = (ships.data ?? []).find((entry) => entry.current_build_id === loadout?.build_id);
      const catalog = ship?.sto_ships as any;
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
      const assignedSlots = new Set(
        (fleetLoadoutConfig.data?.equipment ?? [])
          .filter((x: any) => x.loadout_id === id)
          .map((x: any) => String(x.slot ?? "").trim().toLowerCase())
          .filter(Boolean),
      );
      const filledEquipment = slots.filter((slot) => assignedSlots.has(slot.toLowerCase())).length;
      const rawStations = catalog?.bridge_officer_stations as unknown;
      const expectedStations = Array.isArray(rawStations)
        ? rawStations.map((entry: any) => typeof entry === "string" ? entry : entry?.station ?? entry?.name).filter(Boolean).map(String)
        : rawStations && typeof rawStations === "object"
          ? Object.keys(rawStations)
          : [];
      const configuredStations = new Set(
        (fleetLoadoutConfig.data?.boffs ?? [])
          .filter((x: any) => x.loadout_id === id)
          .map((x: any) => String(x.station ?? "").trim().toLowerCase())
          .filter(Boolean),
      );
      const filledBoffs = expectedStations.filter((station) => configuredStations.has(station.toLowerCase())).length;
      map.set(id, {
        equipment: filledEquipment,
        expectedEquipment: slots.length,
        traits: (fleetLoadoutConfig.data?.traits ?? []).filter((x: any) => x.loadout_id === id).length,
        boffs: filledBoffs,
        expectedBoffs: expectedStations.length,
      });
    }
    return map;
  }, [activeLoadoutIds, activeLoadoutByBuild, fleetLoadoutConfig.data, ships.data]);
  const [q, setQ] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<"all" | "ready" | "needs_setup" | "captain" | "build" | "theme" | "loadout" | "equipment" | "traits" | "boffs">("all");
  const [charFilter, setCharFilter] = useState(ALL);
  const [factionFilter, setFactionFilter] = useState(ALL);
  const [themeFilter, setThemeFilter] = useState(ALL);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const readinessDataPending = ships.isLoading || catalog.isLoading || fleetLoadouts.isLoading || fleetLoadoutConfig.isLoading;
  const readinessDataError = ships.error || catalog.error || fleetLoadouts.error || fleetLoadoutConfig.error;

  const fleetReadiness = useMemo(() => {
    const owned = (ships.data ?? []).filter((s) => s.ownership_status === "owned");
    const rows = owned.map((s) => {
      const active = s.current_build_id ? activeLoadoutByBuild.get(s.current_build_id) : undefined;
      const coverage = active ? loadoutCoverageById.get(active.id) : undefined;
      const checks = [
        !!s.character_id,
        !!s.current_build_id,
        !!s.theme_id,
        !!active,
        !!coverage && (coverage.expectedEquipment === 0 || coverage.equipment === coverage.expectedEquipment),
        !!coverage?.traits,
        !!coverage && (coverage.expectedBoffs === 0 || coverage.boffs === coverage.expectedBoffs),
      ];
      const complete = checks.filter(Boolean).length;
      return { ship: s, checks, complete, percent: Math.round((complete / 7) * 100) };
    });
    const totalChecks = rows.length * 7;
    const passedChecks = rows.reduce((sum, row) => sum + row.complete, 0);
    return {
      rows,
      shipCount: rows.length,
      fullyReady: readinessDataPending || readinessDataError ? 0 : rows.filter((row) => row.complete === 7).length,
      averagePercent: readinessDataPending || readinessDataError ? 0 : (totalChecks ? Math.round((passedChecks / totalChecks) * 100) : 0),
      state: readinessDataError ? "error" : readinessDataPending ? "scanning" : "ready",
    };
  }, [ships.data, activeLoadoutByBuild, loadoutCoverageById]);
  const readinessBreakdown = useMemo(() => {
    const labels = ["Captain", "Build", "Theme", "Active loadout", "Equipment", "Traits", "Bridge crew"];
    return labels.map((label, index) => {
      const passed = fleetReadiness.rows.filter((row) => row.checks[index]).length;
      const total = fleetReadiness.shipCount;
      return {
        label,
        passed,
        total,
        missing: total - passed,
        state: fleetReadiness.state,
      };
    });
  }, [fleetReadiness]);

  const readinessFilterLabel = useMemo(() => {
    const labels: Record<string, string> = {
      ready: "Fully ready",
      needs_setup: "Needs action",
      captain: "Missing captain",
      build: "Missing build",
      theme: "Missing theme",
      loadout: "Missing active loadout",
      equipment: "Missing equipment",
      traits: "Missing traits",
      boffs: "Missing bridge crew",
    };
    return labels[readinessFilter] ?? "All ships";
  }, [readinessFilter]);
  const factions = useMemo(
    () => Array.from(new Set((catalog.data ?? []).map((s) => s.faction).filter(Boolean))) as string[],
    [catalog.data],
  );

  const filtered = (ships.data ?? []).filter((s) => {
    const text = `${s.custom_name} ${s.sto_ships?.name ?? ""} ${s.sto_ships?.ship_class ?? ""}`.toLowerCase();
    const readinessRow = fleetReadiness.rows.find((row) => row.ship.id === s.id);
    const readinessMatch =
      readinessDataPending || readinessDataError
        ? true
        : readinessFilter === "ready"
          ? readinessRow?.complete === 7
          : readinessFilter === "needs_setup"
            ? !!readinessRow && readinessRow.complete < 7
            : readinessFilter === "captain"
              ? !!readinessRow && !readinessRow.checks[0]
              : readinessFilter === "build"
                ? !!readinessRow && !readinessRow.checks[1]
                : readinessFilter === "theme"
                  ? !!readinessRow && !readinessRow.checks[2]
                  : readinessFilter === "loadout"
                    ? !!readinessRow && !readinessRow.checks[3]
                    : readinessFilter === "equipment"
                      ? !!readinessRow && !readinessRow.checks[4]
                      : readinessFilter === "traits"
                        ? !!readinessRow && !readinessRow.checks[5]
                        : readinessFilter === "boffs"
                          ? !!readinessRow && !readinessRow.checks[6]
                          : true;
    if (!readinessMatch) return false;
    if (q && !q.startsWith("__") && !text.includes(q.toLowerCase())) return false;
    if (charFilter !== ALL && s.character_id !== charFilter) return false;
    if (factionFilter !== ALL && s.sto_ships?.faction !== factionFilter) return false;
    if (themeFilter !== ALL && s.theme_id !== themeFilter) return false;
    return true;
  });

  const selected = ships.data?.find((s) => s.id === selectedId) ?? null;
  const ownedCount = (ships.data ?? []).filter((s) => s.ownership_status === "owned").length;
  const wishlistCount = (ships.data ?? []).filter((s) => s.ownership_status === "wishlist").length;
  const readyCount = (ships.data ?? []).filter((s) => !!s.current_build_id && s.ownership_status === "owned").length;
  const [fleetConfigOpen, setFleetConfigOpen] = useState(false);
  const unassignedCount = (ships.data ?? []).filter((s) => s.ownership_status === "owned" && !s.current_build_id).length;
  const themeCounts = THEME_PRESETS.map((theme) => ({ ...theme, count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.theme_id === theme.id).length }));
  const themedOwnedCount = (ships.data ?? []).filter((s) => s.ownership_status === "owned" && !!s.theme_id).length;

  return (
    <AppShell title="Ships" subtitle="Your STO fleet registry">
      <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lcars-label">Fleet registry</p>
          <h1 className="font-display text-2xl tracking-wide text-primary sm:text-3xl">Ships</h1>
        </div>
        <Button onClick={() => setAdding(true)} className="glow-primary">
          <Plus className="mr-1 h-4 w-4" /> Add ship
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="panel p-3"><p className="lcars-label">Fleet</p><p className="font-display text-xl text-primary">{ownedCount}</p><p className="text-xs text-muted-foreground">owned</p></div>
        <div className="panel p-3"><p className="lcars-label">Wishlist</p><p className="font-display text-xl text-primary">{wishlistCount}</p><p className="text-xs text-muted-foreground">planned</p></div>
        <div className="panel p-3"><p className="lcars-label">Ready pipeline</p><p className="font-display text-xl text-primary">{readyCount}</p><p className="text-xs text-muted-foreground">build linked</p></div>
        <div className="panel p-3"><p className="lcars-label">Catalog</p><p className="font-display text-xl text-primary">{catalog.data?.length ?? 0}</p><p className="text-xs text-muted-foreground">ships indexed</p></div>
        <div className="col-span-2 panel p-3 sm:col-span-4"><p className="lcars-label">Command attention</p><p className="text-sm text-muted-foreground">{unassignedCount ? `${unassignedCount} owned ship${unassignedCount === 1 ? "" : "s"} still need a build assignment.` : "All owned ships currently have a build linked."}</p></div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Fleet command readiness</p>
            <p className="text-sm text-muted-foreground">A fleetwide operational snapshot based on captain, build and theme assignment.</p>
          </div>
          <Badge variant="outline">{fleetReadiness.averagePercent}% operational readiness</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Fully ready", count: fleetReadiness.fullyReady, note: "7/7 operational checks" },
            { label: "Build assigned", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.current_build_id).length, note: "build linked" },
            { label: "Active loadout", count: fleetReadiness.rows.filter((row) => row.checks[3]).length, note: "deployment loadout" },
            { label: "Needs action", count: fleetReadiness.rows.filter((row) => row.complete < 7).length, note: "one or more checks missing" },
          ].map((item) => (
            <button key={item.label} onClick={() => {
              setReadinessFilter(
                item.label === "Command-ready" ? "ready" : "needs_setup",
              );
              setQ("");
              setCharFilter(ALL);
              setThemeFilter(ALL);
              setFactionFilter(ALL);
            }} className="rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary">
              <p className="lcars-label text-[10px]">{item.label}</p>
              <p className="font-display text-2xl text-primary">{item.count}</p>
              <p className="text-[10px] text-muted-foreground">{item.note}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${fleetReadiness.averagePercent}%` }} />
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Readiness diagnostics</p>
            <p className="text-sm text-muted-foreground">
              {fleetReadiness.state === "scanning"
                ? "Checking live loadout configuration before calculating readiness."
                : fleetReadiness.state === "error"
                  ? "Live readiness data could not be loaded. Fleet entries are left unfiltered rather than marked incomplete."
                  : "Fleetwide view of where operational configuration is complete or still needs attention."}
            </p>
          </div>
          <Badge variant="outline">
            {fleetReadiness.state === "scanning" ? "Scanning fleet…" : fleetReadiness.state === "error" ? "Readiness data unavailable" : `${fleetReadiness.fullyReady} fully ready`}
          </Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {readinessBreakdown.map((item) => {
            const percent = item.total ? Math.round((item.passed / item.total) * 100) : 0;
            const filterMap: Record<string, typeof readinessFilter> = {
              Captain: "captain",
              Build: "build",
              Theme: "theme",
              "Active loadout": "loadout",
              Equipment: "equipment",
              Traits: "traits",
              "Bridge crew": "boffs",
            };
            const activeFilter = filterMap[item.label];
            return (
              <button
                key={item.label}
                type="button"
                disabled={item.state !== "ready"}
                onClick={() => {
                  if (item.state !== "ready") return;
                  setReadinessFilter(activeFilter);
                  setQ("");
                }}
                className="rounded border border-border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="lcars-label text-[10px]">{item.label}</p>
                  <span className="text-xs text-muted-foreground">
                    {item.state === "scanning" ? "Scanning…" : item.state === "error" ? "Unavailable" : `${item.passed}/${item.total}`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted">
                  {item.state === "ready" && <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {item.state === "scanning"
                    ? "Waiting for configuration scan"
                    : item.state === "error"
                      ? "Cannot determine readiness"
                      : `${item.missing} ship${item.missing === 1 ? "" : "s"} need${item.missing === 1 ? "s" : ""} this`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Full operational readiness</p>
            <p className="text-sm text-muted-foreground">Extends the fleet view from assignment state into active loadout configuration.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setFleetConfigOpen((v) => !v)}>
            {fleetConfigOpen ? "Hide detail" : "Show detail"}
          </Button>
        </div>
        {fleetConfigOpen && (
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {[
              { label: "Captain", note: "Character assigned" },
              { label: "Build", note: "Current build linked" },
              { label: "Theme", note: "Theme identity assigned" },
              { label: "Loadout", note: "Active loadout configured" },
            ].map((item) => (
              <div key={item.label} className="rounded border border-border bg-muted/20 p-3">
                <p className="lcars-label text-[10px]">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
            <div className="sm:col-span-4 rounded border border-primary/20 bg-primary/5 p-3">
              <p className="lcars-label text-[10px]">Active loadout coverage</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fleetLoadouts.isLoading || fleetLoadoutConfig.isLoading
                  ? "Scanning linked builds and active loadout configuration…"
                  : `${activeLoadoutByBuild.size} of ${buildIds.length} linked builds have an active loadout; equipment, traits and BOFF configuration are now included.`}
              </p>
            </div>
            <div className="sm:col-span-4 space-y-2">
              {(ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.current_build_id).slice(0, 12).map((s) => {
                const active = activeLoadoutByBuild.get(s.current_build_id!);
                const coverage = active ? loadoutCoverageById.get(active.id) : undefined;
                const configured = coverage ? Number(coverage.equipment > 0) + Number(coverage.traits > 0) + Number(coverage.boffs > 0) : 0;
                const ready = !!active && configured === 3;
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} className="flex w-full items-center justify-between gap-3 rounded border border-border bg-muted/20 p-2.5 text-left transition hover:border-primary">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{s.custom_name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {s.sto_ships?.name ?? "Unknown ship"} · {coverage ? `${coverage.equipment} equipment / ${coverage.traits} traits / ${coverage.boffs} BOFFs` : "No active loadout"}
                      </p>
                    </div>
                    <Badge variant={ready ? "default" : "outline"}>{ready ? "CONFIGURED" : active ? `${configured}/3 CONFIGURED` : "LOADOUT REQUIRED"}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">7-point operational readiness</p>
            <p className="text-sm text-muted-foreground">Character, build, theme, active loadout, equipment, traits and bridge crew.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="lcars-label text-[10px]">Fleet average</p>
              <p className="text-xl font-semibold text-primary">{fleetReadiness.averagePercent}%</p>
            </div>
            <Badge>{fleetReadiness.fullyReady}/{fleetReadiness.shipCount} fully ready</Badge>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${fleetReadiness.averagePercent}%` }} />
        </div>
        <div className="mt-4 space-y-2">
          {fleetReadiness.rows.slice(0, 12).map(({ ship, complete, percent }) => (
            <button key={ship.id} onClick={() => setSelectedId(ship.id)} className="flex w-full items-center justify-between gap-3 rounded border border-border bg-muted/20 p-2.5 text-left transition hover:border-primary">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-primary">{ship.custom_name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{ship.sto_ships?.name ?? "Unknown ship"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{complete}/7</span>
                <Badge variant={complete === 7 ? "default" : "outline"}>{percent}%</Badge>
              </div>
            </button>
          ))}
        </div>
        {fleetReadiness.shipCount > 12 && (
          <p className="mt-3 text-xs text-muted-foreground">Showing 12 of {fleetReadiness.shipCount} owned ships.</p>
        )}
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Fleet readiness matrix</p>
            <p className="text-sm text-muted-foreground">Every owned ship is measured against the same seven-point operational checklist.</p>
          </div>
          <Badge variant="outline">{fleetReadiness.fullyReady}/{ownedCount} fully ready</Badge>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "7/7 ready", count: fleetReadiness.fullyReady, note: "all operational checks passed" },
            { label: "Action required", count: fleetReadiness.rows.filter((row) => row.complete < 7).length, note: "one or more checks missing" },
            { label: "Registry only", count: (ships.data ?? []).filter((s) => s.ownership_status !== "owned").length, note: "wishlist / planned" },
          ].map((item) => (
            <div key={item.label} className="rounded border border-border bg-muted/20 p-3">
              <p className="lcars-label text-[10px]">{item.label}</p>
              <p className="font-display text-2xl text-primary">{item.count}</p>
              <p className="text-[10px] text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {fleetReadiness.rows.slice(0, 12).map((row) => {
            const s = row.ship;
            const complete = row.complete;
            const percent = row.percent;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} className="flex w-full items-center gap-3 rounded border border-border bg-muted/20 p-2.5 text-left transition hover:border-primary">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{s.custom_name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{s.sto_ships?.name ?? "Unknown ship"}</p>
                </div>
                <div className="w-28 shrink-0">
                  <div className="h-1.5 overflow-hidden rounded bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(complete / checks.length) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{complete}/{checks.length} core</p>
                </div>
              </button>
            );
          })}
          {ownedCount > 12 && <p className="text-center text-[10px] text-muted-foreground">Showing 12 of {ownedCount} owned ships.</p>}
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Priority deployment queue</p>
            <p className="text-sm text-muted-foreground">Ships are ordered by the next missing command requirement.</p>
          </div>
          <Badge variant="outline">{(ships.data ?? []).filter((s) => s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id)).length} requiring action</Badge>
        </div>
        <div className="mt-3 space-y-2">
          {fleetReadiness.rows
            .filter((row) => row.complete < 7)
            .slice()
            .sort((a, b) => a.complete - b.complete)
            .slice(0, 5)
            .map(({ ship: s, checks, complete, percent }) => {
              const missing = !checks[0] ? "Captain" : !checks[1] ? "Build" : !checks[2] ? "Theme" : !checks[3] ? "Active loadout" : !checks[4] ? "Equipment" : !checks[5] ? "Traits" : "Bridge crew";
              return (
                <button key={s.id} onClick={() => setSelectedId(s.id)} className="flex w-full items-center justify-between gap-3 rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-primary">{s.custom_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.sto_ships?.name ?? "Unknown ship"} · {s.characters?.name ?? "No captain"}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">{missing} required</Badge>
                </button>
              );
            })}
          {fleetReadiness.rows.filter((row) => row.complete < 7).length === 0 && (
            <p className="text-sm text-muted-foreground">All owned ships currently pass the seven-point operational readiness check.</p>
          )}
        </div>
      </div>

      {unassignedCount > 0 && (
        <div className="panel border-primary/30 p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="lcars-label">Fleet readiness queue</p>
              <p className="text-sm text-muted-foreground">Ships below are owned but have no active build link. Open one to assign its build.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(ships.data ?? []).filter((s) => s.ownership_status === "owned" && !s.current_build_id).slice(0, 6).map((s) => (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} className="rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary">
                    <p className="font-medium text-primary">{s.custom_name}</p>
                    <p className="text-xs text-muted-foreground">{s.sto_ships?.name ?? "Unknown ship"} · {s.characters?.name ?? "No character"}</p>
                    <span className="mt-2 inline-block text-xs text-primary">Assign build →</span>
                  </button>
                ))}
              </div>
              {unassignedCount > 6 && <p className="mt-2 text-xs text-muted-foreground">Showing 6 of {unassignedCount} ships needing attention.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Command action queue</p>
            <p className="text-sm text-muted-foreground">Open the ships that need the next command step.</p>
          </div>
          <Badge variant="outline">{fleetReadiness.rows.filter((row) => row.complete < 7).length} open</Badge>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Assign captain", action: "captain" as const, count: fleetReadiness.rows.filter((row) => !row.checks[0]).length, note: "character assignment" },
            { label: "Assign build", action: "build" as const, count: fleetReadiness.rows.filter((row) => !row.checks[1]).length, note: "current build link" },
            { label: "Assign theme", action: "theme" as const, count: fleetReadiness.rows.filter((row) => !row.checks[2]).length, note: "theme identity" },
            { label: "Activate loadout", action: "loadout" as const, count: fleetReadiness.rows.filter((row) => !row.checks[3]).length, note: "active deployment loadout" },
            { label: "Fit equipment", action: "equipment" as const, count: fleetReadiness.rows.filter((row) => !row.checks[4]).length, note: "expected fitting slots" },
            { label: "Configure traits", action: "traits" as const, count: fleetReadiness.rows.filter((row) => !row.checks[5]).length, note: "loadout traits" },
            { label: "Assign bridge crew", action: "boffs" as const, count: fleetReadiness.rows.filter((row) => !row.checks[6]).length, note: "expected bridge stations" },
          ].map((item) => (
            <button
              key={item.action}
              disabled={fleetReadiness.state !== "ready" || item.count === 0}
              onClick={() => {
                if (fleetReadiness.state !== "ready" || item.count === 0) return;
                setReadinessFilter(item.action);
                setQ("");
                setCharFilter(ALL);
                setThemeFilter(ALL);
                setFactionFilter(ALL);
              }}
              className="rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary disabled:cursor-default disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="lcars-label text-[10px]">{item.label}</p>
                <Badge variant="outline">{fleetReadiness.state === "ready" ? item.count : "—"}</Badge>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {fleetReadiness.state === "scanning"
                  ? "Scanning fleet configuration…"
                  : fleetReadiness.state === "error"
                    ? "Readiness data unavailable"
                    : item.count
                      ? item.note
                      : "No ships require this step."}
              </p>
            </button>
          ))}
        </div>      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Character command view</p>
            <p className="text-sm text-muted-foreground">Ships grouped by captain with build-link readiness.</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(characters.data ?? []).map((character) => {
            const fleet = (ships.data ?? []).filter((s) => s.character_id === character.id && s.ownership_status === "owned");
            const ready = fleet.filter((s) => !!s.current_build_id).length;
            const unassigned = fleet.length - ready;
            return (
              <button key={character.id} onClick={() => setCharFilter(character.id)} className="rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-base text-primary">{character.name}</p>
                  <Badge variant="outline">{fleet.length} ship{fleet.length === 1 ? "" : "s"}</Badge>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-muted-foreground">{ready} build-linked</span>
                  {unassigned > 0 ? <span className="text-primary">{unassigned} attention</span> : <span className="text-muted-foreground">ready pipeline clear</span>}
                </div>
              </button>
            );
          })}
          {(characters.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No characters registered yet.</p>}
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="lcars-label">Fleet composition</p>
            <p className="text-sm text-muted-foreground">Theme identity across your owned fleet.</p>
          </div>
          <Badge variant="outline">{themedOwnedCount}/{ownedCount} themed</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {themeCounts.map((theme) => (
            <button key={theme.id} onClick={() => setThemeFilter(themeFilter === theme.id ? ALL : theme.id)} className={`rounded border p-2 text-left transition hover:border-primary ${themeFilter === theme.id ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}>
              <p className="truncate text-xs text-muted-foreground">{theme.name}</p>
              <p className="font-display text-lg text-primary">{theme.count}</p>
              <p className="text-[10px] text-muted-foreground">owned ships</p>
            </button>
          ))}
        </div>
      </div>

      <div className="panel grid gap-3 p-4 sm:grid-cols-3">
        <div className="col-span-full flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <p className="lcars-label">Command filters</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">{filtered.length} matching ship{filtered.length === 1 ? "" : "s"} · {readyCount} build-linked fleetwide</p>
              {readinessFilter !== "all" && <Badge variant="outline">Readiness: {readinessFilterLabel}</Badge>}
            </div>
          </div>
          {(charFilter !== ALL || themeFilter !== ALL || factionFilter !== ALL || q || readinessFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={() => { setQ(""); setReadinessFilter("all"); setCharFilter(ALL); setThemeFilter(ALL); setFactionFilter(ALL); }}>
              Clear filters
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search your ships…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={charFilter} onValueChange={setCharFilter}>
          <SelectTrigger><SelectValue placeholder="Character" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All characters</SelectItem>
            {(characters.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={themeFilter} onValueChange={setThemeFilter}>
          <SelectTrigger><SelectValue placeholder="Theme" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All themes</SelectItem>
            {THEME_PRESETS.map((theme) => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={factionFilter} onValueChange={setFactionFilter}>
          <SelectTrigger><SelectValue placeholder="Faction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All factions</SelectItem>
            {factions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {ships.isError ? (
        <div className="panel p-6 text-center text-destructive">Unable to load the fleet registry. Refresh and try again.</div>
      ) : ships.isLoading ? (
        <p className="text-muted-foreground">Scanning fleet…</p>
      ) : filtered.length === 0 ? (
        <div className="panel p-8 text-center text-muted-foreground">
          <Rocket className="mx-auto mb-2 h-8 w-8 text-primary" />
          {ships.data?.length ? "No ships match your filters." : "No ships yet. Use Add ship to register your first vessel."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => setSelectedId(s.id)} className="panel p-4 text-left transition hover:border-primary">
              <p className="lcars-label">{s.sto_ships?.name ?? "Unknown ship"}</p>
              <h3 className="font-display text-lg text-primary">{s.custom_name}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{s.characters?.name ?? "No character"}</Badge>
                {s.sto_ships?.faction && <Badge variant="outline">{s.sto_ships.faction}</Badge>}
                {tierLabel(s) && <Badge className="bg-accent text-accent-foreground">{tierLabel(s)}</Badge>}
                <Badge variant="secondary">{s.ownership_status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded border border-border bg-muted/20 p-2">
                  <span className="text-muted-foreground">Build</span>
                  <p className={s.builds ? "text-primary" : "text-muted-foreground"}>{s.builds?.name ?? "Unassigned"}</p>
                </div>
                <div className="rounded border border-border bg-muted/20 p-2">
                  <span className="text-muted-foreground">Theme</span>
                  <p className={s.theme_id ? "text-primary" : "text-muted-foreground"}>{themeName(s.theme_id).replace("No theme assigned", "None")}</p>
                </div>
                <div className="rounded border border-border bg-muted/20 p-2">
                  <span className="text-muted-foreground">Readiness</span>
                  <p className={s.current_build_id ? "text-primary" : "text-muted-foreground"}>{s.current_build_id ? "Build linked" : "Needs build"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AddShipDialog
        open={adding}
        onOpenChange={setAdding}
        catalog={catalog.data ?? []}
        characters={characters.data ?? []}
        onSaved={(id) => { setAdding(false); setSelectedId(id); }}
      />
      {selected && (
        <ShipDetailDialog ship={selected} characters={characters.data ?? []} builds={builds.data ?? []} onClose={() => setSelectedId(null)} />
      )}
      </div>
    </AppShell>
  );
}

function UpgradeChecks({ t6, t6x, t6x2, set }: { t6: boolean; t6x: boolean; t6x2: boolean; set: (v: { t6: boolean; t6x: boolean; t6x2: boolean }) => void }) {
  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={t6} onCheckedChange={(v) => set({ t6: !!v, t6x: v ? t6x : false, t6x2: v ? t6x2 : false })} /> T6 upgrade</label>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={t6x} onCheckedChange={(v) => set({ t6: v ? true : t6, t6x: !!v, t6x2: v ? t6x2 : false })} /> T6-X</label>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={t6x2} onCheckedChange={(v) => set({ t6: v ? true : t6, t6x: v ? true : t6x, t6x2: !!v })} /> T6-X2</label>
    </div>
  );
}

function AddShipDialog({ open, onOpenChange, catalog, characters, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; catalog: StoShip[]; characters: Character[]; onSaved: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [shipId, setShipId] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState("");
  const [newChar, setNewChar] = useState("");
  const [name, setName] = useState("");
  const [up, setUp] = useState({ t6: false, t6x: false, t6x2: false });

  const results = catalog.filter((s) => `${s.name} ${s.ship_class ?? ""} ${s.faction ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const createChar = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("characters").insert({ name: newChar.trim(), user_id: u.user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (c) => { qc.invalidateQueries({ queryKey: ["characters"] }); setCharacterId(c.id); setNewChar(""); toast.success("Character created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("user_ships").insert({
        user_id: u.user!.id, character_id: characterId, sto_ship_id: shipId!, custom_name: name.trim(),
        t6_upgraded: up.t6, t6x_upgraded: up.t6x, t6x2_upgraded: up.t6x2,
      }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["user_ships"] });
      toast.success("Ship registered");
      setSearch(""); setShipId(null); setName(""); setUp({ t6: false, t6x: false, t6x2: false });
      onSaved(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = !!shipId && !!characterId && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-primary">Add ship</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>1. Search the STO ship database</Label>
            <Input placeholder="Ship name, class or faction" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-44 space-y-1 overflow-y-auto rounded border border-border p-1">
              {results.length === 0 && <p className="p-2 text-sm text-muted-foreground">No matching ships in the database.</p>}
              {results.map((s) => (
                <button key={s.id} type="button" onClick={() => setShipId(s.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm ${shipId === s.id ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{[s.ship_class, s.faction, s.tier].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>2. Character that owns this ship</Label>
            {characters.length > 0 && (
              <Select value={characterId} onValueChange={setCharacterId}>
                <SelectTrigger><SelectValue placeholder="Select character" /></SelectTrigger>
                <SelectContent>{characters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Input placeholder={characters.length ? "Or create a new character" : "Create your first character"} value={newChar} onChange={(e) => setNewChar(e.target.value)} />
              <Button type="button" variant="outline" disabled={!newChar.trim() || createChar.isPending} onClick={() => createChar.mutate()}>Create</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>3. Custom ship name</Label>
            <Input placeholder="e.g. I.S.S. Predator" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>4. Upgrade status</Label>
            <UpgradeChecks {...up} set={setUp} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!canSave || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save ship"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="rounded border border-border bg-muted/30 p-2">
      <p className="lcars-label text-[10px]">{label}</p>
      <p className={empty ? "text-xs italic text-muted-foreground" : "font-medium"}>{empty ? NOT_POPULATED : value}</p>
    </div>
  );
}

type Boff = { rank?: string; career?: string; specialization?: string };

function BaseStats({ s }: { s: StoShip | null }) {
  if (!s) return <p className="text-sm italic text-muted-foreground">{NOT_POPULATED}</p>;
  const n = (v: number | null) => (v === null ? null : v);
  const weapons = s.fore_weapon_slots !== null && s.aft_weapon_slots !== null ? `${s.fore_weapon_slots} fore / ${s.aft_weapon_slots} aft` : null;
  const consoles = [s.engineering_console_slots, s.science_console_slots, s.tactical_console_slots].every((v) => v !== null)
    ? `Eng ${s.engineering_console_slots} · Sci ${s.science_console_slots} · Tac ${s.tactical_console_slots}${s.universal_console_slots ? ` · Uni ${s.universal_console_slots}` : ""}`
    : null;
  const rawBoffs = s.bridge_officer_stations as unknown;
  const boffs: Boff[] = Array.isArray(rawBoffs)
    ? rawBoffs as Boff[]
    : rawBoffs && typeof rawBoffs === "object"
      ? Object.keys(rawBoffs as Record<string, unknown>).map((seat) => {
          const match = seat.match(/^(.+?)\s+(?:\((.+)\)|\/\s*(.+))$/);
          if (match) {
            return { rank: match[1], career: match[2] ?? match[3] };
          }
          const split = seat.split(/\s*\/\s*/);
          if (split.length > 1) return { rank: split[0], career: split.slice(1).join(" / ") };
          const parts = seat.trim().split(/\s+/);
          if (parts.length >= 2) return { rank: parts.slice(0, 2).join(" "), career: parts.slice(2).join(" ") || undefined };
          return { rank: seat };
        })
      : [];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Hull modifier" value={n(s.hull_modifier)} />
        <Stat label="Shield modifier" value={n(s.shield_modifier)} />
        <Stat label="Turn rate" value={n(s.turn_rate)} />
        <Stat label="Inertia" value={n(s.inertia)} />
        <Stat label="Impulse modifier" value={n(s.impulse_modifier)} />
        <Stat label="Base hull (scaling)" value={n(s.base_hull)} />
        <Stat label="Base shields (scaling)" value={n(s.base_shields)} />
        <Stat label="Weapon layout" value={weapons} />
        <Stat label="Experimental weapon" value={s.experimental_weapon_slot === null ? null : s.experimental_weapon_slot ? "Yes" : "No"} />
        <Stat label="Hangar bays" value={n(s.hangar_bays)} />
        <Stat label="Console layout" value={consoles} />
        <Stat label="Ship trait" value={s.ship_trait} />
        <Stat label="Special console" value={s.special_console} />
        <Stat label="Special weapons" value={s.special_weapons} />
      </div>
      <Stat label="Special mechanics" value={s.special_mechanics} />
      <div className="rounded border border-border bg-muted/30 p-2">
        <p className="lcars-label text-[10px]">Bridge officer seating</p>
        {boffs.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">{NOT_POPULATED}</p>
        ) : (
          <ul className="text-sm">{boffs.map((b, i) => <li key={i}>{[b.rank, b.career, b.specialization && `(${b.specialization})`].filter(Boolean).join(" ")}</li>)}</ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Source: {s.source_reference ?? "—"} · Data version: {s.data_version ?? "—"}</p>
    </div>
  );
}

function ShipDetailDialog({ ship, characters, builds, onClose }: { ship: UserShip; characters: Character[]; builds: Build[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ship.custom_name);
  const [characterId, setCharacterId] = useState(ship.character_id);
  const [buildId, setBuildId] = useState(ship.current_build_id ?? NONE);
  const [status, setStatus] = useState(ship.ownership_status);
  const [acquired, setAcquired] = useState(ship.date_acquired ?? "");
  const [notes, setNotes] = useState(ship.notes ?? "");
  const [themeId, setThemeId] = useState(ship.theme_id ?? "");
  const [up, setUp] = useState({ t6: ship.t6_upgraded, t6x: ship.t6x_upgraded, t6x2: ship.t6x2_upgraded });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_ships").update({
        custom_name: name.trim(), character_id: characterId, current_build_id: buildId === NONE ? null : buildId,
        ownership_status: status, date_acquired: acquired || null, notes: notes || null, theme_id: themeId || null,
        t6_upgraded: up.t6, t6x_upgraded: up.t6x, t6x2_upgraded: up.t6x2,
      }).eq("id", ship.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); setEditing(false); toast.success("Ship updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_ships").delete().eq("id", ship.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); toast.success("Ship removed"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const loadouts = useQuery({ queryKey: ["ship_loadouts", ship.current_build_id], enabled: !!ship.current_build_id, queryFn: async () => { const { data, error } = await supabase.from("loadouts").select("*").eq("build_id", ship.current_build_id!).order("updated_at", { ascending: false }); if (error) throw error; return data ?? []; } });
  const activeLoadout = loadouts.data?.find((l: any) => l.is_active) ?? null;
  const manifest = useQuery({
    queryKey: ["ship_command_manifest", activeLoadout?.id],
    enabled: !!activeLoadout?.id,
    queryFn: async () => {
      const [equipment, traits, boffs] = await Promise.all([
        supabase.from("loadout_equipment").select("id,slot,quantity").eq("loadout_id", activeLoadout!.id),
        supabase.from("loadout_traits").select("id,trait_type,slot").eq("loadout_id", activeLoadout!.id),
        supabase.from("loadout_boffs").select("id,station,officer_name,specialization").eq("loadout_id", activeLoadout!.id),
      ]);
      if (equipment.error) throw equipment.error;
      if (traits.error) throw traits.error;
      if (boffs.error) throw boffs.error;
      return { equipment: equipment.data ?? [], traits: traits.data ?? [], boffs: boffs.data ?? [] };
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <p className="lcars-label">{ship.sto_ships?.name}{ship.sto_ships?.ship_class ? ` · ${ship.sto_ships.ship_class}` : ""}</p>
          <DialogTitle className="font-display text-2xl text-primary">{ship.custom_name}</DialogTitle>
        </DialogHeader>

        {!editing ? (
          <div>
          <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3"><p className="lcars-label">Theme identity</p><p className="font-medium text-primary">{themeName(ship.theme_id)}</p></div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><p className="lcars-label text-[10px]">Character</p>{ship.characters?.name}</div>
            <div><p className="lcars-label text-[10px]">Current build</p>{ship.builds?.name ?? "None"}</div>
            <div><p className="lcars-label text-[10px]">Upgrade</p>{tierLabel(ship) ?? "None"}</div>
            <div><p className="lcars-label text-[10px]">Status</p>{ship.ownership_status}</div>
            {ship.date_acquired && <div><p className="lcars-label text-[10px]">Acquired</p>{ship.date_acquired}</div>}
            {ship.notes && <div className="col-span-full"><p className="lcars-label text-[10px]">Notes</p>{ship.notes}</div>}
          </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Custom name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Character</Label>
              <Select value={characterId} onValueChange={setCharacterId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{characters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Current build</Label>
              <Select value={buildId} onValueChange={setBuildId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {builds.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{b.id === ship.current_build_id ? " • CURRENT" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This saves the selected build as the ship's active build link. Build ownership remains separate from the ship catalogue record.</p>
            </div>
            <div className="space-y-1"><Label>Ownership</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="wishlist">Wishlist</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Date acquired</Label><Input type="date" value={acquired} onChange={(e) => setAcquired(e.target.value)} /></div>
            <div className="space-y-1"><Label>Theme identity</Label>
              <Select value={themeId || NONE} onValueChange={(v) => setThemeId(v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No theme assigned</SelectItem>
                  <SelectItem value="10000000-0000-4000-8000-000000000001">Terran Empire</SelectItem>
                  <SelectItem value="10000000-0000-4000-8000-000000000002">Romulan</SelectItem>
                  <SelectItem value="10000000-0000-4000-8000-000000000003">Hur'q</SelectItem>
                  <SelectItem value="10000000-0000-4000-8000-000000000004">Discovery-era Terran</SelectItem>
                  <SelectItem value="10000000-0000-4000-8000-000000000005">Canon / Screen Accurate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Upgrade status</Label><UpgradeChecks {...up} set={setUp} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
        )}

        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="lcars-label">Operational status</p>
              <p className="text-sm text-muted-foreground">Command readiness for this ship instance.</p>
            </div>
            <Badge className={ship.current_build_id && ship.theme_id ? "bg-accent text-accent-foreground" : "border-primary text-primary"} variant={ship.current_build_id && ship.theme_id ? "default" : "outline"}>
              {ship.current_build_id && ship.theme_id ? "COMMAND READY" : ship.current_build_id ? "THEME REQUIRED" : "BUILD REQUIRED"}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded border border-border bg-background/40 p-2"><p className="lcars-label text-[10px]">Captain</p><p className="text-sm">{ship.characters?.name ?? "Unassigned"}</p></div>
            <div className="rounded border border-border bg-background/40 p-2"><p className="lcars-label text-[10px]">Build</p><p className="text-sm">{ship.builds?.name ?? "Unassigned"}</p></div>
            <div className="rounded border border-border bg-background/40 p-2"><p className="lcars-label text-[10px]">Theme</p><p className="text-sm">{themeName(ship.theme_id).replace("No theme assigned", "Unassigned")}</p></div>
            <div className="rounded border border-border bg-background/40 p-2"><p className="lcars-label text-[10px]">Loadouts</p><p className="text-sm">{loadouts.data?.length ?? 0} configured</p></div>
          </div>
          {ship.current_build_id && !loadouts.isLoading && !loadouts.data?.some((l: any) => l.is_active) && (
            <p className="mt-2 text-xs text-primary">Build linked, but no active loadout is marked for this ship.</p>
          )}
        </div>

        <div className="mt-4">
          <p className="lcars-label mb-2">Verified ship specifications</p>
          <p className="mb-2 text-xs text-muted-foreground">Catalogue values are shown only when populated from a recorded source; unverified scaling base values are intentionally left blank.</p>
          <BaseStats s={ship.sto_ships} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-border bg-muted/20 p-3">
            <p className="lcars-label">Identity</p>
            <p className="mt-1 text-sm text-primary">{ship.sto_ships?.name ?? "Unknown class"}</p>
            <p className="text-xs text-muted-foreground">{ship.sto_ships?.faction ?? "Faction unlisted"} · {ship.sto_ships?.ship_class ?? "Class unlisted"}</p>
          </div>
          <div className="rounded border border-border bg-muted/20 p-3">
            <p className="lcars-label">Upgrade state</p>
            <p className="mt-1 text-sm text-primary">{tierLabel(ship) ?? "Standard"}</p>
            <p className="text-xs text-muted-foreground">{ship.t6x2_upgraded ? "T6-X2 systems active" : ship.t6x_upgraded ? "T6-X systems active" : ship.t6_upgraded ? "T6 upgrade applied" : "No upgrade recorded"}</p>
          </div>
          <div className="rounded border border-border bg-muted/20 p-3">
            <p className="lcars-label">Registry state</p>
            <p className="mt-1 text-sm text-primary">{ship.ownership_status}</p>
            <p className="text-xs text-muted-foreground">{ship.date_acquired ? "Acquired " + ship.date_acquired : "Acquisition date not recorded"}</p>
          </div>
        </div>

        <div className="mt-4 rounded border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="lcars-label">Command checklist</p>
              <p className="text-xs text-muted-foreground">Core assignments required before this ship is considered operational.</p>
            </div>
            <Badge variant="outline">{[
              !!ship.character_id, !!ship.current_build_id, !!ship.theme_id, !!activeLoadout,
              (manifest.data?.equipment.length ?? 0) > 0,
              (manifest.data?.traits.length ?? 0) > 0,
              (manifest.data?.boffs.length ?? 0) > 0,
            ].filter(Boolean).length}/7 complete</Badge>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["Captain assigned", !!ship.character_id],
              ["Build linked", !!ship.current_build_id],
              ["Theme assigned", !!ship.theme_id],
              ["Active loadout", !!activeLoadout],
              ["Equipment fitted", (manifest.data?.equipment.length ?? 0) > 0],
              ["Traits configured", (manifest.data?.traits.length ?? 0) > 0],
              ["Bridge crew configured", (manifest.data?.boffs.length ?? 0) > 0],
            ].map(([label, done]) => (
              <div key={String(label)} className="flex items-center justify-between rounded border border-border px-3 py-2 text-xs">
                <span>{label}</span><span className={done ? "text-accent" : "text-primary"}>{done ? "READY" : "PENDING"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded border border-primary/20 bg-primary/5 p-3">
          <p className="lcars-label">Command notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{ship.notes || "No command notes recorded. Use Edit to capture theme rules, deployment notes or build instructions."}</p>
        </div>

        <div className="mt-4 rounded border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="lcars-label">Deployment summary</p>
              <p className="text-sm text-muted-foreground">At-a-glance command state for this vessel.</p>
            </div>
            <Badge variant="outline">{ship.ownership_status === "owned" ? "DEPLOYABLE" : "REGISTRY ONLY"}</Badge>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-border p-3">
              <p className="lcars-label text-[10px]">Command chain</p>
              <p className="mt-1 text-sm">{ship.characters?.name ?? "No captain assigned"} → {ship.builds?.name ?? "No active build"}</p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="lcars-label text-[10px]">Configuration</p>
              <p className="mt-1 text-sm">{activeLoadout?.name ?? "No active loadout"}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: ([
                !!ship.character_id,
                !!ship.current_build_id,
                !!ship.theme_id,
                !!activeLoadout,
                (manifest.data?.equipment.length ?? 0) > 0,
                (manifest.data?.traits.length ?? 0) > 0,
                (manifest.data?.boffs.length ?? 0) > 0,
              ].filter(Boolean).length / 7 * 100) + "%" }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-muted-foreground">Operational configuration completeness</p>
        </div>

        <div className="mt-4 rounded border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="lcars-label">Command manifest</p><p className="text-sm text-muted-foreground">{activeLoadout ? activeLoadout.name : "No active loadout"} · equipment, traits and bridge crew status</p></div>
            {activeLoadout && <Badge className="bg-accent text-accent-foreground">ACTIVE LOADOUT</Badge>}
          </div>
          {activeLoadout && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded border border-border p-2"><p className="lcars-label text-[10px]">Equipment</p><p className="font-display text-lg text-primary">{manifest.data?.equipment.length ?? 0}</p><p className="text-[10px] text-muted-foreground">fitted slots</p></div>
              <div className="rounded border border-border p-2"><p className="lcars-label text-[10px]">Traits</p><p className="font-display text-lg text-primary">{manifest.data?.traits.length ?? 0}</p><p className="text-[10px] text-muted-foreground">configured</p></div>
              <div className="rounded border border-border p-2"><p className="lcars-label text-[10px]">Bridge crew</p><p className="font-display text-lg text-primary">{manifest.data?.boffs.length ?? 0}</p><p className="text-[10px] text-muted-foreground">stations configured</p></div>
            </div>
          )}
          {activeLoadout && !manifest.isLoading && (
            <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {manifest.data?.equipment.length === 0 && <p className="text-primary">⚠ No equipment is fitted to the active loadout.</p>}
              {manifest.data?.traits.length === 0 && <p className="text-primary">⚠ No traits are configured for the active loadout.</p>}
              {manifest.data?.boffs.length === 0 && <p className="text-primary">⚠ No bridge officers are configured for the active loadout.</p>}
            </div>
          )}
          {!activeLoadout && ship.current_build_id && <p className="mt-2 text-xs text-primary">⚠ Select or mark a loadout active in the Build Library to establish the ship's command configuration.</p>}
        </div>

        <div className="mt-4 rounded border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div><p className="lcars-label">Build pipeline</p><p className="text-sm text-muted-foreground">{ship.builds?.name ?? "No build assigned"} · {(loadouts.data ?? []).length} loadout{(loadouts.data ?? []).length === 1 ? "" : "s"}</p></div>
            {loadouts.isFetching && <span className="text-xs text-muted-foreground">Scanning…</span>}
          </div>
          {!!loadouts.data?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{loadouts.data.map((l: any) => <div key={l.id} className="rounded border border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><span className="font-medium text-primary">{l.name}</span>{l.is_active && <Badge className="bg-accent text-accent-foreground">ACTIVE</Badge>}</div>{l.notes && <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p>}</div>)}</div>}
          {!ship.current_build_id && <p className="mt-2 text-xs text-muted-foreground">Assign a build to this ship to activate its loadout pipeline.</p>}
        </div>

        <DialogFooter className="gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button disabled={!name.trim() || update.isPending} onClick={() => update.mutate()}>Save changes</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-destructive" onClick={() => confirm("Remove this ship from your fleet?") && remove.mutate()}>Remove</Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
