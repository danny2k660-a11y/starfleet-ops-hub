import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Database, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Check, Package } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StoShip = Tables<"sto_ships">;
type StoShipReference = Tables<"sto_ship_reference_data">;

export const Route = createFileRoute("/_authenticated/ship-database")({
  head: () => ({
    meta: [
      { title: "Ship Database — STO Command Center" },
      { name: "description", content: "Shared STO ship definitions kept separate from personally owned ship instances." },
    ],
  }),
  component: ShipDatabasePage,
});

function seating(ship: StoShip): Array<{ slot: number; rank: string; career: string; specialization?: string | null; label: string }> {
  const raw = ship.bridge_officer_stations as any;
  const entries = Array.isArray(raw?.slots)
    ? raw.slots
    : Array.isArray(raw?.stations)
      ? raw.stations
      : Array.isArray(raw)
        ? raw
        : [];

  return entries.map((entry: any, index: number) => {
    if (typeof entry === "object" && entry !== null) {
      return {
        slot: Number(entry.slot ?? index + 1),
        rank: String(entry.rank ?? ""),
        career: String(entry.career ?? ""),
        specialization: entry.specialization ? String(entry.specialization) : null,
        label: [entry.rank, entry.career, entry.specialization].filter(Boolean).join(" "),
      };
    }

    const text = String(entry ?? "");
    const match = text.match(/^(Commander|Lieutenant Commander|Lieutenant|Ensign)\\s+(.*)$/);
    const rank = match?.[1] ?? "";
    const remainder = match?.[2] ?? text;
    const dash = remainder.indexOf("-");
    return {
      slot: index + 1,
      rank,
      career: dash >= 0 ? remainder.slice(0, dash).trim() : remainder.trim(),
      specialization: dash >= 0 ? remainder.slice(dash + 1).trim() : null,
      label: text,
    };
  }).filter((entry: any) => entry.rank || entry.career || entry.label);
}

