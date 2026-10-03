import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const types = ["personal_space","starship","reputation","active_space","ground","other"] as const;
const labels: Record<string,string> = { personal_space:"Personal Space", starship:"Starship", reputation:"Reputation", active_space:"Active Space", ground:"Ground", other:"Other" };

export const Route = createFileRoute("/_authenticated/traits")({
  head: () => ({ meta: [{ title: "Traits — STO Command Center" }, { name: "description", content: "Track traits assigned to STO loadouts." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [q,setQ] = useState(""); const [open,setOpen] = useState(false);
  const [name,setName] = useState(""); const [catalogId,setCatalogId] = useState(""); const [type,setType] = useState("personal_space"); const [slot,setSlot] = useState(""); const [notes,setNotes] = useState(""); const [loadoutId,setLoadoutId] = useState("");
  const catalog = useQuery({ queryKey:["trait_catalog"], queryFn: async () => { const { data,error } = await supabase.from("trait_catalog" as never).select("*").order("name"); if(error) throw error; return (data ?? []) as any[]; } });
  const loadouts = useQuery({ queryKey:["loadouts"], queryFn: async () => { const { data,error } = await supabase.from("loadouts").select("id,name,build_id").order("updated_at",{ascending:false}); if(error) throw error; return data ?? []; } });
  const builds = useQuery({ queryKey:["trait_builds"], queryFn: async () => { const { data,error } = await supabase.from("builds").select("id,name,ship_instances(name,characters(name))").order("updated_at",{ascending:false}); if(error) throw error; return data ?? []; } });
  const traits = useQuery({ queryKey:["loadout_traits"], queryFn: async () => { const { data,error } = await supabase.from("loadout_traits").select("*").order("created_at",{ascending:false}); if(error) throw error; return data ?? []; } });
  const buildById = useMemo(() => new Map((builds.data ?? []).map((b:any)=>[b.id,b])),[builds.data]);
  const filtered = useMemo(() => (traits.data ?? []).filter((t:any) => { const l:any=(loadouts.data??[]).find((x:any)=>x.id===t.loadout_id); const b:any=buildById.get(l?.build_id); return (String(t.name)+" "+String(t.trait_type)+" "+String(b?.name??"")+" "+String(b?.ship_instances?.name??"")).toLowerCase().includes(q.toLowerCase()); }),[traits.data,loadouts.data,buildById,q]);
  const reset=()=>{setName("");setCatalogId("");setType("personal_space");setSlot("");setNotes("");setLoadoutId("");};
  const save = useMutation({ mutationFn: async () => { const { data:u }=await supabase.auth.getUser(); if(!u.user) throw new Error("Not signed in"); if(!loadoutId||!name.trim()) throw new Error("Loadout and trait name are required"); const { error }=await supabase.from("loadout_traits" as never).insert({user_id:u.user.id,loadout_id:loadoutId,trait_id:catalogId||null,trait_type:type,name:name.trim(),slot:slot.trim()||null,notes:notes.trim()||null}); if(error) throw error; }, onSuccess:()=>{qc.invalidateQueries({queryKey:["loadout_traits"]});toast.success("Trait assigned");setOpen(false);reset();}, onError:(e:Error)=>toast.error(e.message) });
  const remove = useMutation({ mutationFn:async(id:string)=>{const {error}=await supabase.from("loadout_traits").delete().eq("id",id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["loadout_traits"]});toast.success("Trait removed");},onError:(e:Error)=>toast.error(e.message) });
  return <AppShell title="Traits" subtitle="Trait library and loadout assignments"><div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="lcars-label">Trait control</p><h1 className="font-display text-2xl text-primary">Traits</h1><p className="text-sm text-muted-foreground">Track personal, starship, reputation and active traits against real loadouts.</p></div><Button onClick={()=>{reset();setOpen(true)}}><Plus className="mr-1 size-4"/> Assign trait</Button></div>
    <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search traits, builds or ships…" value={q} onChange={e=>setQ(e.target.value)}/></div>
    {(catalog.isError || loadouts.isError || builds.isError || traits.isError) && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-medium text-destructive">Trait data could not be fully loaded.</p><p className="mt-1 text-muted-foreground">Refresh the page and try again. Existing trait assignments are not changed by this warning.</p></div>}
    {(catalog.isLoading || loadouts.isLoading || builds.isLoading || traits.isLoading) && <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Loading trait assignments…</div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((t:any)=>{const l:any=(loadouts.data??[]).find((x:any)=>x.id===t.loadout_id);const b:any=buildById.get(l?.build_id);return <div key={t.id} className="rounded-lg border border-border bg-card/70 p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{t.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{labels[t.trait_type]??t.trait_type}</Badge>{t.slot&&<Badge variant="outline">{t.slot}</Badge>}</div></div><Button size="icon" variant="ghost" onClick={()=>remove.mutate(t.id)}><Trash2 className="size-4 text-destructive"/></Button></div><p className="mt-3 text-xs text-muted-foreground">{b?.name??"Unknown build"}{b?.ship_instances?.name?" • "+b.ship_instances.name:""}</p>{t.notes&&<p className="mt-2 text-xs text-muted-foreground">{t.notes}</p>}</div>})}</div>
    {!filtered.length&&<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"><Sparkles className="mx-auto mb-2 size-5"/>{q?"No traits match your search.":"No traits assigned yet. Add the first trait to a loadout."}</div>}
    <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v)reset()}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-primary">Assign trait</DialogTitle></DialogHeader><div className="grid gap-4">
      <div className="space-y-1"><Label>Loadout</Label><Select value={loadoutId} onValueChange={setLoadoutId}><SelectTrigger><SelectValue placeholder="Choose a loadout"/></SelectTrigger><SelectContent>{(loadouts.data??[]).map((l:any)=>{const b:any=buildById.get(l.build_id);return <SelectItem key={l.id} value={l.id}>{b?.name??"Build"} — {l.name}</SelectItem>})}</SelectContent></Select></div>
      <div className="space-y-1"><Label>Catalogue trait</Label><Select value={catalogId} onValueChange={(v)=>{setCatalogId(v);const t=(catalog.data??[]).find((x:any)=>x.id===v);if(t){setName(t.name);setType(t.trait_type??"other");setNotes(t.description??"");}}}><SelectTrigger><SelectValue placeholder="Choose a catalogue trait"/></SelectTrigger><SelectContent>{(catalog.data??[]).map((t:any)=><SelectItem key={t.id} value={t.id}>{t.name} — {labels[t.trait_type]??t.trait_type}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Choose from the canonical catalogue when populated, or enter a custom trait below.</p></div><div className="space-y-1"><Label>Trait name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Boimler Effect"/></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{types.map(t=><SelectItem key={t} value={t}>{labels[t]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Slot</Label><Input value={slot} onChange={e=>setSlot(e.target.value)} placeholder="1, 2, Universal…"/></div></div>
      <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Theme role, source, or setup notes…"/></div>
    </div><DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={()=>save.mutate()} disabled={save.isPending}>{save.isPending?"Assigning…":"Assign trait"}</Button></DialogFooter></DialogContent></Dialog>
  </div></AppShell>;
}