import { getThemePreset } from "@/lib/theme-presets";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { GroundBuildSection } from "@/components/ground-build-section";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Build = Tables<"builds"> & { user_ship_id?: string | null };
type Ship = Tables<"ship_instances">;
type Character = Tables<"characters">;
type Loadout = { id: string; user_id: string; build_id: string; name: string; notes: string | null; is_active: boolean; created_at: string; updated_at: string };
type FleetShip = Tables<"user_ships"> & { sto_ships: { name: string } | null; characters: Character | null };

export const Route = createFileRoute("/_authenticated/builds")({
  head: () => ({ meta: [{ title: "Builds — STO Command Center" }, { name: "description", content: "Create and manage ship builds, variants and build status." }] }),
  component: BuildsPage,
});

function BuildsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Build | null>(null);
  const loadouts = useQuery({ queryKey: ["loadouts"], queryFn: async () => { const { data, error } = await supabase.from("loadouts" as never).select("*").order("updated_at", { ascending: false }); if (error) throw error; return data as Loadout[]; } });
  const builds = useQuery({ queryKey: ["builds"], queryFn: async () => { const { data, error } = await supabase.from("builds").select("*, ship_instances!builds_ship_instance_id_fkey(*, characters(*)), user_ships!builds_user_ship_id_fkey(id,custom_name,character_id,sto_ship_id,current_build_id,characters(name),sto_ships(name))").order("updated_at", { ascending: false }); if (error) throw error; return data as unknown as (Build & { ship_instances: Ship & { characters: Character | null } | null })[]; } });
  const characters = useQuery({ queryKey: ["characters"], queryFn: async () => { const { data, error } = await supabase.from("characters").select("*").order("name"); if (error) throw error; return (data ?? []) as Character[]; } });
  const ownedShips = useQuery({ queryKey: ["build_owned_ships"], queryFn: async () => { const { data, error } = await supabase.from("user_ships").select("id,custom_name,character_id,current_build_id,sto_ship_id,ownership_status,characters(name),sto_ships(name)").eq("ownership_status","owned").order("custom_name"); if (error) throw error; return (data ?? []) as any[]; } });
  const ships = useQuery({ queryKey: ["ship_instances"], queryFn: async () => { const { data, error } = await supabase.from("ship_instances").select("*, characters(*)").order("name"); if (error) throw error; return data as unknown as (Ship & { characters: Character | null })[]; } });
  const fleetLinks = useQuery({ queryKey: ["build-fleet-links"], queryFn: async () => { const { data, error } = await supabase.from("user_ships").select("id,current_build_id,custom_name,sto_ships(name),characters(name)").not("current_build_id","is",null); if (error) throw error; return data ?? []; } });
  const fleetByBuild = useMemo(() => new Map((fleetLinks.data ?? []).map((s:any) => [s.current_build_id, s])), [fleetLinks.data]);
  const filtered = useMemo(() => (builds.data ?? []).filter(b => {
    const fleet = (b as any).user_ships;
    const haystack = `${b.name} ${b.role ?? ""} ${b.status ?? ""} ${fleet?.custom_name ?? ""} ${fleet?.sto_ships?.name ?? ""} ${fleet?.characters?.name ?? ""} ${b.ship_instances?.name ?? ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  }), [builds.data, q]);

  const remove = useMutation({ mutationFn: async (id: string) => {
    const { error: unlinkError } = await supabase.from("user_ships").update({ current_build_id: null, usage_mode: "build_pending" } as never).eq("current_build_id", id);
    if (unlinkError) throw unlinkError;
    const { error } = await supabase.from("builds").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["builds"] }); qc.invalidateQueries({ queryKey: ["user_ships"] }); toast.success("Build deleted and ship returned to the build queue"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) });

  return <AppShell title="Builds" subtitle="Ship build configurations"><div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="lcars-label">Build library</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Builds</h2></div><Button onClick={() => { setSelected(null); setOpen(true); }} className="glow-primary"><Plus className="mr-1 size-4" /> New build</Button></div>
    <div className="panel p-4"><div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search builds, roles or ships…" value={q} onChange={e => setQ(e.target.value)} /></div></div>
    {builds.isError ? <div className="panel p-6 text-center text-destructive">Unable to load the build library. Refresh and try again.<div className="mt-2 text-xs text-muted-foreground">{builds.error instanceof Error ? builds.error.message : "The build query returned an error."}</div></div> : builds.isLoading ? <p className="text-muted-foreground">Loading build library…</p> : filtered.length === 0 ? <div className="panel p-8 text-center text-muted-foreground"><Wrench className="mx-auto mb-2 size-8 text-primary" />{builds.data?.length ? "No builds match your search." : "No builds yet. Create one and attach it to a ship."}</div> :
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(b => <button key={b.id} onClick={() => { setSelected(b); setOpen(true); }} className="panel p-5 text-left transition hover:border-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{(b as any).user_ships?.sto_ships?.name ?? (b as any).user_ships?.custom_name ?? b.ship_instances?.name ?? "Unassigned ship"}</p><h3 className="font-display text-xl text-primary">{b.name}</h3>{fleetByBuild.get(b.id) && <p className="mt-1 text-xs text-accent">Fleet ship: {fleetByBuild.get(b.id)?.custom_name || fleetByBuild.get(b.id)?.sto_ships?.name || "Assigned ship"}{fleetByBuild.get(b.id)?.characters?.name ? " • "+fleetByBuild.get(b.id)?.characters?.name : ""}</p>}</div><Wrench className="size-5 text-accent" /></div><div className="mt-3 flex flex-wrap gap-2">{b.role && <Badge variant="outline">{b.role}</Badge>}<Badge variant="secondary">{b.status}</Badge>{(b as any).archived && <Badge variant="outline">ARCHIVED</Badge>}{Array.isArray((b as any).acquisition_needs) && (b as any).acquisition_needs.length > 0 && <Badge variant="outline">{(b as any).acquisition_needs.length} acquisition needs</Badge>}{((b as any).user_ships?.characters?.name ?? b.ship_instances?.characters?.name) && <Badge variant="outline">{(b as any).user_ships?.characters?.name ?? b.ship_instances?.characters?.name}</Badge>}{(() => { const buildLoadouts = (loadouts.data ?? []).filter((l:any) => l.build_id === b.id); const ready = buildLoadouts.some((l:any) => l.is_active); return <Badge variant="outline" className={ready ? "border-primary/40 text-primary" : ""}>{ready ? "READY" : "Needs loadout"}</Badge>; })()}</div></button>)}</div>}
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><p className="lcars-label">Ready configurations</p><h2 className="font-display text-xl text-primary">Loadouts</h2></div>
        <LoadoutButton builds={builds.data ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["loadouts"] })} />
      </div>
      {loadouts.isLoading ? <p className="text-sm text-muted-foreground">Loading loadouts…</p> : (loadouts.data ?? []).length === 0 ? (
        <div className="panel p-6 text-center text-sm text-muted-foreground">No loadouts yet. Create a build first, then save a named configuration for it.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(loadouts.data ?? []).map(l => {
            const b = builds.data?.find(x => x.id === l.build_id);
            return <LoadoutCard key={l.id} loadout={l} buildName={b?.name ?? "Unknown build"} />;
          })}
        </div>
      )}
    </section>
    <BuildDialog key={selected?.id ?? "new"} open={open} onOpenChange={setOpen} build={selected} ships={ships.data ?? []} fleetShips={ownedShips.data ?? []} characters={characters.data ?? []} onDeleted={() => selected && remove.mutate(selected.id)} />
  </div></AppShell>;
}

function BuildDialog({ open, onOpenChange, build, ships, fleetShips, characters, onDeleted }: { open: boolean; onOpenChange: (v: boolean) => void; build: (Build & { ship_instances: Ship & { characters: Character | null } | null }) | null; ships: (Ship & { characters: Character | null })[]; fleetShips: any[]; characters: Character[]; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(build?.name ?? "");
  const existingFleetShip = fleetShips.find((s) => s.current_build_id === build?.id) ?? (build as any)?.user_ships ?? null;
  const [characterId, setCharacterId] = useState(existingFleetShip?.character_id ?? "__none__");
  const [shipId, setShipId] = useState(build?.ship_instance_id ?? "__none__");
  const [fleetShipId, setFleetShipId] = useState(existingFleetShip?.id ?? "__none__");
  const [role, setRole] = useState(build?.role ?? "");
  const [status, setStatus] = useState(build?.status ?? "draft");
  const [notes, setNotes] = useState(build?.notes ?? "");
  const captainSetup:any=(build as any)?.captain_setup ?? {};
  const [primarySpecialization, setPrimarySpecialization] = useState(captainSetup.primary_specialization ?? "");
  const [secondarySpecialization, setSecondarySpecialization] = useState(captainSetup.secondary_specialization ?? "");
  const [captainAbilityNotes, setCaptainAbilityNotes] = useState(captainSetup.ability_notes ?? "");
  const [acquisitionNeeds, setAcquisitionNeeds] = useState<string[]>(Array.isArray((build as any)?.acquisition_needs) ? (build as any).acquisition_needs : []);
  const [acquisitionNeedInput, setAcquisitionNeedInput] = useState("");
  const [archived, setArchived] = useState(!!(build as any)?.archived);

  const save = useMutation({ mutationFn: async () => {
    const trimmedName = name.trim();
    const { data: u } = await supabase.auth.getUser();
    if (!trimmedName) throw new Error("Enter a build name.");
    if (characterId === "__none__") throw new Error("Choose a character.");
    if (fleetShipId === "__none__") throw new Error("Choose a ship owned by that character.");
    const chosenShip = fleetShips.find((s:any) => s.id === fleetShipId);
    if (!chosenShip || (chosenShip.character_id && chosenShip.character_id !== characterId)) throw new Error("Choose a ship owned by the selected character.");
    // Every owned ship can have a build, including ships primarily kept for a console, trait, or collection. The build can simply document its intended use.
    let effectiveFleetShipId = fleetShipId;
    let buildId = build?.id ?? null;
    if (!chosenShip.character_id) {
      const { data: characterCopy, error: copyLookupError } = await supabase.from("user_ships").select("id,current_build_id").eq("user_id",u.user!.id).eq("character_id",characterId).eq("sto_ship_id",chosenShip.sto_ship_id).maybeSingle();
      if (copyLookupError) throw copyLookupError;
      if (characterCopy) { if (characterCopy.current_build_id && characterCopy.current_build_id !== buildId) throw new Error("That ship is already assigned to another build."); effectiveFleetShipId = characterCopy.id; }
      else { const { data: copied, error: copyError } = await supabase.from("user_ships").insert({ user_id:u.user!.id, character_id:characterId, sto_ship_id:chosenShip.sto_ship_id, custom_name:chosenShip.custom_name ?? null, ownership_status:"owned", usage_mode:"build_pending" } as never).select("id").single(); if (copyError) throw copyError; effectiveFleetShipId = copied.id; }
    }
    const payload = { name: trimmedName, ship_instance_id: shipId === "__none__" ? null : shipId, user_ship_id: effectiveFleetShipId, character_id: characterId, role: role || null, status, notes: notes || null, build_domain: "space", captain_setup: { primary_specialization: primarySpecialization.trim() || null, secondary_specialization: secondarySpecialization.trim() || null, ability_notes: captainAbilityNotes.trim() || null }, acquisition_needs: acquisitionNeeds, archived };
    const otherBuild = fleetShips.find((s:any) => s.id === effectiveFleetShipId && s.current_build_id && s.current_build_id !== buildId);
    if (otherBuild) throw new Error("That ship is already assigned to another build.");
    if (build) {
      const { error } = await supabase.from("builds").update(payload as never).eq("id", build.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("builds").insert({ ...payload, user_id: u.user!.id }).select("id").single();
      if (error) throw error;
      buildId = data.id;
    }
    if (!buildId) throw new Error("Build ID was not available");
    const { error: clearError } = await supabase.from("user_ships").update({ current_build_id: null, usage_mode: "build_pending" } as never).eq("current_build_id", buildId);
    if (clearError) throw clearError;
    if (effectiveFleetShipId !== "__none__") {
      const { error: linkError } = await supabase.from("user_ships").update({ current_build_id: buildId, usage_mode: "build_created" } as never).eq("id", effectiveFleetShipId);
      if (linkError) throw linkError;
    }
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["builds"] }); qc.invalidateQueries({ queryKey: ["user_ships"] }); toast.success(build ? "Build updated" : "Build created"); onOpenChange(false); }, onError: (e: Error) => toast.error(e.message) });

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-primary">{build ? "Edit build" : "New build"}</DialogTitle></DialogHeader>
    <div className="space-y-4">
      <div className="space-y-1"><Label>Character</Label><Select value={characterId} onValueChange={(v) => { setCharacterId(v); setFleetShipId("__none__"); setShipId("__none__"); }}><SelectTrigger><SelectValue placeholder="Choose character" /></SelectTrigger><SelectContent><SelectItem value="__none__">Choose character</SelectItem>{characters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Ship</Label><Select value={fleetShipId} onValueChange={setFleetShipId}><SelectTrigger><SelectValue placeholder="Choose ship" /></SelectTrigger><SelectContent><SelectItem value="__none__">Choose ship</SelectItem>{fleetShips.filter((s:any) => s.character_id === characterId || !s.character_id).map((s:any) => <SelectItem key={s.id} value={s.id}>{s.custom_name || s.sto_ships?.name || "Unnamed ship"}{!s.character_id ? " • Account owned" : ""}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Only ships owned by this character are shown.</p></div>
      <div className="space-y-1"><Label>Build name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elite CSV — Terran" /></div>
      {build?.ship_instance_id && <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Legacy ship link</p><p className="mt-1 text-xs text-muted-foreground">Retained for compatibility; the primary owned ship above is authoritative.</p><div className="mt-2"><Select value={shipId} onValueChange={setShipId}><SelectTrigger><SelectValue placeholder="Legacy ship instance" /></SelectTrigger><SelectContent><SelectItem value="__none__">Clear legacy link</SelectItem>{ships.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.characters?.name ? ` — ${s.characters.name}` : ""}</SelectItem>)}</SelectContent></Select></div></div>}
      <div className="space-y-1"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="CSV, BO, FAW, Science, Carrier…" /></div>
      <div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Captain setup</p><div className="grid gap-2 sm:grid-cols-2"><Input value={primarySpecialization} onChange={e=>setPrimarySpecialization(e.target.value)} placeholder="Primary specialization" /><Input value={secondarySpecialization} onChange={e=>setSecondarySpecialization(e.target.value)} placeholder="Secondary specialization" /></div><Textarea className="mt-2" value={captainAbilityNotes} onChange={e=>setCaptainAbilityNotes(e.target.value)} placeholder="Captain abilities / setup notes…" /></div>
      <div className="space-y-1"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="testing">Testing</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent></Select></div>
      <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Theme rules, target content, gear notes…" /></div>
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">Acquisition needs</p><p className="text-[11px] text-muted-foreground">Track items, traits, ships or resources still required for this build.</p></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)} /> Archived</label></div><div className="mt-2 flex gap-2"><Input value={acquisitionNeedInput} onChange={e=>setAcquisitionNeedInput(e.target.value)} placeholder="e.g. DPRM console" /><Button type="button" size="sm" variant="outline" onClick={()=>{const v=acquisitionNeedInput.trim();if(v&&!acquisitionNeeds.includes(v)){setAcquisitionNeeds([...acquisitionNeeds,v]);setAcquisitionNeedInput("");}}}>Add</Button></div><div className="mt-2 flex flex-wrap gap-1.5">{acquisitionNeeds.map((need,i)=><Badge key={`${need}-${i}`} variant="outline" className="cursor-pointer" onClick={()=>setAcquisitionNeeds(acquisitionNeeds.filter((_,j)=>j!==i))}>{need} ×</Badge>)}</div></div>
    </div>
    <DialogFooter className="gap-2">{build && <Button variant="ghost" className="mr-auto text-destructive" onClick={() => { if (confirm("Delete this build?")) onDeleted(); }}><Trash2 className="mr-1 size-4" /> Delete</Button>}<Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : build ? "Save changes" : "Create build"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}


function LoadoutCard({ loadout, buildName }: { loadout: Loadout; buildName: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(loadout.name);
  const [notes, setNotes] = useState(loadout.notes ?? "");
  const activate = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error: clearError } = await supabase.from("loadouts").update({ is_active: false }).eq("build_id", loadout.build_id).eq("user_id", u.user.id);
      if (clearError) throw clearError;
      const { error } = await supabase.from("loadouts" as never).update({ is_active: true }).eq("id", loadout.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["loadouts"] });
      toast.success("Loadout activated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not activate loadout"); }
    finally { setBusy(false); }
  };
  const saveEdit = async () => {
    const nextName = name.trim();
    if (!nextName) { toast.error("Enter a loadout name."); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: duplicate } = await supabase.from("loadouts").select("id").eq("build_id", loadout.build_id).eq("user_id", u.user.id).eq("name", nextName).neq("id", loadout.id).maybeSingle();
      if (duplicate) throw new Error("A loadout with that name already exists for this build.");
      const { error } = await supabase.from("loadouts" as never).update({ name: nextName, notes: notes.trim() || null }).eq("id", loadout.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["loadouts"] });
      setEditOpen(false);
      toast.success("Loadout updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update loadout"); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete loadout "${loadout.name}"?`)) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error: equipmentError } = await supabase.from("loadout_equipment" as never).delete().eq("loadout_id", loadout.id);
      if (equipmentError) throw equipmentError;
      const { error: traitsError } = await supabase.from("loadout_traits" as never).delete().eq("loadout_id", loadout.id);
      if (traitsError) throw traitsError;
      const { error: boffsError } = await supabase.from("loadout_boffs" as never).delete().eq("loadout_id", loadout.id);
      if (boffsError) throw boffsError;
      const { error } = await supabase.from("loadouts" as never).delete().eq("id", loadout.id).eq("user_id", u.user.id);
      if (error) throw error;
      if (loadout.is_active) {
        const { data: replacement } = await supabase.from("loadouts").select("id").eq("build_id", loadout.build_id).eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (replacement) await supabase.from("loadouts" as never).update({ is_active: true }).eq("id", replacement.id);
      }
      await qc.invalidateQueries({ queryKey: ["loadouts"] });
      toast.success("Loadout deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete loadout"); }
    finally { setBusy(false); }
  };
  return <div className="panel p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><p className="lcars-label">{buildName}</p><h3 className="truncate font-display text-lg text-primary">{loadout.name}</h3></div>
      <div className="flex shrink-0 gap-2">
        {loadout.is_active ? <Badge className="bg-accent text-accent-foreground">ACTIVE</Badge> : <Button size="sm" variant="outline" disabled={busy} onClick={activate}>{busy ? "Activating…" : "Activate"}</Button>}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditOpen(true)}>Edit</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={remove}>Delete</Button>
      </div>
    </div>
    {loadout.notes && <p className="mt-2 text-sm text-muted-foreground">{loadout.notes}</p>}
    <LoadoutConfiguration loadoutId={loadout.id} />
    <GroundBuildSection buildId={loadout.build_id} />
    <LoadoutReadiness loadoutId={loadout.id} buildId={loadout.build_id} />
    <ThemeCompliance buildId={build.id} />
    <LoadoutEquipment loadoutId={loadout.id} buildId={loadout.build_id} />
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-primary">Edit loadout</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1"><Label>Loadout name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button><Button disabled={!name.trim() || busy} onClick={saveEdit}>{busy ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function LoadoutButton({ builds, onSaved }: { builds: Build[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [buildId, setBuildId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const trimmedName = name.trim();
  const save = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    if (!buildId) throw new Error("Choose a build.");
    if (!trimmedName) throw new Error("Enter a loadout name.");
    const { data: duplicateName, error: duplicateError } = await supabase.from("loadouts").select("id").eq("build_id", buildId).eq("user_id", u.user.id).eq("name", trimmedName).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicateName) throw new Error("A loadout with that name already exists for this build.");
    const { data: activeLoadout } = await supabase
      .from("loadouts")
      .select("id")
      .eq("build_id", buildId)
      .eq("user_id", u.user.id)
      .eq("is_active", true)
      .maybeSingle();
    const { error } = await supabase.from("loadouts" as never).insert({
      user_id: u.user.id,
      build_id: buildId,
      name: trimmedName,
      is_active: !activeLoadout,
      notes: notes.trim() || null,
    });
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["loadouts"] }); toast.success("Loadout created"); onSaved(); setOpen(false); setBuildId(""); setName(""); setNotes(""); }, onError: (e: Error) => toast.error(e.message) });
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!builds.length}><Plus className="mr-1 size-4" /> New loadout</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-primary">New loadout</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1"><Label>Build</Label><Select value={buildId} onValueChange={setBuildId}><SelectTrigger><SelectValue placeholder="Select a build" /></SelectTrigger><SelectContent>{builds.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Loadout name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elite CSV / Patrol / Theme" /></div>
        <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What makes this configuration different?" /></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!buildId || !name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Create loadout"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}



