import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Database, ChevronDown, ChevronUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

 type StoShip = Tables<"sto_ships">;

export const Route = createFileRoute("/_authenticated/ship-database")({
  head: () => ({
    meta: [
      { title: "Ship Database — STO Command Center" },
      { name: "description", content: "Shared STO ship definitions kept separate from personally owned ship instances." },
    ],
  }),
  component: ShipDatabasePage,
});

function seating(ship: StoShip): string[] {
  const raw = ship.bridge_officer_stations as unknown;
  if (Array.isArray(raw)) {
    return raw.map((entry: any) => {
      if (typeof entry === "string") return entry;
      return [entry?.rank, entry?.career, entry?.specialization ? `(${entry.specialization})` : null].filter(Boolean).join(" ");
    }).filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([seat, value]) => {
      if (typeof value === "string") return `${seat} — ${value}`;
      if (value && typeof value === "object") {
        const v = value as Record<string, unknown>;
        return [seat, v.career, v.specialization ? `(${v.specialization})` : null].filter(Boolean).join(" — ");
      }
      return seat;
    });
  }
  return [];
}

function ShipDatabasePage() {
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const catalog = useMemo(() => ({
    queryKey: ["ship_database_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ships").select("*").order("name");
      if (error) throw error;
      return data as StoShip[];
    },
  }), []);
  const { data = [], isLoading, error } = (require("@tanstack/react-query") as typeof import("@tanstack/react-query")).useQuery(catalog);
  const factions = useMemo(() => Array.from(new Set(data.map((ship) => ship.faction).filter(Boolean))) as string[], [data]);
  const filtered = useMemo(() => data.filter((ship) => {
    const haystack = `${ship.name} ${ship.ship_class ?? ""} ${ship.faction ?? ""} ${ship.tier ?? ""}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (faction === "ALL" || ship.faction === faction);
  }), [data, query, faction]);

  return (
    <AppShell title="Ship Database" subtitle="Shared STO ship definitions — separate from your personal fleet">
      <div className="space-y-5">
        <div className="panel p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="lcars-label">STO catalogue</p>
              <h2 className="font-display text-xl text-primary">Ship definitions</h2>
              <p className="mt-1 text-xs text-muted-foreground">This is the source definition used when creating personal ship instances. No personal character ownership is stored here.</p>
            </div>
            <Badge variant="outline">{data.length} records</Badge>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, class, faction or tier" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={faction} onChange={(e) => setFaction(e.target.value)}><option value="ALL">All factions</option>{factions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
        </div>

        {isLoading && <div className="panel p-5 text-sm text-muted-foreground">Loading ship definitions…</div>}
        {error && <div className="panel border-destructive/40 p-5 text-sm text-destructive">Ship database could not be loaded.</div>}
        {!isLoading && !error && filtered.length === 0 && <div className="panel p-5 text-sm text-muted-foreground">No ship definitions match the current filters.</div>}

        <div className="grid gap-3">
          {filtered.map((ship) => {
            const isOpen = expanded === ship.id;
            const seats = seating(ship);
            const consoleLayout = [ship.engineering_console_slots, ship.science_console_slots, ship.tactical_console_slots].every((v) => v !== null)
              ? `Eng ${ship.engineering_console_slots} · Sci ${ship.science_console_slots} · Tac ${ship.tactical_console_slots}${ship.universal_console_slots ? ` · Uni ${ship.universal_console_slots}` : ""}`
              : "Not populated";
            return (
              <div key={ship.id} className="panel overflow-hidden">
                <button className="flex w-full items-center justify-between gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : ship.id)}>
                  <div className="min-w-0"><p className="font-display text-base text-primary">{ship.name}</p><p className="truncate text-xs text-muted-foreground">{[ship.ship_class, ship.faction, ship.tier].filter(Boolean).join(" · ") || "Classification not populated"}</p></div>
                  {isOpen ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
                </button>
                {isOpen && <div className="border-t border-border p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Hull modifier" value={ship.hull_modifier} />
                    <Info label="Shield modifier" value={ship.shield_modifier} />
                    <Info label="Turn rate" value={ship.turn_rate} />
                    <Info label="Inertia" value={ship.inertia} />
                    <Info label="Weapons" value={ship.fore_weapon_slots !== null && ship.aft_weapon_slots !== null ? `${ship.fore_weapon_slots} fore / ${ship.aft_weapon_slots} aft` : null} />
                    <Info label="Console layout" value={consoleLayout} />
                    <Info label="Hangar bays" value={ship.hangar_bays} />
                    <Info label="Experimental weapon" value={ship.experimental_weapon_slot === null ? null : ship.experimental_weapon_slot ? "Yes" : "No"} />
                  </div>
                  <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3">
                    <p className="lcars-label text-[10px]">Bridge officer seating</p>
                    {seats.length ? <div className="mt-2 grid gap-1 sm:grid-cols-2">{seats.map((seat, index) => <div key={`${seat}-${index}`} className="rounded border border-border bg-background/40 px-2 py-1.5 text-sm">{seat}</div>)}</div> : <p className="mt-1 text-xs italic text-muted-foreground">Bridge officer seating not populated yet.</p>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Info label="Ship trait" value={ship.ship_trait} />
                    <Info label="Special mechanics" value={ship.special_mechanics} />
                    <Info label="Special console" value={ship.special_console} />
                    <Info label="Special weapons" value={ship.special_weapons} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"><Database className="size-3" /> Source: {ship.source_reference ?? "Not recorded"} · Version: {ship.data_version ?? "Not recorded"}</p>
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  const empty = value === null || value === undefined || value === "";
  return <div className="rounded border border-border bg-muted/20 p-2"><p className="lcars-label text-[10px]">{label}</p><p className={empty ? "text-xs italic text-muted-foreground" : "text-sm text-foreground"}>{empty ? "Not populated" : String(value)}</p></div>;
}
