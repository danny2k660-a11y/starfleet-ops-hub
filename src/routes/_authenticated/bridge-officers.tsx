import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/bridge-officers")({
  head: () => ({ meta: [{ title: "Bridge Officers — STO Command Center" }, { name: "description", content: "Configure bridge officer seating for ship loadouts." }] }),
  component: Page,
});

type Loadout = { id: string; name: string; build_id: string };
type FleetShip = { id: string; current_build_id: string | null; custom_name: string; characters: { name: string } | null; sto_ships: { name: string; bridge_officer_stations: unknown } | null };
type Boff = { id: string; loadout_id: string; station: string; officer_name: string | null; officer_species: string | null; specialization: string | null; abilities: unknown; notes: string | null };

function stationNames(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((entry) => typeof entry === "string" ? entry : (entry as { station?: string; name?: string } | null)?.station ?? (entry as { name?: string } | null)?.name).filter(Boolean).map(String);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
}

function Page() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loadoutId, setLoadoutId] = useState("");
  const [station, setStation] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [species, setSpecies] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [abilities, setAbilities] = useState(""); const [catalogId, setCatalogId] = useState("");
  const [notes, setNotes] = useState("");

  const catalog = useQuery({ queryKey: ["boff_catalog"], queryFn: async () => { const { data, error } = await supabase.from("boff_catalog" as never).select("*").order("name"); if(error) throw error; return (data ?? []) as any[]; }});
  const loadouts = useQuery({ queryKey: ["boff_loadouts"], queryFn: async () => {
    const { data, error } = await supabase.from("loadouts").select("id,name,build_id").order("updated_at", { ascending: false });
    if (error) throw error; return (data ?? []) as Loadout[];
  }});
  const fleet = useQuery({ queryKey: ["boff_fleet"], queryFn: async () => {
    const { data, error } = await supabase.from("user_ships").select("id,current_build_id,custom_name,characters(name),sto_ships(name,bridge_officer_stations)");
    if (error) throw error; return (data ?? []) as unknown as FleetShip[];
  }});
  const boffs = useQuery({ queryKey: ["loadout_boffs"], queryFn: async () => {
    const { data, error } = await supabase.from("loadout_boffs").select("*").order("station");
    if (error) throw error; return (data ?? []) as Boff[];
  }});

  const fleetByBuild = useMemo(() => new Map((fleet.data ?? []).filter((s) => s.current_build_id).map((s) => [s.current_build_id!, s])), [fleet.data]);
  const filtered = useMemo(() => (boffs.data ?? []).filter((b) => `${b.station} ${b.officer_name ?? ""} ${b.specialization ?? ""}`.toLowerCase().includes(q.toLowerCase())), [boffs.data, q]);
  const selectedLoadout = loadouts.data?.find((l) => l.id === loadoutId);
  const selectedShip = selectedLoadout ? fleetByBuild.get(selectedLoadout.build_id) : undefined;
  const expectedStations = stationNames(selectedShip?.sto_ships?.bridge_officer_stations);
  const configured = useMemo(() => new Set((boffs.data ?? []).filter((b) => b.loadout_id === loadoutId).map((b) => b.station.toLowerCase())), [boffs.data, loadoutId]);

  const reset = () => { setLoadoutId(""); setCatalogId(""); setStation(""); setOfficerName(""); setSpecies(""); setSpecialization(""); setAbilities(""); setNotes(""); };
  const save = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !loadoutId || !station) throw new Error("Loadout and bridge station are required");
    const abilityList = abilities.split("\n").map((x) => x.trim()).filter(Boolean);
    const { error } = await supabase.from("loadout_boffs" as never).upsert({ user_id: u.user.id, loadout_id: loadoutId, station, officer_name: officerName.trim() || null, officer_species: species.trim() || null, boff_id: catalogId || null, specialization: specialization.trim() || null, abilities: abilityList, notes: notes.trim() || null }, { onConflict: "loadout_id,station" });
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["loadout_boffs"] }); toast.success("Bridge officer station saved"); setOpen(false); reset(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("loadout_boffs").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["loadout_boffs"] }); toast.success("Bridge officer removed"); }, onError: (e: Error) => toast.error(e.message) });

  return <AppShell title="Bridge Officers" subtitle="Bridge crew and station assignments">
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="lcars-label">Bridge command</p><h1 className="font-display text-2xl text-primary">Bridge Officers</h1><p className="text-sm text-muted-foreground">Configure the actual seating defined by each ship's STO catalogue record.</p></div>
        <Button onClick={() => { reset(); setOpen(true); }}><Plus className="mr-1 size-4" /> Assign station</Button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search officer, station or specialization…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(filtered ?? []).map((b) => {
          const loadout = loadouts.data?.find((l) => l.id === b.loadout_id);
          const ship = loadout ? fleetByBuild.get(loadout.build_id) : undefined;
          return <div key={b.id} className="rounded-lg border border-border bg-card/70 p-4">
            <div className="flex items-start justify-between gap-2"><div><p className="font-medium text-primary">{b.station}</p><p className="text-sm">{b.officer_name || "Unnamed officer"}</p></div><Button size="icon" variant="ghost" onClick={() => remove.mutate(b.id)}><Trash2 className="size-4 text-destructive" /></Button></div>
            <div className="mt-2 flex flex-wrap gap-1"><Badge variant="secondary">{loadout?.name ?? "Unknown loadout"}</Badge>{ship?.sto_ships?.name && <Badge variant="outline">{ship.sto_ships.name}</Badge>}{b.specialization && <Badge variant="outline">{b.specialization}</Badge>}</div>
            {b.officer_species && <p className="mt-2 text-xs text-muted-foreground">{b.officer_species}</p>}
            {Array.isArray(b.abilities) && b.abilities.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{b.abilities.join(" · ")}</p>}
            {b.notes && <p className="mt-2 text-xs text-muted-foreground">{b.notes}</p>}
          </div>;
        })}
      </div>
      {!filtered.length && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"><UsersRound className="mx-auto mb-2 size-6 text-primary" />No bridge officer assignments recorded yet.</div>}

      <div className="panel p-4"><p className="lcars-label">Seating verification</p><p className="mt-1 text-sm text-muted-foreground">The readiness system compares configured stations against the ship catalogue. A station cannot be marked complete merely because an officer exists elsewhere.</p></div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-primary">Assign bridge station</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Loadout</Label><Select value={loadoutId} onValueChange={(v) => { setLoadoutId(v); setStation(""); }}><SelectTrigger><SelectValue placeholder="Choose a loadout" /></SelectTrigger><SelectContent>{(loadouts.data ?? []).map((l) => { const ship = fleetByBuild.get(l.build_id); return <SelectItem key={l.id} value={l.id}>{l.name}{ship?.sto_ships?.name ? ` — ${ship.sto_ships.name}` : ""}</SelectItem>; })}</SelectContent></Select></div>
            {selectedLoadout && <div className="rounded border border-primary/20 bg-primary/5 p-3"><p className="lcars-label">Ship seating</p><p className="text-sm text-primary">{selectedShip?.sto_ships?.name ?? "No fleet ship linked"}</p><p className="mt-1 text-xs text-muted-foreground">{expectedStations.length ? `${expectedStations.length} catalogue station${expectedStations.length === 1 ? "" : "s"}` : "Bridge seating not populated in the catalogue yet."}</p></div>}
            <div className="space-y-1"><Label>Station</Label><Select value={station} onValueChange={setStation} disabled={!loadoutId}><SelectTrigger><SelectValue placeholder="Select a catalogue station" /></SelectTrigger><SelectContent>{expectedStations.map((s) => <SelectItem key={s} value={s}>{s}{configured.has(s.toLowerCase()) ? " • configured" : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Officer name</Label><Input value={officerName} onChange={(e) => setOfficerName(e.target.value)} placeholder="e.g. Cmdr. Tovan" /></div><div className="space-y-1"><Label>Species</Label><Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Romulan" /></div></div>
            <div className="space-y-1"><Label>Specialization</Label><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Intel, Command, Miracle Worker…" /></div>
            <div className="space-y-1"><Label>Abilities</Label><Textarea value={abilities} onChange={(e) => setAbilities(e.target.value)} placeholder="One ability per line" /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Theme or tactical notes…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!loadoutId || !station || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save station"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </AppShell>;
}
