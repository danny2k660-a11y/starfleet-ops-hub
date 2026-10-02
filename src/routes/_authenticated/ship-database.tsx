import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Database, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Check } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "owned" | "missing" | "wishlist">("all");
  const ownership = useQuery({
    queryKey: ["sto_ship_ownership"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_ownership" as never).select("*"); if (error) throw error; return (data ?? []) as any[]; },
  });
  const sources = useQuery({
    queryKey: ["sto_ship_sources"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_sources" as never).select("*, sto_ship_bundles(*)"); if (error) throw error; return (data ?? []) as any[]; },
  });
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["ship_database_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ships").select("*").order("name");
      if (error) throw error;
      return data as StoShip[];
    },
  });
  const factions = useMemo(() => Array.from(new Set(data.map((ship) => ship.faction).filter(Boolean))) as string[], [data]);
  const ownedByShip = useMemo(() => new Map((ownership.data ?? []).map((row: any) => [row.sto_ship_id, row])), [ownership.data]);
  const sourcesByShip = useMemo(() => { const map = new Map<string, any[]>(); for (const row of sources.data ?? []) { const list = map.get(row.sto_ship_id) ?? []; list.push(row); map.set(row.sto_ship_id, list); } return map; }, [sources.data]);
  const filtered = useMemo(() => data.filter((ship) => {
    const haystack = `${ship.name} ${ship.ship_class ?? ""} ${ship.faction ?? ""} ${ship.tier ?? ""}`.toLowerCase();
    const status = ownedByShip.get(ship.id)?.ownership_status;
    const ownershipMatch = ownershipFilter === "all" || (ownershipFilter === "owned" && status === "owned") || (ownershipFilter === "wishlist" && status === "wishlist") || (ownershipFilter === "missing" && status !== "owned" && status !== "wishlist");
    return (!query || haystack.includes(query.toLowerCase())) && (faction === "ALL" || ship.faction === faction) && ownershipMatch;
  }), [data, query, faction, ownershipFilter, ownedByShip]);
  const ownedCount = data.filter((ship) => ownedByShip.get(ship.id)?.ownership_status === "owned").length;
  const wishlistCount = data.filter((ship) => ownedByShip.get(ship.id)?.ownership_status === "wishlist").length;
  const missingCount = Math.max(0, data.length - ownedCount);
  const toggleOwnership = async (ship: StoShip) => {
    const current = ownedByShip.get(ship.id);
    if (current?.ownership_status === "owned") {
      const { error } = await supabase.from("sto_ship_ownership" as never).delete().eq("sto_ship_id", ship.id);
      if (error) return;
    } else {
      const { data: u } = await supabase.auth.getUser(); if (!u.user) return;
      const { error } = await supabase.from("sto_ship_ownership" as never).upsert({ user_id: u.user.id, sto_ship_id: ship.id, ownership_status: "owned", acquired_at: new Date().toISOString() }, { onConflict: "user_id,sto_ship_id" });
      if (error) return;
    }
    ownership.refetch();
  };
  const quality = useMemo(() => {
    const fields: Array<[string, (ship: StoShip) => boolean]> = [
      ["Classification", (s) => !!s.ship_class && !!s.faction && !!s.tier],
      ["Hull / shields", (s) => s.hull_modifier !== null && s.shield_modifier !== null],
      ["Weapons / consoles", (s) => s.fore_weapon_slots !== null && s.aft_weapon_slots !== null && s.engineering_console_slots !== null && s.science_console_slots !== null && s.tactical_console_slots !== null],
      ["Bridge seating", (s) => seating(s).length > 0],
      ["Special mechanics", (s) => !!s.ship_trait || !!s.special_mechanics || !!s.special_console || !!s.special_weapons],
    ];
    return fields.map(([label, test]) => ({ label, complete: data.filter(test).length, total: data.length }));
  }, [data]);

  return (
    <AppShell title="Ship Database" subtitle="Shared STO ship definitions — separate from your personal fleet">
      <div className="space-y-5">
        <div className="panel p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="lcars-label">STO catalogue</p>
              <h2 className="font-display text-xl text-primary">Ship definitions</h2>
              <p className="mt-1 text-xs text-muted-foreground">Shared definitions feed personal ship instances. Character ownership stays on the fleet record.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{data.length} catalogue records</Badge><Badge variant="outline" className="border-primary/30 text-primary">{ownedCount} owned</Badge><Badge variant="outline">{missingCount} to check</Badge>{wishlistCount > 0 && <Badge variant="outline">{wishlistCount} wishlist</Badge>}</div>
          </div>
          {data.length > 0 && <div className="mt-4 rounded border border-border bg-muted/10 p-3">
            <div className="mb-2 flex items-center justify-between"><p className="lcars-label text-[10px]">Catalogue data quality</p><span className="text-[10px] text-muted-foreground">No field is treated as populated until it is actually present</span></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{quality.map((item) => { const complete = item.complete === item.total; return <div key={item.label} className="rounded border border-border p-2"><div className="flex items-center gap-1.5 text-xs">{complete ? <CheckCircle2 className="size-3 text-primary"/> : <AlertTriangle className="size-3 text-muted-foreground"/>}<span>{item.label}</span></div><p className="mt-1 font-display text-sm text-primary">{item.complete}/{item.total}</p></div>; })}</div>
          </div>}
          <div className="mt-4 flex flex-wrap gap-2">{(["all", "owned", "missing", "wishlist"] as const).map((filter) => <Button key={filter} size="sm" variant={ownershipFilter === filter ? "default" : "outline"} onClick={() => setOwnershipFilter(filter)}>{filter === "all" ? "All ships" : filter === "owned" ? "Owned" : filter === "missing" ? "Not owned" : "Wishlist"}</Button>)}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
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
                <div className="flex items-center gap-2 p-4"><button className="min-w-0 flex-1 text-left" onClick={() => setExpanded(isOpen ? null : ship.id)}><div className="min-w-0"><p className="font-display text-base text-primary">{ship.name}</p><p className="truncate text-xs text-muted-foreground">{[ship.ship_class, ship.faction, ship.tier].filter(Boolean).join(" · ") || "Classification not populated"}</p></div></button><Button size="sm" variant={ownedByShip.get(ship.id)?.ownership_status === "owned" ? "default" : "outline"} onClick={() => toggleOwnership(ship)} className="shrink-0">{ownedByShip.get(ship.id)?.ownership_status === "owned" ? <><Check className="mr-1 size-3.5" /> Owned</> : "Mark owned"}</Button><button className="shrink-0 p-1" onClick={() => setExpanded(isOpen ? null : ship.id)}>{isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button></div>
                {isOpen && <div className="border-t border-border p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Hull modifier" value={ship.hull_modifier} /><Info label="Shield modifier" value={ship.shield_modifier} /><Info label="Turn rate" value={ship.turn_rate} /><Info label="Inertia" value={ship.inertia} />
                    <Info label="Weapons" value={ship.fore_weapon_slots !== null && ship.aft_weapon_slots !== null ? `${ship.fore_weapon_slots} fore / ${ship.aft_weapon_slots} aft` : null} /><Info label="Console layout" value={consoleLayout} /><Info label="Hangar bays" value={ship.hangar_bays} /><Info label="Experimental weapon" value={ship.experimental_weapon_slot === null ? null : ship.experimental_weapon_slot ? "Yes" : "No"} />
                  </div>
                  <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3">
                    <p className="lcars-label text-[10px]">Bridge officer seating</p>
                    {seats.length ? <div className="mt-2 grid gap-1 sm:grid-cols-2">{seats.map((seat, index) => <div key={`${seat}-${index}`} className="rounded border border-border bg-background/40 px-2 py-1.5 text-sm">{seat}</div>)}</div> : <p className="mt-1 text-xs italic text-muted-foreground">Bridge officer seating not populated yet.</p>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2"><Info label="Ship trait" value={ship.ship_trait} /><Info label="Special mechanics" value={ship.special_mechanics} /><Info label="Special console" value={ship.special_console} /><Info label="Special weapons" value={ship.special_weapons} /></div>
                  <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3"><div className="flex items-center justify-between gap-2"><p className="lcars-label text-[10px]">Acquisition routes</p>{ownedByShip.get(ship.id)?.acquired_at && <span className="text-[10px] text-primary">Owned {new Date(ownedByShip.get(ship.id).acquired_at).toLocaleDateString()}</span>}</div>{(sourcesByShip.get(ship.id) ?? []).length > 0 ? <div className="mt-2 space-y-1.5">{(sourcesByShip.get(ship.id) ?? []).map((source: any) => <div key={source.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-background/40 px-2 py-1.5 text-xs"><span>{source.source_name}</span><span className="text-muted-foreground">{source.price_amount != null ? `${source.price_currency ?? ""} ${source.price_amount}` : source.availability_status}</span></div>)}</div> : <p className="mt-1 text-xs text-muted-foreground">Acquisition route not verified yet — this ship stays separate from the store audit until a source is recorded.</p>}</div><p className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><Database className="size-3" /> Definition source: {ship.source_reference ?? "Not recorded"} · Version: {ship.data_version ?? "Not recorded"} {ship.source_key === "stowiki" && <Badge variant="outline" className="text-[9px]">STOWiki source</Badge>}</p>
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