const LOADOUT_THEME_PRESETS = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Terran Empire" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Romulan" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Hur'q" },
  { id: "10000000-0000-4000-8000-000000000004", name: "Discovery-era Terran" },
  { id: "10000000-0000-4000-8000-000000000005", name: "Canon / Screen Accurate" },
];
function ThemeCompliance({ buildId }: { buildId: string }) {
  const ship = useQuery({
    queryKey: ["theme_compliance_ship", buildId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_ships" as never).select("theme_id,sto_ships(name,faction,ship_class)").eq("current_build_id", buildId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const theme = getThemePreset(ship.data?.theme_id);
  if (!theme) {
    return <div className="mt-3 rounded-lg border border-border/70 bg-background/30 p-3">
      <p className="lcars-label">Theme compliance</p>
      <p className="text-xs text-muted-foreground">No theme is assigned to this ship. Use Themes to establish the identity before judging a build against it.</p>
    </div>;
  }
  const faction = String(ship.data?.sto_ships?.faction ?? "");
  const factionMatch = theme.preferredFactions.some((value) => faction.toLowerCase().includes(value.toLowerCase()));
  return <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
    <div className="flex items-center justify-between gap-3"><p className="lcars-label">Theme compliance · {theme.name}</p><span className={factionMatch ? "text-xs text-accent" : "text-xs text-primary"}>{factionMatch ? "IDENTITY MATCH" : "REVIEW IDENTITY"}</span></div>
    <p className="mt-1 text-xs text-muted-foreground">{theme.identity}</p>
    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{theme.guidance.map((rule) => <li key={rule}>• {rule}</li>)}</ul>
    <p className="mt-2 text-[10px] text-muted-foreground">{faction ? `Ship faction: ${faction}. This is an identity signal only; individual item compliance requires structured catalogue evidence.` : "Ship faction is not recorded."}</p>
  </div>;
}

function LoadoutReadiness({ loadoutId, buildId }: { loadoutId: string; buildId: string }) {
  const equipment = useQuery({ queryKey: ["readiness_equipment", loadoutId], queryFn: async () => { const {data,error}=await supabase.from("loadout_equipment" as never).select("slot").eq("loadout_id",loadoutId); if(error) throw error; return data ?? []; }});
  const traits = useQuery({ queryKey: ["readiness_traits", loadoutId], queryFn: async () => { const {data,error}=await supabase.from("loadout_traits" as never).select("id,trait_id,trait_type").eq("loadout_id",loadoutId); if(error) throw error; return data ?? []; }});
  const boffs = useQuery({ queryKey: ["readiness_boffs", loadoutId], queryFn: async () => { const {data,error}=await supabase.from("loadout_boffs" as never).select("id,station").eq("loadout_id",loadoutId); if(error) throw error; return data ?? []; }});
  const ship = useQuery({ queryKey: ["readiness_ship", buildId], queryFn: async () => {
    // Use the authoritative Build → User Ship relationship. Older builds may have
    // user_ship_id populated even when current_build_id was never backfilled.
    const { data: build, error: be } = await supabase.from("builds" as never).select("user_ship_id").eq("id", buildId).maybeSingle();
    if (be) throw be;
    if (!build?.user_ship_id) return null;
    const { data, error } = await supabase.from("user_ships" as never).select("character_id,sto_ships(*)").eq("id", build.user_ship_id).maybeSingle();
    if (error) throw error;
    return data as any;
  }});
  const characterTraits = useQuery({ queryKey: ["readiness_character_traits", buildId, ship.data?.character_id], enabled: !!ship.data?.character_id, queryFn: async () => {
    const {data,error}=await supabase.from("character_traits" as never).select("id,trait_id,domain,trait_category,active").eq("character_id",ship.data.character_id).eq("active",true);
    if(error) throw error; return data ?? [];
  }});
  const s:any=ship.data?.sto_ships||{};
  const stationNames = (() => { const raw=s.bridge_officer_seating ?? s.bridge_officer_stations; if(Array.isArray(raw)) return raw.map((x:any)=>typeof x==="string"?x:(x?.station||x?.name)).filter(Boolean).map(String); if(raw && typeof raw==="object") return Object.keys(raw); return []; })();
  const configuredStations = new Set(((boffs.data as any[])||[]).map(x=>String(x.station||"").trim().toLowerCase()).filter(Boolean));
  const missingStations = stationNames.filter(x=>!configuredStations.has(x.toLowerCase()));
  const slots:string[]=[]; const add=(label:string,n:number)=>{for(let i=1;i<=Number(n||0);i++)slots.push(label+" "+i);};
  add("Fore Weapon",s.fore_weapon_slots); add("Aft Weapon",s.aft_weapon_slots); if(s.experimental_weapon_slot) slots.push("Experimental Weapon");
  add("Engineering Console",s.engineering_console_slots); add("Science Console",s.science_console_slots); add("Tactical Console",s.tactical_console_slots); add("Universal Console",s.universal_console_slots); add("Hangar Bay",s.hangar_bays);
  slots.push("Deflector","Impulse Engines","Warp Core","Shields");
  const assignedSlots=Array.from(new Set(((equipment.data as any[])||[]).map(x=>String(x.slot||"")).filter(Boolean)));
  const missingSlots=slots.filter(x=>!assignedSlots.includes(x)); const expected=slots.length; const filled=slots.filter(x=>assignedSlots.includes(x)).length;
  const shipTraitCount=(traits.data as any[]||[]).filter(x=>x.trait_type==="starship").length;
  const personalSpaceCount=(characterTraits.data as any[]||[]).filter(x=>String(x.domain)==="space").length;
  const personalGroundCount=(characterTraits.data as any[]||[]).filter(x=>String(x.domain)==="ground").length;
  const checks=[{label:"Ship systems",ok:["Deflector","Impulse Engines","Warp Core","Shields"].every(x=>assignedSlots.includes(x))},{label:"Weapons / consoles / hangars",ok:expected===0||missingSlots.length===0},{label:"Space traits",ok:shipTraitCount>0&&personalSpaceCount>0},{label:"Bridge officers",ok:stationNames.length===0 ? (boffs.data as any[]||[]).length>0 : missingStations.length===0}];
  const score=Math.round(checks.filter(x=>x.ok).length/checks.length*100);
  return <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loadout Readiness</p><p className="text-xs text-muted-foreground">Completeness check — not a DPS rating</p></div><span className="text-lg font-bold text-primary">{score}%</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{checks.map(x=><div key={x.label} className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-sm"><span>{x.label}</span><span className={x.ok?"text-primary":"text-muted-foreground"}>{x.ok?"READY":"MISSING"}</span></div>)}</div>{missingSlots.length>0&&<p className="mt-2 text-xs text-muted-foreground">Missing fitting slots: {missingSlots.join(", ")} · {filled}/{expected} valid slots filled</p>}{missingStations.length>0&&<p className="mt-2 text-xs text-muted-foreground">Missing bridge officer stations: {missingStations.join(", ")}</p>}{(personalSpaceCount===0||personalGroundCount===0)&&<p className="mt-2 text-xs text-muted-foreground">Character traits: {personalSpaceCount} active Space · {personalGroundCount} active Ground. Ground traits are tracked separately and do not substitute for Space traits in a ship build.</p>}</div>;
}

function LoadoutConfiguration({ loadoutId }: { loadoutId: string }) {
  const qc = useQueryClient();
  const shipContext = useQuery({ queryKey: ["loadout_ship_context", loadoutId], queryFn: async () => {
    const { data: loadout, error: le } = await supabase.from("loadouts" as never).select("build_id").eq("id", loadoutId).single();
    if (le) throw le;
    const { data: build, error: be } = await supabase.from("builds").select("user_ship_id").eq("id", loadout.build_id).single();
    if (be) throw be;
    if (!build?.user_ship_id) return null;
    const { data: us, error: ue } = await supabase.from("user_ships").select("character_id,sto_ship_id,characters(name),sto_ships(name,ship_trait,special_console)").eq("id", build.user_ship_id).single();
    if (ue) throw ue;
    if (!us?.character_id) return null;
    const { data: owned, error: oe } = await supabase.from("user_ships").select("sto_ship_id,sto_ships(name,ship_trait,special_console)").eq("character_id", us.character_id).eq("ownership_status","owned");
    if (oe) throw oe;
    const unlocks = (owned ?? []).flatMap((x:any) => {
      const s=x.sto_ships ?? {};
      return [{type:"trait",name:s.ship_trait,ship:s.name},{type:"console",name:s.special_console,ship:s.name}].filter((u:any)=>u.name);
    });
    return { characterId: us.character_id, characterName: us.characters?.name ?? "", shipName: us.sto_ships?.name ?? "", unlocks };
  }});
  const traits = useQuery({ queryKey: ["loadout_traits", loadoutId], queryFn: async () => {
    const { data, error } = await supabase.from("loadout_traits" as never).select("*").eq("loadout_id", loadoutId).order("name");
    if (error) throw error; return data ?? [];
  }});
  const boffs = useQuery({ queryKey: ["loadout_boffs", loadoutId], queryFn: async () => {
    const { data, error } = await supabase.from("loadout_boffs" as never).select("*").eq("loadout_id", loadoutId).order("station");
    if (error) throw error; return data ?? [];
  }});
  const buildContext = useQuery({ queryKey: ["loadout_build_context", loadoutId], queryFn: async () => { const { data, error } = await supabase.from("loadouts" as never).select("build_id").eq("id", loadoutId).single(); if (error) throw error; return data as any; }});
  const dutyOfficers = useQuery({ queryKey: ["build_doffs", buildContext.data?.build_id], enabled: !!buildContext.data?.build_id, queryFn: async () => { const { data, error } = await supabase.from("build_doffs" as never).select("*").eq("build_id", buildContext.data.build_id).order("name"); if (error) throw error; return data ?? []; }});
  const dutyOfficerCatalog = useQuery({ queryKey: ["doff_catalog"], queryFn: async () => { const { data, error } = await supabase.from("doff_catalog" as never).select("*").order("name"); if (error) throw error; return data ?? []; }});
  const boffAbilityCatalog = useQuery({ queryKey: ["boff_ability_catalog"], queryFn: async () => { const { data, error } = await supabase.from("boff_ability_catalog" as never).select("id,name,region,career,description,rank1,rank2,rank3").order("name"); if (error) throw error; return data ?? []; }});

  const traitCatalog = useQuery({ queryKey: ["trait_catalog"], queryFn: async () => {
    const { data, error } = await supabase.from("trait_catalog" as never).select("*").eq("trait_type","starship").eq("domain","space").order("name");
    if (error) throw error; return data ?? [];
  }});
  const characterTraits = useQuery({ queryKey: ["loadout_character_traits", shipContext.data?.characterId], enabled: !!shipContext.data?.characterId, queryFn: async () => {
    const { data, error } = await supabase.from("character_traits" as never)
      .select("id,trait_id,domain,trait_category,slot_index,active,trait_catalog(name,trait_type,domain,description)")
      .eq("character_id", shipContext.data?.characterId ?? "")
      .eq("active", true)
      .order("domain")
      .order("slot_index");
    if (error) throw error; return (data ?? []) as any[];
  }});
  const [trait, setTrait] = useState("");
  const [traitSearch, setTraitSearch] = useState("");
  const [traitType, setTraitType] = useState("starship");
  const [traitId, setTraitId] = useState("");
  const [station, setStation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [abilities, setAbilities] = useState("");
  const [officer, setOfficer] = useState("");
  const [dutyOfficerId, setDutyOfficerId] = useState("");
  const [dutyOfficerSearch, setDutyOfficerSearch] = useState("");
  const [boffAbilitySearch, setBoffAbilitySearch] = useState("");
  const addTrait = async () => {
    const picked:any = (traitCatalog.data as any[] || []).find((t:any) => t.id === traitId);
    const name = picked?.name || trait.trim();
    if (!name) return;
    if (picked && picked.trait_type !== "starship") {
      toast.error("Personal, species and reputation traits belong to the character trait roster, not the ship loadout.");
      return;
    }
    if (!picked && traitType !== "starship") {
      toast.error("Only starship traits can be assigned to a ship loadout.");
      return;
    }
    const { error } = await supabase.from("loadout_traits" as never).insert({
      loadout_id: loadoutId, trait_id: picked?.id || null, name, trait_type: "starship", slot: picked?.domain || "space", domain: "space", trait_category: "starship"
    });
    if (error) { toast({ title: "Could not add trait", description: error.message, variant: "destructive" }); return; }
    setTrait(""); setTraitId(""); qc.invalidateQueries({ queryKey: ["loadout_traits", loadoutId] });
  };
  const addConsole = async (consoleName: string, sourceShip: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !shipContext.data?.characterId || !consoleName.trim()) return;
    const { data: existing, error: findError } = await supabase.from("equipment_items" as never)
      .select("id").eq("user_id", u.user.id).eq("character_id", shipContext.data.characterId).eq("name", consoleName.trim()).eq("category", "Console").maybeSingle();
    if (findError) { toast.error(findError.message); return; }
    if (existing) { toast.info(`${consoleName} is already in character equipment`); return; }
    const { error } = await supabase.from("equipment_items" as never).insert({
      user_id: u.user.id, character_id: shipContext.data.characterId, name: consoleName.trim(),
      category: "Console", slot: "Universal Console", notes: `Unlocked from owned ship: ${sourceShip}`,
    });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["equipment_items"] });
    toast.success(`${consoleName} added to character equipment`);
  };
  const saveOfficer = async () => {
    if (!station.trim()) return;
    const { error } = await supabase.from("loadout_boffs" as never).upsert({ loadout_id: loadoutId, station: station.trim(), officer_name: officer.trim() || null, specialization: specialization.trim() || null, abilities: abilities.split(",").map((x) => x.trim()).filter(Boolean) });
    if (error) { toast({ title: "Could not save officer", description: error.message, variant: "destructive" }); return; }
    setStation(""); setOfficer(""); setSpecialization(""); setAbilities(""); qc.invalidateQueries({ queryKey: ["loadout_boffs", loadoutId] });
  };
  const saveDutyOfficer = async () => {
    const picked:any = (dutyOfficerCatalog.data as any[] || []).find((d:any) => d.id === dutyOfficerId);
    if (!picked) return;
    if (!buildContext.data?.build_id) return;
    const { error } = await supabase.from("build_doffs" as never).insert({ build_id: buildContext.data.build_id, doff_id: picked.id, name: picked.name, department: picked.department || null, specialization: picked.specialization || null, assignment: picked.domain || null });
    if (error) { toast({ title: "Could not save duty officer", description: error.message, variant: "destructive" }); return; }
    setDutyOfficerId(""); qc.invalidateQueries({ queryKey: ["build_doffs", buildContext.data?.build_id] });
  };
  const remove = async (table: string, id: string, key: string) => {
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (!error) qc.invalidateQueries({ queryKey: [key, loadoutId] });
  };
  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-border/70 bg-background/30 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Traits</p>
        {shipContext.data?.unlocks.filter((u:any)=>u.type==="trait").length ? <div className="mb-3 rounded border border-primary/20 bg-primary/5 p-2"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Starship traits unlocked by {shipContext.data.characterName}</p><div className="flex flex-wrap gap-1">{shipContext.data.unlocks.filter((u:any)=>u.type==="trait").map((u:any,i:number)=><button type="button" key={i} onClick={()=>{setTrait(u.name);setTraitType("starship");}} className="rounded border border-border px-2 py-1 text-xs hover:border-primary">{u.name} <span className="text-muted-foreground">({u.ship})</span></button>)}</div></div> : null}
        {shipContext.data?.unlocks.filter((u:any)=>u.type==="console").length ? <div className="mb-3 rounded border border-accent/20 bg-accent/5 p-2"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">Ship consoles unlocked by {shipContext.data.characterName}</p><div className="space-y-1">{shipContext.data.unlocks.filter((u:any)=>u.type==="console").map((u:any,i:number)=><div key={i} className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5 text-xs"><span><span className="text-primary">{u.name}</span> <span className="text-muted-foreground">from {u.ship}</span></span><Button type="button" size="sm" variant="outline" onClick={() => addConsole(u.name, u.ship)}>Add to character</Button></div>)}</div></div> : null}
        <Input value={traitSearch} onChange={(e) => setTraitSearch(e.target.value)} placeholder="Search starship traits…" className="mb-2 h-9" />
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <select value={traitId} onChange={(e) => {
            const id=e.target.value; setTraitId(id);
            const picked:any=(traitCatalog.data as any[] || []).find((t:any)=>t.id===id);
            if(picked){setTrait(picked.name);setTraitType(picked.trait_type || "other");}
          }} className="h-9 rounded-md border bg-background px-2 text-xs">
            <option value="">Select catalogue trait</option>
            {((traitCatalog.data as any[]) || []).filter((t:any) => !traitSearch.trim() || t.name.toLowerCase().includes(traitSearch.trim().toLowerCase()) || String(t.description ?? "").toLowerCase().includes(traitSearch.trim().toLowerCase())).map((t:any) => <option key={t.id} value={t.id}>[{t.trait_type}] {t.name}</option>)}
          </select>
          <select value="starship" onChange={() => setTraitType("starship")} className="h-9 rounded-md border bg-background px-2 text-xs" aria-label="Trait type">
            <option value="starship">Starship trait only</option>
          </select>
          <Button size="sm" onClick={addTrait} disabled={!trait.trim()}>Add</Button>
        </div>
        <Input value={trait} onChange={(e) => setTrait(e.target.value)} placeholder="Manual trait name (if not in catalogue)" className="mt-2 h-9" />
        <div className="mt-2 space-y-1">{((traits.data as any[]) || []).map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-sm"><span>{t.name}<span className="ml-2 text-xs text-muted-foreground">Starship</span></span><Button variant="ghost" size="icon" onClick={() => remove("loadout_traits", t.id, "loadout_traits")}><Trash2 className="h-3.5 w-3.5" /></Button></div>
        ))}</div>
        <div className="mt-3 rounded border border-accent/20 bg-accent/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Character personal traits</p>
          <p className="mt-1 text-xs text-muted-foreground">Personal Space and Ground traits are owned by the captain and are tracked separately from starship traits.</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div><p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Space</p><div className="space-y-1">{(characterTraits.data ?? []).filter((t:any)=>t.domain==="space").map((t:any)=><div key={t.id} className="rounded border border-border px-2 py-1.5 text-xs">{t.trait_catalog?.name ?? "Unnamed trait"}{t.slot_index != null ? " • Slot " + t.slot_index : ""}</div>)}{!(characterTraits.data ?? []).some((t:any)=>t.domain==="space")&&<div className="rounded border border-dashed p-2 text-xs text-muted-foreground">No personal Space traits assigned.</div>}</div></div>
            <div><p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Ground</p><div className="space-y-1">{(characterTraits.data ?? []).filter((t:any)=>t.domain==="ground").map((t:any)=><div key={t.id} className="rounded border border-border px-2 py-1.5 text-xs">{t.trait_catalog?.name ?? "Unnamed trait"}{t.slot_index != null ? " • Slot " + t.slot_index : ""}</div>)}{!(characterTraits.data ?? []).some((t:any)=>t.domain==="ground")&&<div className="rounded border border-dashed p-2 text-xs text-muted-foreground">No personal Ground traits assigned.</div>}</div></div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border/70 bg-background/30 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bridge Officers</p>
        <div className="grid gap-2 sm:grid-cols-2"><Input value={station} onChange={(e) => setStation(e.target.value)} placeholder="Station" className="h-9" /><Input value={officer} onChange={(e) => setOfficer(e.target.value)} placeholder="Officer name" className="h-9" /><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Specialization" className="h-9" /><Input value={abilities} onChange={(e) => setAbilities(e.target.value)} placeholder="Abilities, comma separated" className="h-9 sm:col-span-2" />
          <div className="sm:col-span-2"><Input value={boffAbilitySearch} onChange={e=>setBoffAbilitySearch(e.target.value)} placeholder="Search BOFF abilities…" className="h-8" /><div className="mt-1 max-h-28 overflow-y-auto rounded border border-border">{((boffAbilityCatalog.data as any[])||[]).filter((a:any)=>{const q=boffAbilitySearch.trim().toLowerCase();return q&&[a.name,a.region,a.career,a.description].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,15).map((a:any)=><button type="button" key={a.id} className="block w-full px-2 py-1.5 text-left text-xs hover:bg-muted" onClick={()=>{const current=abilities.split(",").map(x=>x.trim()).filter(Boolean);if(!current.includes(a.name))setAbilities([...current,a.name].join(", "));setBoffAbilitySearch("");}}>{a.name}<span className="ml-2 text-muted-foreground">{a.region}{a.career?" • "+a.career:""}</span></button>)}</div></div></div>
        <Button size="sm" className="mt-2" onClick={saveOfficer}>Save Officer</Button>
        <div className="mt-2 space-y-1">{((boffs.data as any[]) || []).map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-sm"><span><span>{b.station}</span><span className="ml-2 text-primary">{b.officer_name || "Unassigned"}</span>{b.specialization && <span className="ml-2 text-xs text-muted-foreground">{b.specialization}</span>}{Array.isArray(b.abilities) && b.abilities.length > 0 && <span className="mt-1 block text-xs text-muted-foreground">{b.abilities.join(" • ")}</span>}</span><Button variant="ghost" size="icon" onClick={() => remove("loadout_boffs", b.id, "loadout_boffs")}><Trash2 className="h-3.5 w-3.5" /></Button></div>
        ))}</div>
      </div>
      <div className="rounded-lg border border-border/70 bg-background/30 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duty Officers</p>
        <p className="mb-2 text-xs text-muted-foreground">Duty Officers belong to the ship build, while your character roster records which officers you own. Space and ground DOffs are kept distinct.</p><Input value={dutyOfficerSearch} onChange={e=>setDutyOfficerSearch(e.target.value)} placeholder="Search Duty Officers…" className="mb-2 h-9" /><Button size="sm" variant="outline" onClick={async()=>{const {error}=await supabase.functions.invoke("sync-doff-catalog",{body:{}});if(error)toast.error(error.message);else{qc.invalidateQueries({queryKey:["doff_catalog"]});toast.success("Duty Officer catalogue synced");}}}>Sync DOff catalogue</Button>
        <div className="flex gap-2">
          <select value={dutyOfficerId} onChange={(e) => setDutyOfficerId(e.target.value)} className="h-9 flex-1 rounded-md border bg-background px-2 text-xs">
            <option value="">Select Duty Officer</option>
            {((dutyOfficerCatalog.data as any[]) || []).filter((d:any)=>{const q=dutyOfficerSearch.trim().toLowerCase();return !q||[d.name,d.department,d.specialization,d.duty_type,d.effect_text,d.ability_text].filter(Boolean).join(" ").toLowerCase().includes(q);}).map((d:any) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` — ${d.department}` : ""}{d.rarity ? ` • ${d.rarity}` : ""}</option>)}
          </select>
          <Button size="sm" onClick={saveDutyOfficer} disabled={!dutyOfficerId}>Assign</Button>
        </div>
        <div className="mt-2 space-y-1">{((dutyOfficers.data as any[]) || []).map((d:any) => (
          <div key={d.id} className="flex items-start justify-between gap-2 rounded border border-border px-2 py-1.5 text-sm">
            <span><span className="text-primary">{d.name}</span>{d.department && <span className="ml-2 text-xs text-muted-foreground">{d.department}</span>}{d.effect_text && <span className="mt-1 block text-xs text-muted-foreground">{d.effect_text}</span>}</span>
            <Button variant="ghost" size="icon" onClick={() => remove("build_doffs", d.id, "build_doffs")}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function LoadoutEquipment({ loadoutId, buildId }: { loadoutId: string; buildId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState("Fore Weapon 1");
  const [equipmentId, setEquipmentId] = useState("");

  const ship = useQuery({
    queryKey: ["loadout_ship", buildId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_ships" as never)
        .select("id,character_id,sto_ship_id,custom_name,sto_ships(*)")
        .eq("current_build_id", buildId)
        .maybeSingle();
      if (error) throw error;
      return (data as any) ?? null;
    },
  });
  const shipData = ship.data?.sto_ships ?? null;
  const shipCharacterId = ship.data?.character_id ?? null;
  const boff = (shipData?.bridge_officer_seating ?? shipData?.bridge_officer_stations ?? {}) as Record<string, unknown>;
  const trait = shipData?.ship_trait as string | null | undefined;
  const special = [shipData?.special_console, shipData?.special_weapons, shipData?.special_mechanics].filter(Boolean) as string[];

  const equipment = useQuery({
    queryKey: ["equipment_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_items" as never).select("*").order("name");
      if (error) throw error; return (data ?? []) as any[];
    },
  });
  const ownedEquipment = useMemo(() => (equipment.data ?? []).filter((e: any) => !e.character_id || e.character_id === shipCharacterId), [equipment.data, shipCharacterId]);

  const assigned = useQuery({
    queryKey: ["loadout_equipment", loadoutId],
    queryFn: async () => {
      const { data, error } = await supabase.from("loadout_equipment" as never).select("*, equipment_items(*)").eq("loadout_id", loadoutId);
      if (error) throw error; return (data ?? []) as any[];
    },
  });

  const slots = (() => {
    const s: any = shipData; const out: string[] = [];
    const add = (label: string, n: number) => { for (let i=1;i<=Number(n||0);i++) out.push(`${label} ${i}`); };
    add("Fore Weapon", s?.fore_weapon_slots); add("Aft Weapon", s?.aft_weapon_slots);
    if (s?.experimental_weapon_slot) out.push("Experimental Weapon");
    add("Engineering Console", s?.engineering_console_slots); add("Science Console", s?.science_console_slots);
    add("Tactical Console", s?.tactical_console_slots); add("Universal Console", s?.universal_console_slots);
    add("Hangar Bay", s?.hangar_bays);
    out.push("Deflector","Impulse Engines","Warp Core","Shields");
    return out;
  })();
  const bySlot = new Map((assigned.data ?? []).map((a:any) => [a.slot, a]));

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("loadout_equipment" as never).upsert(
        { user_id: u.user.id, loadout_id: loadoutId, equipment_id: equipmentId, slot: slot.trim() },
        { onConflict: "loadout_id,slot" }
      );
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loadout_equipment", loadoutId] }); toast.success("Equipment assigned"); setOpen(false); setEquipmentId(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("loadout_equipment" as never).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loadout_equipment", loadoutId] }),
  });

  const groups = [
    ["Weapons", slots.filter(x => x.startsWith("Fore Weapon") || x.startsWith("Aft Weapon") || x === "Experimental Weapon")],
    ["Consoles", slots.filter(x => x.includes("Console"))],
    ["Ship Systems", slots.filter(x => ["Deflector","Impulse Engines","Warp Core","Shields"].includes(x))],
    ["Hangars", slots.filter(x => x.startsWith("Hangar Bay"))],
  ] as const;

  return <div className="mt-4 border-t border-border pt-3">
    <div className="flex items-center justify-between gap-2">
      <div><p className="lcars-label">STO Fitting</p><p className="text-sm text-muted-foreground">{assigned.data?.length ?? 0} / {slots.length} slots filled{shipData?.name ? ` • ${shipData.name}` : ""}</p></div>
      <Button size="sm" variant="outline" onClick={() => { setSlot(slots.find(x => !bySlot.has(x)) ?? slots[0] ?? "Fore Weapon 1"); setOpen(true); }}><Package className="mr-1 size-4" /> Fit gear</Button>
    </div>
    {(Object.keys(boff).length > 0 || trait || special.length > 0) && <div className="mb-3 grid gap-3 sm:grid-cols-2">
      {Object.keys(boff).length > 0 && <div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bridge Officer Stations</p><div className="space-y-1">{Object.entries(boff).map(([station, value]) => <div key={station} className="flex justify-between gap-3 rounded border border-border px-2 py-1.5 text-sm"><span>{station}</span><span className="text-primary">{typeof value === "string" ? value : JSON.stringify(value)}</span></div>)}</div></div>}
      {(trait || special.length > 0) && <div className="rounded-lg border border-border/70 bg-background/30 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ship Identity</p>{trait && <div className="mb-2 rounded border border-primary/30 bg-primary/5 px-2 py-1.5"><span className="text-xs text-muted-foreground">Ship Trait</span><p className="text-sm text-primary">{trait}</p></div>}{special.map((x,i)=><div key={i} className="mb-1 rounded border border-border px-2 py-1.5 text-sm">{x}</div>)}</div>}
    </div>}
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {groups.map(([group, groupSlots]) => groupSlots.length ? <div key={group} className="rounded-lg border border-border/70 bg-background/30 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
        <div className="space-y-1.5">
          {groupSlots.map(x => { const a:any = bySlot.get(x); return <div key={x} className={`flex items-center justify-between gap-2 rounded border px-2.5 py-2 ${a ? "border-primary/40 bg-primary/5" : "border-dashed border-border"}`}>
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{x}</p><p className={`truncate text-sm ${a ? "text-primary" : "text-muted-foreground"}`}>{a?.equipment_items?.name ?? "EMPTY"}</p></div>
            {a && <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)}><Trash2 className="size-3 text-destructive"/></Button>}
          </div>; })}
        </div>
      </div> : null)}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-primary">Fit equipment</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1"><Label>Ship slot</Label><Select value={slot} onValueChange={setSlot}><SelectTrigger><SelectValue placeholder="Select slot"/></SelectTrigger><SelectContent>{slots.map(x=><SelectItem key={x} value={x}>{x}{bySlot.has(x) ? " • occupied" : ""}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Equipment</Label><Select value={equipmentId} onValueChange={setEquipmentId}><SelectTrigger><SelectValue placeholder="Select compatible equipment"/></SelectTrigger><SelectContent>
        {ownedEquipment.filter((e:any) => {
          const isWeapon = slot.includes("Weapon");
          const isConsole = slot.includes("Console");
          const isCore = slot === "Warp Core";
          const isDeflector = slot === "Deflector";
          const isEngine = slot === "Impulse Engines";
          const isShield = slot === "Shields";
          const cat = String(e.category ?? "").toLowerCase();
          const itemSlot = String(e.slot ?? "").toLowerCase();
          if (isWeapon) return cat.includes("weapon") || itemSlot.includes("weapon");
          if (isConsole) return cat.includes("console") || itemSlot.includes("console");
          if (isCore) return cat.includes("warp") || itemSlot.includes("core") || itemSlot.includes("warp");
          if (isDeflector) return cat.includes("deflector") || itemSlot.includes("deflector");
          if (isEngine) return cat.includes("impulse") || itemSlot.includes("engine");
          if (isShield) return cat.includes("shield") || itemSlot.includes("shield");
          if (slot.startsWith("Hangar")) return cat.includes("hangar") || itemSlot.includes("hangar");
          return true;
        }).map((e:any)=><SelectItem key={e.id} value={e.id}>{e.name}{e.mark ? ` — ${e.mark}` : ""}{e.character_id ? " • Character-bound" : " • Account"}</SelectItem>)}
      </SelectContent></Select></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={!slot || !equipmentId || save.isPending} onClick={()=>save.mutate()}>{save.isPending ? "Fitting…" : "Fit equipment"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