function ShipDatabasePage() {
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "owned" | "missing" | "wishlist">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("https://stowiki.net/wiki/Category:Playable_starships");
  const [importJson, setImportJson] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const coverage = useQuery({
    queryKey: ["sto_ship_catalogue_coverage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ship_catalogue_coverage" as never).select("*").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const imports = useQuery({
    queryKey: ["sto_ship_catalog_imports"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_catalog_imports" as never).select("*").order("created_at", { ascending: false }).limit(10); if (error) throw error; return (data ?? []) as any[]; },
  });
  const characters = useQuery({
    queryKey: ["characters"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => { const { data, error } = await supabase.from("characters").select("id,name").order("name"); if (error) throw error; return (data ?? []) as Array<{ id: string; name: string }>; },
  });
  const ownership = useQuery({
    queryKey: ["sto_ship_ownership"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_ownership" as never).select("*"); if (error) throw error; return (data ?? []) as any[]; },
  });
  const bundles = useQuery({
    queryKey: ["sto_ship_bundles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ship_bundles" as never).select("*, sto_ship_bundle_items(sto_ships(name))").order("name");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const sources = useQuery({
    queryKey: ["sto_ship_sources"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_sources" as never).select("*, sto_ship_bundles(*)"); if (error) throw error; return (data ?? []) as any[]; },
  });
  const referenceData = useQuery({
    queryKey: ["sto_ship_reference_data"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sto_ship_reference_data").select("*");
      if (error) throw error;
      return (data ?? []) as StoShipReference[];
    },
  });
  const referenceByShip = useMemo(() => new Map((referenceData.data ?? []).map((row) => [row.sto_ship_id, row])), [referenceData.data]);

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
    const verified = ship.source_key === "stowiki" && !!ship.verified_at;
    const verificationMatch = verificationFilter === "all" || (verificationFilter === "verified" && verified) || (verificationFilter === "unverified" && !verified);
    return (!query || haystack.includes(query.toLowerCase())) && (faction === "ALL" || ship.faction === faction) && ownershipMatch && verificationMatch;
  }), [data, query, faction, ownershipFilter, verificationFilter, ownedByShip]);
  const ownedCount = data.filter((ship) => ownedByShip.get(ship.id)?.ownership_status === "owned").length;
  const wishlistCount = data.filter((ship) => ownedByShip.get(ship.id)?.ownership_status === "wishlist").length;
  const missingCount = Math.max(0, data.length - ownedCount);
  const setOwnership = async (ship: StoShip, status: "owned" | "wishlist") => {
    const current = ownedByShip.get(ship.id);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (current?.ownership_status === status) {
      const { error } = await supabase.from("sto_ship_ownership" as never).delete().eq("user_id", u.user.id).eq("sto_ship_id", ship.id);
      if (error) return;
    } else {
      const { error } = await supabase.from("sto_ship_ownership" as never).upsert({ user_id: u.user.id, sto_ship_id: ship.id, ownership_status: status, acquired_at: status === "owned" ? new Date().toISOString() : null }, { onConflict: "user_id,sto_ship_id" });
      if (error) return;
    }
    ownership.refetch();
  };
  const toggleOwnership = (ship: StoShip) => setOwnership(ship, "owned");
  const verifiedCount = data.filter((ship) => ship.source_key === "stowiki" && ship.verified_at).length;
  const unverifiedCount = Math.max(0, data.length - verifiedCount);
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
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{data.length} catalogue records</Badge><Badge variant="outline" className="border-primary/30 text-primary">{ownedCount} owned</Badge><Badge variant="outline">{missingCount} to check</Badge><Badge variant="outline" className="border-primary/30 text-primary">{verifiedCount} verified</Badge>{unverifiedCount > 0 && <Badge variant="outline">{unverifiedCount} unverified</Badge>}{wishlistCount > 0 && <Badge variant="outline">{wishlistCount} wishlist</Badge>}</div>
          </div>
          {coverage.data && <div className="mt-4 rounded border border-primary/20 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div><p className="lcars-label text-[10px]">Catalogue coverage</p><p className="mt-1 text-xs text-muted-foreground">Provenance and verification are tracked separately so community reference data is never presented as authoritative.</p></div>
              <Database className="size-4 shrink-0 text-primary" />
            </div>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <CoverageStat label="T6 records" value={coverage.data.t6_records} />
              <CoverageStat label="T6 complete" value={coverage.data.t6_records_complete} />
              <CoverageStat label="STOWiki verified" value={coverage.data.stowiki_verified} />
              <CoverageStat label="Official 2026" value={coverage.data.official_sto_2026} />
              <CoverageStat label="Community ref." value={coverage.data.community_reference} />
              <CoverageStat label="Provenance complete" value={coverage.data.provenance_complete} />
            </div>
          </div>}
          {data.length > 0 && <div className="mt-4 rounded border border-border bg-muted/10 p-3">
            <div className="mb-2 flex items-center justify-between"><p className="lcars-label text-[10px]">Catalogue data quality</p><span className="text-[10px] text-muted-foreground">No field is treated as populated until it is actually present</span></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{quality.map((item) => { const complete = item.complete === item.total; return <div key={item.label} className="rounded border border-border p-2"><div className="flex items-center gap-1.5 text-xs">{complete ? <CheckCircle2 className="size-3 text-primary"/> : <AlertTriangle className="size-3 text-muted-foreground"/>}<span>{item.label}</span></div><p className="mt-1 font-display text-sm text-primary">{item.complete}/{item.total}</p></div>; })}</div>
          </div>}
          <div className="mt-4 rounded border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div><p className="lcars-label text-[10px]">Bundle ownership</p><p className="text-xs text-muted-foreground">Claim a verified bundle once and every ship in that bundle is marked owned on your account.</p></div>
              <Package className="size-4 shrink-0 text-primary" />
            </div>
            {bundles.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading verified bundles…</p> : bundles.data?.length ? <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {bundles.data.map((bundle: any) => <BundleClaim key={bundle.id} bundle={bundle} characters={characters.data ?? []} sources={sources.data ?? []} onClaimed={() => { ownership.refetch(); }} />)}
            </div> : <p className="mt-2 text-xs text-muted-foreground">No verified bundle records have been added yet. Bundle claims will appear here as acquisition data is verified.</p>}
          </div>
          <div className="mt-4 rounded border border-border bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-2"><div><p className="lcars-label text-[10px]">Catalogue import pipeline</p><p className="mt-1 text-xs text-muted-foreground">Only validated source payloads can be applied. Missing fields stay empty rather than being guessed.</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>Stage JSON</Button><Database className="size-4 text-primary" /></div></div>
            {imports.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading import status…</p> : imports.data?.length ? <div className="mt-2 space-y-1.5">{imports.data.map((item: any) => <ImportRow key={item.id} item={item} onChanged={() => imports.refetch()} />)}</div> : <p className="mt-2 text-xs text-muted-foreground">No catalogue imports have been staged yet.</p>}
          </div>
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Stage verified ship catalogue JSON</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><label className="lcars-label text-[10px]">STOWiki source URL</label><Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} /></div>
                <div><label className="lcars-label text-[10px]">JSON array</label><Textarea className="min-h-48 font-mono text-xs" placeholder='[{"name":"...","ship_class":"...","faction":"...","tier":"T6","source_reference":"https://stowiki.net/wiki/..."}]' value={importJson} onChange={(e) => setImportJson(e.target.value)} /></div>
                <p className="text-xs text-muted-foreground">Only source data you have verified against STOWiki should be staged. The server validates every record before anything can be applied.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importBusy}>Cancel</Button>
                <Button disabled={importBusy || !importJson.trim()} onClick={async () => {
                  setImportBusy(true);
                  try {
                    const payload = JSON.parse(importJson);
                    if (!Array.isArray(payload)) throw new Error("JSON must be an array.");
                    const { data: u } = await supabase.auth.getUser();
                    if (!u.user) throw new Error("You must be signed in.");
                    const { error } = await supabase.from("sto_ship_catalog_imports" as never).insert({ source_key: "stowiki", source_url: importUrl.trim(), payload, status: "pending", imported_by: u.user.id } as never);
                    if (error) throw error;
                    setImportJson(""); setImportOpen(false); imports.refetch();
                  } catch (e) { console.error(e); window.alert(e instanceof Error ? e.message : "Invalid import."); }
                  finally { setImportBusy(false); }
                }}>{importBusy ? "Staging…" : "Stage import"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="mt-4 rounded border border-border bg-muted/10 p-3"><p className="lcars-label text-[10px]">Verification status</p><p className="mt-1 text-xs text-muted-foreground">{verifiedCount} of {data.length} catalogue records currently carry explicit STOWiki provenance. Unverified records remain usable but are clearly marked so they can be audited before being treated as authoritative.</p></div><div className="mt-4 flex flex-wrap gap-2">{(["all", "owned", "missing", "wishlist"] as const).map((filter) => <Button key={filter} size="sm" variant={ownershipFilter === filter ? "default" : "outline"} onClick={() => setOwnershipFilter(filter)}>{filter === "all" ? "All ships" : filter === "owned" ? "Owned" : filter === "missing" ? "Not owned" : "Wishlist"}</Button>)}</div>
          <div className="mt-2 flex flex-wrap gap-2">{(["all", "verified", "unverified"] as const).map((filter) => <Button key={filter} size="sm" variant={verificationFilter === filter ? "default" : "outline"} onClick={() => setVerificationFilter(filter)}>{filter === "all" ? "All verification" : filter === "verified" ? "Verified" : "Unverified"}</Button>)}</div>
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
            const ref = referenceByShip.get(ship.id);
            const consoleLayout = [ship.engineering_console_slots, ship.science_console_slots, ship.tactical_console_slots].every((v) => v !== null)
              ? `Eng ${ship.engineering_console_slots} · Sci ${ship.science_console_slots} · Tac ${ship.tactical_console_slots}${ship.universal_console_slots ? ` · Uni ${ship.universal_console_slots}` : ""}`
              : "Not populated";
            return (
              <div key={ship.id} className="panel overflow-hidden">
                <div className="flex items-center gap-2 p-4"><button className="min-w-0 flex-1 text-left" onClick={() => setExpanded(isOpen ? null : ship.id)}><div className="min-w-0"><p className="font-display text-base text-primary">{ship.name}</p><p className="truncate text-xs text-muted-foreground">{[ship.ship_class, ship.faction, ship.tier].filter(Boolean).join(" · ") || "Classification not populated"}</p></div></button><div className="flex shrink-0 gap-1"><Button size="sm" variant={ownedByShip.get(ship.id)?.ownership_status === "owned" ? "default" : "outline"} onClick={() => setOwnership(ship, "owned")}>{ownedByShip.get(ship.id)?.ownership_status === "owned" ? <><Check className="mr-1 size-3.5" /> Owned</> : "Own"}</Button><Button size="sm" variant={ownedByShip.get(ship.id)?.ownership_status === "wishlist" ? "default" : "outline"} onClick={() => setOwnership(ship, "wishlist")}>{ownedByShip.get(ship.id)?.ownership_status === "wishlist" ? "Wishlist" : "Want"}</Button></div><button className="shrink-0 p-1" onClick={() => setExpanded(isOpen ? null : ship.id)}>{isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button></div>
                {isOpen && <div className="border-t border-border p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Hull modifier" value={ship.hull_modifier} /><Info label="Shield modifier" value={ship.shield_modifier} /><Info label="Turn rate" value={ship.turn_rate} /><Info label="Inertia" value={ship.inertia} />
                    <Info label="Weapons" value={ship.fore_weapon_slots !== null && ship.aft_weapon_slots !== null ? `${ship.fore_weapon_slots} fore / ${ship.aft_weapon_slots} aft` : null} /><Info label="Console layout" value={consoleLayout} /><Info label="Hangar bays" value={ship.hangar_bays} /><Info label="Experimental weapon" value={ship.experimental_weapon_slot === null ? null : ship.experimental_weapon_slot ? "Yes" : "No"} />
                  </div>
                  <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3">
                    <p className="lcars-label text-[10px]">Bridge officer seating</p>\n                    {seats.length ? <div className="mt-2 grid gap-1 sm:grid-cols-2">{seats.map((seat) => <div key={ship.id + "-boff-" + seat.slot} className="rounded border border-border bg-background/40 px-2 py-1.5"><div className="flex items-center justify-between gap-2"><span className="font-medium text-sm">{seat.label || [seat.rank, seat.career, seat.specialization].filter(Boolean).join(" ") || "Unassigned"}</span><span className="text-[10px] text-muted-foreground">Slot {seat.slot}</span></div></div>)}</div> : <p className="mt-1 text-xs italic text-muted-foreground">Bridge officer seating not populated yet.</p>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2"><Info label="Ship trait" value={ship.ship_trait} /><Info label="Special mechanics" value={ship.special_mechanics} /><Info label="Special console" value={ship.special_console} /><Info label="Special weapons" value={ship.special_weapons} /></div>
                  {ref && <div className="mt-3 rounded border border-border bg-muted/10 p-3">
                    <p className="lcars-label text-[10px]">Reference detail</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Release" value={ref.release_date ? `${ref.release_date}${ref.bundle && ref.bundle !== "(None)" ? ` · ${ref.bundle}` : ""}` : ref.release_year} />
                      <Info label="Mastery package" value={ref.mastery_package} />
                      <Info label="Dual cannons" value={ref.equip_dual_cannons ? "Yes" : "No"} />
                      <Info label="Devices" value={ref.devices} />
                      <Info label="Power bonus" value={[
                        ref.bonus_weapon_power ? `W ${ref.bonus_weapon_power}` : null,
                        ref.bonus_shield_power ? `S ${ref.bonus_shield_power}` : null,
                        ref.bonus_engine_power ? `E ${ref.bonus_engine_power}` : null,
                        ref.bonus_aux_power ? `A ${ref.bonus_aux_power}` : null,
                      ].filter(Boolean).join(" · ")} />
                      <Info label="Seat maxima (reference)" value={[
                        ref.max_tactical_seat ? `Tac ${ref.max_tactical_seat}` : null,
                        ref.max_engineering_seat ? `Eng ${ref.max_engineering_seat}` : null,
                        ref.max_science_seat ? `Sci ${ref.max_science_seat}` : null,
                        ref.max_universal_seat ? `Uni ${ref.max_universal_seat}` : null,
                        ref.max_intelligence_seat ? `Int ${ref.max_intelligence_seat}` : null,
                        ref.max_command_seat ? `Cmd ${ref.max_command_seat}` : null,
                        ref.max_pilot_seat ? `Pil ${ref.max_pilot_seat}` : null,
                        ref.max_temporal_seat ? `Tmp ${ref.max_temporal_seat}` : null,
                        ref.max_miracle_worker_seat ? `MW ${ref.max_miracle_worker_seat}` : null,
                      ].filter(Boolean).join(" · ")} />
                    </div>
                    {ref.seats_text && <div className="mt-2"><Info label="Full seating" value={ref.seats_text} /></div>}
                    {ref.trait_description && <div className="mt-2"><Info label="Trait effect" value={ref.trait_description} /></div>}
                    {ref.console_description && <div className="mt-2"><Info label="Console effect" value={ref.console_description} /></div>}
                    <p className="mt-2 text-[10px] text-muted-foreground">Reference data: STO Ship DB / Fleffle-derived community dataset · last upstream update 2025-11-11. This is reference data, not STOWiki verification.</p>
                  </div>}
                  <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3"><div className="flex items-center justify-between gap-2"><p className="lcars-label text-[10px]">Acquisition routes</p>{ownedByShip.get(ship.id)?.acquired_at && <span className="text-[10px] text-primary">Owned {new Date(ownedByShip.get(ship.id).acquired_at).toLocaleDateString()}</span>}</div>{(sourcesByShip.get(ship.id) ?? []).length > 0 ? <div className="mt-2 space-y-1.5">{(sourcesByShip.get(ship.id) ?? []).map((source: any) => <div key={source.id} className="rounded border border-border bg-background/40 px-2 py-1.5 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span>{source.source_name}</span><span className="text-muted-foreground">{source.price_amount != null ? `${source.price_currency ?? ""} ${source.price_amount}` : source.availability_status}</span></div>{source.character_restriction && <p className="mt-1 text-muted-foreground">Character restriction: {source.character_restriction}</p>}{source.account_unlock && <p className="mt-1 text-primary">Account unlock</p>}</div>)}</div> : <p className="mt-1 text-xs text-muted-foreground">Acquisition route not verified yet — this ship stays separate from the store audit until a source is recorded.</p>}</div><p className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><Database className="size-3" /> Definition source: {ship.source_reference ?? "Not recorded"} · Version: {ship.data_version ?? "Not recorded"} {ship.source_key === "stowiki" && <Badge variant="outline" className="text-[9px]">STOWiki source</Badge>}</p>
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function CoverageStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded border border-border p-2"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 font-display text-sm text-primary">{value}</p></div>;
}

function BundleClaim({ bundle, characters, sources, onClaimed }: { bundle: any; characters: Array<{ id: string; name: string }>; sources: any[]; onClaimed: () => void }) {
  const [busy, setBusy] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const shipItems = (bundle.sto_ship_bundle_items ?? []) as any[];
  const shipNames = shipItems.map((x: any) => x.sto_ships?.name).filter(Boolean);
  const claim = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("You must be signed in.");
      if (!bundle.account_unlock && !characterId) throw new Error("Choose the character receiving this bundle.");
      if (!shipItems.length) throw new Error("This bundle has no ship items registered.");

      const accountWide = bundle.account_unlock === true;
      const targetCharacters = accountWide ? characters.map((c) => c.id) : [characterId];
      if (!targetCharacters.length) throw new Error("No characters are available on this account.");

      const shipIds = shipItems.map((item: any) => item.sto_ship_id);
      const { data: existing, error: existingError } = await supabase
        .from("user_ships")
        .select("id,sto_ship_id,character_id,ownership_status")
        .eq("user_id", u.user.id)
        .in("character_id", targetCharacters)
        .in("sto_ship_id", shipIds);
      if (existingError) throw existingError;

      const existingRows = (existing ?? []) as any[];
      const rows = shipItems.flatMap((item: any) => {
        const source = sources.find((s: any) => s.bundle_id === bundle.id && s.sto_ship_id === item.sto_ship_id);
        return targetCharacters
          .filter((id) => !existingRows.some((row) => row.character_id === id && row.sto_ship_id === item.sto_ship_id))
          .map((id) => ({
            user_id: u.user.id,
            character_id: id,
            sto_ship_id: item.sto_ship_id,
            custom_name: null,
            ownership_status: "owned",
            acquisition_source_id: source?.id ?? null,
            acquisition_group: bundle.name,
            usage_mode: "build_pending",
          }));
      });

      const updates = shipItems.flatMap((item: any) => {
        const source = sources.find((s: any) => s.bundle_id === bundle.id && s.sto_ship_id === item.sto_ship_id);
        return existingRows
          .filter((row) => row.sto_ship_id === item.sto_ship_id && targetCharacters.includes(row.character_id) && row.ownership_status !== "owned")
          .map((row) => supabase
            .from("user_ships")
            .update({
              ownership_status: "owned",
              acquisition_source_id: source?.id ?? null,
              acquisition_group: bundle.name,
              usage_mode: "build_pending",
            } as never)
            .eq("id", row.id)
          );
      });

      if (rows.length) {
        const { error } = await supabase.from("user_ships").insert(rows as never[]);
        if (error) throw error;
      }
      const updateResults = await Promise.all(updates);
      const updateError = updateResults.find((result) => result.error)?.error;
      if (updateError) throw updateError;

      const ownershipRows = shipItems.map((item: any) => {
        const source = sources.find((s: any) => s.bundle_id === bundle.id && s.sto_ship_id === item.sto_ship_id);
        return {
          user_id: u.user.id,
          sto_ship_id: item.sto_ship_id,
          ownership_status: "owned",
          acquired_at: new Date().toISOString(),
          acquisition_source_id: source?.id ?? null,
          notes: `Claimed via bundle: ${bundle.name}`,
        };
      });
      const { error: ownershipError } = await supabase
        .from("sto_ship_ownership" as never)
        .upsert(ownershipRows as never[], { onConflict: "user_id,sto_ship_id" });
      if (ownershipError) throw ownershipError;

      onClaimed();
      if (!rows.length) {
        window.alert(accountWide ? "This bundle is already registered on every character." : "This bundle is already registered on this character.");
      }
    } catch (e) {
      console.error(e);
      const err = e as any;
      const detail = [err?.message, err?.details, err?.hint, err?.code ? `code ${err.code}` : null].filter(Boolean).join(" — ");
      window.alert(detail || "Could not claim bundle.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="rounded border border-border bg-background/40 p-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{bundle.name}</p>
        <p className="text-[10px] text-muted-foreground">{shipNames.length} ship{shipNames.length === 1 ? "" : "s"} · {bundle.availability_status}{bundle.account_unlock ? " · Account unlock" : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!bundle.account_unlock && (
          <Select value={characterId} onValueChange={setCharacterId}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Character" /></SelectTrigger>
            <SelectContent>{characters.map((character) => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" disabled={busy || !shipNames.length || (!bundle.account_unlock && !characterId)} onClick={claim}>{busy ? "Claiming…" : bundle.account_unlock ? "Claim for all characters" : "Claim bundle"}</Button>
      </div>
    </div>
  </div>;
}
