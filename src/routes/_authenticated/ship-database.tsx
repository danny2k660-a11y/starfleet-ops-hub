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
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");
  const imports = useQuery({
    queryKey: ["sto_ship_catalog_imports"],
    queryFn: async () => { const { data, error } = await supabase.from("sto_ship_catalog_imports" as never).select("*").order("created_at", { ascending: false }).limit(10); if (error) throw error; return (data ?? []) as any[]; },
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
              {bundles.data.map((bundle: any) => <BundleClaim key={bundle.id} bundle={bundle} onClaimed={() => ownership.refetch()} />)}
            </div> : <p className="mt-2 text-xs text-muted-foreground">No verified bundle records have been added yet. Bundle claims will appear here as acquisition data is verified.</p>}
          </div>
          <div className="mt-4 rounded border border-border bg-muted/10 p-3">
            <div className="flex items-center justify-between gap-2"><div><p className="lcars-label text-[10px]">Catalogue import pipeline</p><p className="mt-1 text-xs text-muted-foreground">Only validated source payloads can be applied. Missing fields stay empty rather than being guessed.</p></div><Database className="size-4 text-primary" /></div>
            {imports.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading import status…</p> : imports.data?.length ? <div className="mt-2 space-y-1.5">{imports.data.map((item: any) => <ImportRow key={item.id} item={item} onChanged={() => imports.refetch()} />)}</div> : <p className="mt-2 text-xs text-muted-foreground">No catalogue imports have been staged yet.</p>}
          </div>
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
                    <p className="lcars-label text-[10px]">Bridge officer seating</p>
                    {seats.length ? <div className="mt-2 grid gap-1 sm:grid-cols-2">{seats.map((seat, index) => <div key={`${seat}-${index}`} className="rounded border border-border bg-background/40 px-2 py-1.5 text-sm">{seat}</div>)}</div> : <p className="mt-1 text-xs italic text-muted-foreground">Bridge officer seating not populated yet.</p>}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2"><Info label="Ship trait" value={ship.ship_trait} /><Info label="Special mechanics" value={ship.special_mechanics} /><Info label="Special console" value={ship.special_console} /><Info label="Special weapons" value={ship.special_weapons} /></div>
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

function BundleClaim({ bundle, onClaimed }: { bundle: any; onClaimed: () => void }) {
  const [busy, setBusy] = useState(false);
  const shipNames = (bundle.sto_ship_bundle_items ?? []).map((x: any) => x.sto_ships?.name).filter(Boolean);
  const claim = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("claim_sto_ship_bundle" as never, { p_bundle_id: bundle.id, p_acquired_at: new Date().toISOString() } as never);
      if (error) throw error;
      onClaimed();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
  return <div className="rounded border border-border bg-background/40 p-2">
    <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{bundle.name}</p><p className="text-[10px] text-muted-foreground">{shipNames.length} ship{shipNames.length === 1 ? "" : "s"} · {bundle.availability_status}</p></div><Button size="sm" variant="outline" disabled={busy || !shipNames.length} onClick={claim}>{busy ? "Claiming…" : "Claim bundle"}</Button></div>
  </div>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  const empty = value === null || value === undefined || value === "";
  return <div className="rounded border border-border bg-muted/20 p-2"><p className="lcars-label text-[10px]">{label}</p><p className={empty ? "text-xs italic text-muted-foreground" : "text-sm text-foreground"}>{empty ? "Not populated" : String(value)}</p></div>;
}

function ImportRow({ item, onChanged }: { item: any; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const run = async (action: "validate" | "apply") => {
    setBusy(true);
    try {
      const fn = action === "validate" ? "validate_sto_ship_catalog_import" : "apply_sto_ship_catalog_import";
      const { error } = await supabase.rpc(fn as never, { p_import_id: item.id } as never);
      if (error) throw error;
      onChanged();
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };
  const count = Array.isArray(item.payload) ? item.payload.length : 0;
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-background/40 px-2 py-2 text-xs"><div className="min-w-0"><p className="font-medium">{item.source_key} · {count} records</p><p className="text-[10px] text-muted-foreground">{item.status} · {new Date(item.created_at).toLocaleString()}</p>{item.error_message && <p className="mt-1 text-[10px] text-destructive">{item.error_message}</p>}</div><div className="flex gap-1">{item.status === "pending" && <Button size="sm" variant="outline" disabled={busy} onClick={() => run("validate")}>{busy ? "Checking…" : "Validate"}</Button>}{item.status === "validated" && <Button size="sm" variant="outline" disabled={busy} onClick={() => run("apply")}>{busy ? "Applying…" : "Apply"}</Button>}</div></div>;
}
