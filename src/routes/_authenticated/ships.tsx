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
  const [q, setQ] = useState("");
  const [charFilter, setCharFilter] = useState(ALL);
  const [factionFilter, setFactionFilter] = useState(ALL);
  const [themeFilter, setThemeFilter] = useState(ALL);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const factions = useMemo(
    () => Array.from(new Set((catalog.data ?? []).map((s) => s.faction).filter(Boolean))) as string[],
    [catalog.data],
  );

  const filtered = (ships.data ?? []).filter((s) => {
    const text = `${s.custom_name} ${s.sto_ships?.name ?? ""} ${s.sto_ships?.ship_class ?? ""}`.toLowerCase();
    const commandMatch =
      q === "__command_ready__" ? s.ownership_status === "owned" && !!s.character_id && !!s.current_build_id && !!s.theme_id :
      q === "__build_assigned__" ? s.ownership_status === "owned" && !!s.current_build_id :
      q === "__theme_assigned__" ? s.ownership_status === "owned" && !!s.theme_id :
      q === "__needs_command_setup__" ? s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id) :
      true;
    if (!commandMatch) return false;
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
  const commandReadyCount = (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.character_id && s.current_build_id && s.theme_id).length;
  const fullChecklistBase = (s: UserShip) => [
    !!s.character_id,
    !!s.current_build_id,
    !!s.theme_id,
  ];
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
          <Badge variant="outline">{ownedCount ? Math.round(((ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.character_id && s.current_build_id && s.theme_id).length / ownedCount) * 100) : 0}% command-ready</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Command-ready", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.character_id && s.current_build_id && s.theme_id).length, note: "captain + build + theme" },
            { label: "Build assigned", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.current_build_id).length, note: "build linked" },
            { label: "Theme assigned", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.theme_id).length, note: "theme identity" },
            { label: "Needs command setup", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id)).length, note: "one or more missing" },
          ].map((item) => (
            <button key={item.label} onClick={() => {
              setQ(
                item.label === "Command-ready" ? "__command_ready__" :
                item.label === "Build assigned" ? "__build_assigned__" :
                item.label === "Theme assigned" ? "__theme_assigned__" :
                "__needs_command_setup__",
              );
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
          <div className="h-full bg-primary transition-all" style={{ width: `${ownedCount ? ((ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.character_id && s.current_build_id && s.theme_id).length / ownedCount) * 100 : 0}%` }} />
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
                {fleetLoadouts.isLoading
                  ? "Scanning linked builds for active loadouts…"
                  : `${activeLoadoutByBuild.size} of ${buildIds.length} linked builds have an active loadout.`}
              </p>
            </div>
            <div className="sm:col-span-4 space-y-2">
              {(ships.data ?? []).filter((s) => s.ownership_status === "owned" && s.current_build_id).slice(0, 12).map((s) => {
                const active = activeLoadoutByBuild.get(s.current_build_id!);
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} className="flex w-full items-center justify-between gap-3 rounded border border-border bg-muted/20 p-2.5 text-left transition hover:border-primary">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{s.custom_name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{s.sto_ships?.name ?? "Unknown ship"}</p>
                    </div>
                    <Badge variant={active ? "default" : "outline"}>{active ? "LOADOUT READY" : "LOADOUT REQUIRED"}</Badge>
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
            <p className="lcars-label">Fleet readiness matrix</p>
            <p className="text-sm text-muted-foreground">Command state is calculated from the same core checklist used by each ship detail screen.</p>
          </div>
          <Badge variant="outline">{commandReadyCount}/{ownedCount} command-ready</Badge>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Command ready", count: commandReadyCount, note: "captain · build · theme" },
            { label: "Configuration pending", count: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && fullChecklistBase(s).some((x) => !x)).length, note: "core assignment missing" },
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
          {(ships.data ?? []).filter((s) => s.ownership_status === "owned").slice(0, 12).map((s) => {
            const checks = fullChecklistBase(s);
            const complete = checks.filter(Boolean).length;
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
          {(ships.data ?? [])
            .filter((s) => s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id))
            .slice(0, 5)
            .map((s) => {
              const missing = !s.character_id ? "Captain" : !s.current_build_id ? "Build" : "Theme";
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
          {(ships.data ?? []).filter((s) => s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id)).length === 0 && (
            <p className="text-sm text-muted-foreground">No owned ships are waiting on captain, build or theme assignment.</p>
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
          <Badge variant="outline">{(ships.data ?? []).filter((s) => s.ownership_status === "owned" && (!s.character_id || !s.current_build_id || !s.theme_id)).length} open</Badge>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Assign captain", ships: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && !s.character_id), action: "captain" },
            { label: "Assign build", ships: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && !!s.character_id && !s.current_build_id), action: "build" },
            { label: "Assign theme", ships: (ships.data ?? []).filter((s) => s.ownership_status === "owned" && !!s.current_build_id && !s.theme_id), action: "theme" },
          ].map((item) => (
            <button key={item.action} onClick={() => {
              const target = item.ships[0];
              if (target) setSelectedId(target.id);
            }} className="rounded border border-border bg-muted/20 p-3 text-left transition hover:border-primary">
              <div className="flex items-center justify-between gap-2">
                <p className="lcars-label text-[10px]">{item.label}</p>
                <Badge variant={item.ships.length ? "default" : "outline"}>{item.ships.length}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.ships.length
                  ? `${item.ships[0].custom_name} · ${item.ships.length === 1 ? "1 ship" : `${item.ships.length} ships`}`
                  : "No ships waiting"}
              </p>
            </button>
          ))}
        </div>
      </div>

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
            <p className="text-xs text-muted-foreground">{filtered.length} matching ship{filtered.length === 1 ? "" : "s"} · {readyCount} build-linked fleetwide</p>
          </div>
          {(charFilter !== ALL || themeFilter !== ALL || factionFilter !== ALL || q) && (
            <Button variant="outline" size="sm" onClick={() => { setQ(""); setCharFilter(ALL); setThemeFilter(ALL); setFactionFilter(ALL); }}>
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
