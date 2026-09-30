import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wrench, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Build = Tables<"builds">;
type Ship = Tables<"ship_instances">;
type Character = Tables<"characters">;\ntype Loadout = Tables<"loadouts">;

export const Route = createFileRoute("/_authenticated/builds")({
  head: () => ({ meta: [{ title: "Builds — STO Command Center" }, { name: "description", content: "Create and manage ship builds, variants and build status." }] }),
  component: BuildsPage,
});

function BuildsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Build | null>(null);
  const loadouts = useQuery({ queryKey: ["loadouts"], queryFn: async () => { const { data, error } = await supabase.from("loadouts").select("*").order("updated_at", { ascending: false }); if (error) throw error; return data as Loadout[]; } });\n  const builds = useQuery({ queryKey: ["builds"], queryFn: async () => { const { data, error } = await supabase.from("builds").select("*, ship_instances(*, characters(*))").order("updated_at", { ascending: false }); if (error) throw error; return data as unknown as (Build & { ship_instances: Ship & { characters: Character | null } | null })[]; } });
  const ships = useQuery({ queryKey: ["ship_instances"], queryFn: async () => { const { data, error } = await supabase.from("ship_instances").select("*, characters(*)").order("name"); if (error) throw error; return data as unknown as (Ship & { characters: Character | null })[]; } });
  const filtered = useMemo(() => (builds.data ?? []).filter(b => `${b.name} ${b.role ?? ""} ${b.status ?? ""} ${b.ship_instances?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())), [builds.data, q]);

  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("builds").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["builds"] }); toast.success("Build deleted"); setSelected(null); }, onError: (e: Error) => toast.error(e.message) });

  return <AppShell title="Builds" subtitle="Ship build configurations"><div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="lcars-label">Build library</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Builds</h2></div><Button onClick={() => { setSelected(null); setOpen(true); }} className="glow-primary"><Plus className="mr-1 size-4" /> New build</Button></div>
    <div className="panel p-4"><div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search builds, roles or ships…" value={q} onChange={e => setQ(e.target.value)} /></div></div>
    {builds.isLoading ? <p className="text-muted-foreground">Loading build library…</p> : filtered.length === 0 ? <div className="panel p-8 text-center text-muted-foreground"><Wrench className="mx-auto mb-2 size-8 text-primary" />{builds.data?.length ? "No builds match your search." : "No builds yet. Create one and attach it to a ship."}</div> :
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(b => <button key={b.id} onClick={() => { setSelected(b); setOpen(true); }} className="panel p-5 text-left transition hover:border-primary"><div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{b.ship_instances?.name ?? "Unassigned ship"}</p><h3 className="font-display text-xl text-primary">{b.name}</h3></div><Wrench className="size-5 text-accent" /></div><div className="mt-3 flex flex-wrap gap-2">{b.role && <Badge variant="outline">{b.role}</Badge>}<Badge variant="secondary">{b.status}</Badge>{b.ship_instances?.characters?.name && <Badge variant="outline">{b.ship_instances.characters.name}</Badge>}</div></button>)}</div>}
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
            return <div key={l.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="lcars-label">{b?.name ?? "Unknown build"}</p><h3 className="font-display text-lg text-primary">{l.name}</h3></div>{l.is_active && <Badge className="bg-accent text-accent-foreground">ACTIVE</Badge>}</div>
              {l.notes && <p className="mt-2 text-sm text-muted-foreground">{l.notes}</p>}
              <LoadoutEquipment loadoutId={l.id} buildId={l.build_id} />
            </div>;
          })}
        </div>
      )}
    </section>
    <BuildDialog open={open} onOpenChange={setOpen} build={selected} ships={ships.data ?? []} onDeleted={() => selected && remove.mutate(selected.id)} />
  </div></AppShell>;
}

function BuildDialog({ open, onOpenChange, build, ships, onDeleted }: { open: boolean; onOpenChange: (v: boolean) => void; build: (Build & { ship_instances: Ship & { characters: Character | null } | null }) | null; ships: (Ship & { characters: Character | null })[]; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(build?.name ?? "");
  const [shipId, setShipId] = useState(build?.ship_instance_id ?? "__none__");
  const [role, setRole] = useState(build?.role ?? "");
  const [status, setStatus] = useState(build?.status ?? "draft");
  const [notes, setNotes] = useState(build?.notes ?? "");

  const save = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const payload = { name: name.trim(), ship_instance_id: shipId === "__none__" ? null : shipId, role: role || null, status, notes: notes || null };
    if (build) { const { error } = await supabase.from("builds").update(payload).eq("id", build.id); if (error) throw error; }
    else { const { error } = await supabase.from("builds").insert({ ...payload, user_id: u.user!.id }); if (error) throw error; }
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["builds"] }); toast.success(build ? "Build updated" : "Build created"); onOpenChange(false); }, onError: (e: Error) => toast.error(e.message) });

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-primary">{build ? "Edit build" : "New build"}</DialogTitle></DialogHeader>
    <div className="space-y-4">
      <div className="space-y-1"><Label>Build name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elite CSV — Terran" /></div>
      <div className="space-y-1"><Label>Ship instance</Label><Select value={shipId} onValueChange={setShipId}><SelectTrigger><SelectValue placeholder="Select ship" /></SelectTrigger><SelectContent><SelectItem value="__none__">Unassigned</SelectItem>{ships.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.characters?.name ? ` — ${s.characters.name}` : ""}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="CSV, BO, FAW, Science, Carrier…" /></div>
      <div className="space-y-1"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="testing">Testing</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent></Select></div>
      <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Theme rules, target content, gear notes…" /></div>
    </div>
    <DialogFooter className="gap-2">{build && <Button variant="ghost" className="mr-auto text-destructive" onClick={() => { if (confirm("Delete this build?")) onDeleted(); }}><Trash2 className="mr-1 size-4" /> Delete</Button>}<Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : build ? "Save changes" : "Create build"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}


function LoadoutButton({ builds, onSaved }: { builds: Build[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [buildId, setBuildId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const save = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    const { error } = await supabase.from("loadouts").insert({ user_id: u.user.id, build_id: buildId, name: name.trim(), notes: notes.trim() || null });
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


function LoadoutEquipment({ loadoutId, buildId }: { loadoutId: string; buildId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState("Fore Weapon 1");
  const [equipmentId, setEquipmentId] = useState("");

  const ship = useQuery({
    queryKey: ["loadout_ship", buildId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_ships" as never).select("sto_ships(*)").eq("current_build_id", buildId).maybeSingle();
      if (error) throw error;
      return (data as any)?.sto_ships ?? null;
    },
  });
  const equipment = useQuery({
    queryKey: ["equipment_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_items").select("*").order("name");
      if (error) throw error; return (data ?? []) as any[];
    },
  });
  const assigned = useQuery({
    queryKey: ["loadout_equipment", loadoutId],
    queryFn: async () => {
      const { data, error } = await supabase.from("loadout_equipment" as never).select("*, equipment_items(*)").eq("loadout_id", loadoutId);
      if (error) throw error; return (data ?? []) as any[];
    },
  });

  const slots = (() => {
    const s: any = ship.data; const out: string[] = [];
    const add = (label: string, n: number) => { for (let i=1;i<=Number(n||0);i++) out.push(`${label} ${i}`); };
    add("Fore Weapon", s?.fore_weapon_slots); add("Aft Weapon", s?.aft_weapon_slots);
    if (s?.experimental_weapon) out.push("Experimental Weapon");
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
      <div><p className="lcars-label">STO Fitting</p><p className="text-sm text-muted-foreground">{assigned.data?.length ?? 0} / {slots.length} slots filled{ship.data?.name ? ` • ${ship.data.name}` : ""}</p></div>
      <Button size="sm" variant="outline" onClick={() => { setSlot(slots.find(x => !bySlot.has(x)) ?? slots[0] ?? "Fore Weapon 1"); setOpen(true); }}><Package className="mr-1 size-4" /> Fit gear</Button>
    </div>
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
        <div className="space-y-1"><Label>Equipment</Label><Select value={equipmentId} onValueChange={setEquipmentId}><SelectTrigger><SelectValue placeholder="Select stored equipment"/></SelectTrigger><SelectContent>{(equipment.data ?? []).map((e:any)=><SelectItem key={e.id} value={e.id}>{e.name}{e.mark ? ` — ${e.mark}` : ""}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={!slot || !equipmentId || save.isPending} onClick={()=>save.mutate()}>{save.isPending ? "Fitting…" : "Fit equipment"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
