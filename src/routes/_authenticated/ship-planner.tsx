import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, PackagePlus, Rocket, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/ship-planner")({
  head: () => ({ meta: [{ title: "Ship Planner — STO Command Center" }, { name: "description", content: "Claim ships to characters and decide which owned ships need builds." }] }),
  component: ShipPlannerPage,
});

type Character = { id: string; name: string };
type CatalogShip = { id: string; name: string; ship_class: string | null; faction: string | null };
type FleetShip = { id: string; custom_name?: string | null; character_id: string | null; sto_ship_id: string; current_build_id?: string | null; ownership_status: string; acquisition_source_id?: string | null; acquisition_group?: string | null; usage_mode?: string | null; characters?: Character | null; sto_ships?: CatalogShip | null };
const ACQUISITION_SOURCES = ["Zen Store", "Bundle", "Event", "Lockbox", "Lobi", "Campaign", "Promo", "Fleet", "Other"];

function ShipPlannerPage() {
  const qc = useQueryClient();
  const [claimCharacter, setClaimCharacter] = useState("");
  const [claimSource, setClaimSource] = useState("Zen Store");
  const [claimGroup, setClaimGroup] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<string[]>([]);
  const [buildSearch, setBuildSearch] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("");

  const characters = useQuery({ queryKey: ["characters"], queryFn: async () => { const { data, error } = await supabase.from("characters").select("id,name").order("name"); if (error) throw error; return (data ?? []) as Character[]; } });
  const catalog = useQuery({ queryKey: ["sto_ships"], queryFn: async () => { const { data, error } = await supabase.from("sto_ships").select("id,name,ship_class,faction").order("name"); if (error) throw error; return (data ?? []) as CatalogShip[]; } });
  const sources = useQuery({ queryKey: ["sto_ship_sources"], queryFn: async () => { const { data, error } = await supabase.from("sto_ship_sources" as never).select("id,sto_ship_id,source_name,source_type,bundle_id,account_unlock").order("source_name"); if (error) throw error; return (data ?? []) as any[]; } });
  const bundles = useQuery({ queryKey: ["sto_ship_bundles"], queryFn: async () => { const { data, error } = await supabase.from("sto_ship_bundles" as never).select("id,name,availability_status,account_unlock,price_currency,price_amount,sto_ship_bundle_items(sto_ship_id,quantity,account_unlock,sto_ships(name))").order("name"); if (error) throw error; return (data ?? []) as any[]; } });
  const fleet = useQuery({ queryKey: ["user_ships"], queryFn: async () => { const { data, error } = await supabase.from("user_ships").select("*, characters(id,name), sto_ships(id,name,ship_class,faction)").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as unknown as FleetShip[]; } });

  const owned = useMemo(() => (fleet.data ?? []).filter((s) => s.ownership_status === "owned"), [fleet.data]);
  const buildQueue = useMemo(() => owned.filter((s) => (s.usage_mode ?? "build_pending") === "build_pending" && !s.current_build_id), [owned]);
  const consoleTraitOnly = useMemo(() => owned.filter((s) => ["console_trait_only", "collection_only"].includes(s.usage_mode ?? "")), [owned]);
  const visibleCatalog = useMemo(() => { const q = catalogSearch.trim().toLowerCase(); return (catalog.data ?? []).filter((s) => !q || `${s.name} ${s.ship_class ?? ""} ${s.faction ?? ""}`.toLowerCase().includes(q)).slice(0, 80); }, [catalog.data, catalogSearch]);
  const visibleBuildQueue = useMemo(() => { const q = buildSearch.trim().toLowerCase(); return buildQueue.filter((s) => `${s.custom_name} ${s.sto_ships?.name ?? ""} ${s.characters?.name ?? ""}`.toLowerCase().includes(q)); }, [buildQueue, buildSearch]);

  const claim = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    if (!claimCharacter) throw new Error("Choose the character receiving the claim.");
    if (!selectedCatalog.length) throw new Error("Select at least one ship.");

    const selectedSources = selectedCatalog.map((sto_ship_id) => ({
      sto_ship_id,
      source: (sources.data ?? []).find((s:any) =>
        s.sto_ship_id === sto_ship_id &&
        (
          String(s.source_type ?? "").toLowerCase().replace(/[_-]/g, " ") === claimSource.toLowerCase() ||
          String(s.source_name ?? "").toLowerCase().includes(claimSource.toLowerCase())
        )
      )
    }));
    const allCharacterIds = (characters.data ?? []).map((c) => c.id);
    const targetByShip = new Map<string, string[]>(
      selectedSources.map(({ sto_ship_id, source }: any) => [
        sto_ship_id,
        source?.account_unlock === true ? allCharacterIds : [claimCharacter],
      ])
    );
    const allTargetCharacters = Array.from(new Set(Array.from(targetByShip.values()).flat()));
    const existingQuery = await supabase.from("user_ships").select("sto_ship_id,character_id,sto_ships(name)").eq("ownership_status","owned").in("character_id", allTargetCharacters).in("sto_ship_id", selectedCatalog);
    if (existingQuery.error) throw existingQuery.error;
    const existing = (existingQuery.data ?? []) as any[];
    const rows = selectedSources.flatMap(({sto_ship_id, source}:any) => {
      const targetCharacters = targetByShip.get(sto_ship_id) ?? [claimCharacter];
      return targetCharacters
        .filter((character_id) => !existing.some((row) => row.character_id === character_id && row.sto_ship_id === sto_ship_id))
        .map((character_id) => ({
          user_id: u.user!.id,
          character_id,
          sto_ship_id,
          ownership_status: "owned",
          acquisition_source_id: source?.id ?? null,
          acquisition_group: claimGroup.trim() || (source?.account_unlock === true ? source?.source_name ?? null : null),
          usage_mode: "build_pending",
          custom_name: null
        }));
    });
    if (!rows.length) throw new Error("The selected ships are already registered for their applicable character scope.");
    const { error } = await supabase.from("user_ships").insert(rows as never[]);
    if (error) throw error;
    const { error: ownershipError } = await supabase.from("sto_ship_ownership" as never).upsert(
      selectedSources.map(({ sto_ship_id, source }: any) => ({
        user_id: u.user!.id,
        sto_ship_id,
        ownership_status: "owned",
        acquisition_source_id: source?.id ?? null,
        notes: claimGroup.trim() ? `Claimed via: ${claimGroup.trim()}` : source?.source_name ? `Claimed via: ${source.source_name}` : null,
      })) as never[],
      { onConflict: "user_id,sto_ship_id" }
    );
    if (ownershipError) throw ownershipError;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); setSelectedCatalog([]); toast.success("Ships added to the character and placed in the build queue."); }, onError: (e: Error) => toast.error(e.message) });
  const claimBundle = useMutation({ mutationFn: async () => {
    if (!claimCharacter) throw new Error("Choose the character receiving the bundle ships.");
    if (!selectedBundle) throw new Error("Choose a bundle.");
    const bundle = (bundles.data ?? []).find((b:any) => b.id === selectedBundle);
    if (!bundle) throw new Error("Bundle not found.");
    const items = (bundle.sto_ship_bundle_items ?? []) as any[];
    if (!items.length) throw new Error("This bundle has no ship items registered.");
    const accountWide = bundle.account_unlock === true;
    const targetCharacters = accountWide ? (characters.data ?? []).map((c) => c.id) : [claimCharacter];
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in.");

    const shipIds = items.map((i:any) => i.sto_ship_id);
    const existingQuery = await supabase.from("user_ships").select("sto_ship_id,character_id").eq("ownership_status","owned").in("character_id", targetCharacters).in("sto_ship_id", shipIds);
    if (existingQuery.error) throw existingQuery.error;
    const existing = (existingQuery.data ?? []) as any[];
    const rows = items.flatMap((item:any) => {
      const source = (sources.data ?? []).find((s:any) => s.bundle_id === selectedBundle && s.sto_ship_id === item.sto_ship_id);
      return targetCharacters
        .filter((character_id) => !existing.some((row) => row.character_id === character_id && row.sto_ship_id === item.sto_ship_id))
        .map((character_id) => ({
          user_id: u.user!.id,
          character_id,
          sto_ship_id: item.sto_ship_id,
          custom_name: null,
          ownership_status: "owned",
          acquisition_source_id: source?.id ?? null,
          acquisition_group: bundle.name,
          usage_mode: "build_pending"
        }));
    });
    if (!rows.length) throw new Error(accountWide ? "This account-unlocked bundle is already registered on every character." : "The bundle ships are already registered on this character.");
    const { error } = await supabase.from("user_ships").insert(rows as never[]);
    if (error) throw error;

    const { error: ownershipError } = await supabase.from("sto_ship_ownership" as never).upsert(
      items.map((item:any) => ({
        user_id: u.user!.id,
        sto_ship_id: item.sto_ship_id,
        ownership_status: "owned",
        acquisition_source_id: (sources.data ?? []).find((s:any) => s.bundle_id === selectedBundle && s.sto_ship_id === item.sto_ship_id)?.id ?? null,
        notes: `Claimed via bundle: ${bundle.name}`
      })) as never[],
      { onConflict: "user_id,sto_ship_id" }
    );
    if (ownershipError) throw ownershipError;
    return rows.length;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); qc.invalidateQueries({ queryKey: ["sto_ship_ownership"] }); setSelectedBundle(""); toast.success("Bundle ships claimed and added to the selected character."); }, onError: (e: Error) => toast.error(e.message) });
  const setUsage = useMutation({ mutationFn: async ({ id, mode }: { id: string; mode: string }) => { const { error } = await supabase.from("user_ships").update({ usage_mode: mode } as never).eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); qc.invalidateQueries({ queryKey: ["build_readiness"] }); }, onError: (e: Error) => toast.error(e.message) });
  const createBuild = useMutation({ mutationFn: async (ship: FleetShip) => { const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Not signed in"); const shipName = ship.custom_name || ship.sto_ships?.name || "Ship";
if (ship.ownership_status !== "owned" || !ship.character_id) throw new Error("Only a character-owned ship can become a build.");
const { data: existing } = await supabase.from("builds").select("id").eq("user_ship_id", ship.id).maybeSingle();
if (existing?.id) throw new Error("This ship already has a build.");
const { data: build, error } = await supabase.from("builds").insert({ user_id: u.user.id, name: `${shipName} — New Build`, user_ship_id: ship.id, character_id: ship.character_id, build_domain: "space", role: null, status: "draft", notes: "Build created from the ship planner. Define the ship's role, theme and full loadout here." } as never).select("id").single();
if (error) throw error;
const { error: linkError } = await supabase.from("user_ships").update({ current_build_id: build.id, usage_mode: "build_created" } as never).eq("id", ship.id);
if (linkError) throw linkError; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["user_ships"] }); qc.invalidateQueries({ queryKey: ["builds"] }); toast.success("Build shell created. Finish it in Builds."); }, onError: (e: Error) => toast.error(e.message) });

  return <AppShell title="Ship Planner" subtitle="Claims, character ownership and build intent"><div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3"><div className="panel p-4"><p className="lcars-label">Owned ships</p><p className="font-display text-2xl text-primary">{new Set(owned.map((s) => s.sto_ship_id).filter(Boolean)).size}</p><p className="text-xs text-muted-foreground">unique vessels across all characters</p></div><div className="panel p-4"><p className="lcars-label">Build queue</p><p className="font-display text-2xl text-primary">{buildQueue.length}</p><p className="text-xs text-muted-foreground">need a build decision</p></div><div className="panel p-4"><p className="lcars-label">Console / trait only</p><p className="font-display text-2xl text-primary">{consoleTraitOnly.length}</p><p className="text-xs text-muted-foreground">intentionally no ship build</p></div></div>
    <section className="panel p-4 sm:p-5"><div className="flex items-start gap-3"><PackagePlus className="mt-1 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="lcars-label">Claim Zen / bundle ships</p><h2 className="font-display text-xl text-primary">Add claimed ships to a character</h2><p className="mt-1 text-sm text-muted-foreground">Select one character and one or more catalogue ships. Every new claim becomes an owned personal ship and enters the build decision queue.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="space-y-1"><Label>Character</Label><Select value={claimCharacter} onValueChange={setClaimCharacter}><SelectTrigger><SelectValue placeholder="Choose character" /></SelectTrigger><SelectContent>{(characters.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Acquisition</Label><Select value={claimSource} onValueChange={setClaimSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACQUISITION_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Bundle / group (optional)</Label><Input value={claimGroup} onChange={(e) => setClaimGroup(e.target.value)} placeholder="e.g. 16th Anniversary Bundle" /></div></div><div className="mt-4 rounded border border-primary/20 bg-primary/5 p-3"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Claim a whole bundle</Label><Select value={selectedBundle} onValueChange={setSelectedBundle}><SelectTrigger><SelectValue placeholder="Choose bundle" /></SelectTrigger><SelectContent>{(bundles.data ?? []).map((b:any)=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button variant="outline" disabled={!claimCharacter || !selectedBundle || claimBundle.isPending} onClick={() => claimBundle.mutate()}><PackagePlus className="mr-1 size-4" />{claimBundle.isPending ? "Claiming…" : "Claim bundle ships"}</Button></div></div>{selectedBundle && <p className="mt-2 text-xs text-muted-foreground">{((bundles.data ?? []).find((b:any)=>b.id===selectedBundle)?.sto_ship_bundle_items ?? []).map((i:any)=>i.sto_ships?.name).filter(Boolean).join(" · ")}</p>}</div><div className="mt-4 space-y-2"><Label>Individual ships to claim</Label><Input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Search ship name, class or faction…" /><div className="max-h-64 space-y-1 overflow-y-auto rounded border border-border p-1">{visibleCatalog.map((ship) => { const checked = selectedCatalog.includes(ship.id); return <label key={ship.id} className={`flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-sm ${checked ? "bg-primary/10" : "hover:bg-muted"}`}><Checkbox checked={checked} onCheckedChange={(v) => setSelectedCatalog((current) => v ? [...new Set([...current, ship.id])] : current.filter((id) => id !== ship.id))} /><span className="min-w-0 flex-1"><span className="font-medium text-primary">{ship.name}</span><span className="ml-2 text-xs text-muted-foreground">{[ship.ship_class, ship.faction].filter(Boolean).join(" · ")}</span></span></label>; })}{!visibleCatalog.length && <p className="p-3 text-sm text-muted-foreground">No catalogue ships match.</p>}</div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{selectedCatalog.length} ship{selectedCatalog.length === 1 ? "" : "s"} selected</p><Button disabled={!claimCharacter || !selectedCatalog.length || claim.isPending} onClick={() => claim.mutate()}><PackagePlus className="mr-1 size-4" />{claim.isPending ? "Adding…" : "Add claimed ships"}</Button></div></div></div></section>
    <section className="panel p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="lcars-label">Build decision queue</p><h2 className="font-display text-xl text-primary">Every owned ship gets a build question</h2><p className="mt-1 text-sm text-muted-foreground">Ships stay in this queue until you either create a build or explicitly mark them as console/trait-only.</p></div><div className="w-full sm:w-72"><Input value={buildSearch} onChange={(e) => setBuildSearch(e.target.value)} placeholder="Filter ships…" /></div></div><div className="mt-4 space-y-2">{visibleBuildQueue.map((ship) => <div key={ship.id} className="rounded border border-border bg-muted/20 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium text-primary">{ship.custom_name || ship.sto_ships?.name || "Unnamed ship"}</p><p className="truncate text-xs text-muted-foreground">{ship.sto_ships?.name ?? "Unknown ship"} · {ship.characters?.name ?? "No character"}</p><div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="outline">Build decision needed</Badge>{ship.acquisition_source_id && <Badge variant="outline">Acquisition recorded</Badge>}{ship.acquisition_group && <Badge variant="outline">{ship.acquisition_group}</Badge>}</div></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => createBuild.mutate(ship)} disabled={createBuild.isPending}><Wrench className="mr-1 size-4" /> Make a build</Button><Button size="sm" variant="outline" onClick={() => setUsage.mutate({ id: ship.id, mode: "console_trait_only" })} disabled={setUsage.isPending}>Console / trait only</Button><Button size="sm" variant="ghost" onClick={() => setUsage.mutate({ id: ship.id, mode: "collection_only" })} disabled={setUsage.isPending}>Collection only</Button></div></div></div>)}{visibleBuildQueue.length === 0 && <div className="rounded border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><Check className="mr-2 inline size-4 text-primary" />No owned ships are waiting for a build decision.</div>}</div></section>
    <section className="panel p-4 sm:p-5"><div className="flex items-center gap-3"><ClipboardList className="size-5 text-primary" /><div><p className="lcars-label">Intentional non-build ships</p><p className="text-sm text-muted-foreground">These remain fully registered on their character without creating a fake or unwanted ship build.</p></div></div><div className="mt-4 space-y-2">{consoleTraitOnly.map((ship) => <div key={ship.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-muted/20 p-3"><div><p className="font-medium text-primary">{ship.custom_name || ship.sto_ships?.name || "Unnamed ship"}</p><p className="text-xs text-muted-foreground">{ship.sto_ships?.name ?? "Unknown ship"} · {ship.characters?.name ?? "No character"}</p></div><Button size="sm" variant="outline" onClick={() => setUsage.mutate({ id: ship.id, mode: "build_pending" })}>Ask for build again</Button></div>)}{consoleTraitOnly.length === 0 && <p className="text-sm text-muted-foreground">None marked yet.</p>}</div></section>
    <section className="panel p-4"><div className="flex items-center gap-3"><Rocket className="size-5 text-primary" /><div><p className="lcars-label">How this works</p><p className="text-sm text-muted-foreground">Claims are attached to the selected character. Build intent is stored on each personal ship, so a ship used only to unlock a console or trait does not create a pointless build record.</p></div></div></section>
  </div></AppShell>;
}
