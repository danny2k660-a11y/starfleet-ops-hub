import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Package, Boxes } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Equipment = {
  id: string; name: string; category: string; slot: string | null; rarity: string | null;
  mark: string | null; mods: string | null; quantity: number; character_id: string | null; notes: string | null;
};

const categories = ["Weapon","Console","Deflector","Impulse Engines","Warp Core","Shields","Experimental","Set","Other"];

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({ meta: [{ title: "Equipment — STO Command Center" }, { name: "description", content: "Your STO equipment locker and fitting inventory." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [name, setName] = useState(""); const [cat, setCat] = useState("Weapon"); const [slot, setSlot] = useState("");
  const [rarity, setRarity] = useState(""); const [mark, setMark] = useState(""); const [mods, setMods] = useState("");
  const [quantity, setQuantity] = useState("1"); const [characterId, setCharacterId] = useState("account"); const [notes, setNotes] = useState("");

  const equipment = useQuery({ queryKey:["equipment_items"], queryFn: async () => {
    const { data, error } = await supabase.from("equipment_items" as never).select("*").order("name");
    if (error) throw error; return (data ?? []) as unknown as Equipment[];
  }});
  const characters = useQuery({ queryKey:["characters"], queryFn: async () => {
    const { data, error } = await supabase.from("characters").select("id,name").order("name");
    if (error) throw error; return data ?? [];
  }});
  const filtered = (equipment.data ?? []).filter(e => (category === "All" || e.category === category) &&
    e.name.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setEditing(null); setName(""); setCat("Weapon"); setSlot(""); setRarity(""); setMark(""); setMods(""); setQuantity("1"); setCharacterId("account"); setNotes(""); };
  const edit = (e: Equipment) => { setEditing(e); setName(e.name); setCat(e.category); setSlot(e.slot ?? ""); setRarity(e.rarity ?? ""); setMark(e.mark ?? ""); setMods(e.mods ?? ""); setQuantity(String(e.quantity ?? 1)); setCharacterId(e.character_id ?? "account"); setNotes(e.notes ?? ""); setOpen(true); };

  const save = useMutation({ mutationFn: async () => {
    const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Not signed in");
    const payload = { user_id:u.user.id, name:name.trim(), category:cat, slot:slot.trim()||null, rarity:rarity.trim()||null, mark:mark.trim()||null, mods:mods.trim()||null, quantity:Math.max(1, Number(quantity)||1), character_id:characterId==="account"?null:characterId, notes:notes.trim()||null };
    if (editing) { const { error } = await supabase.from("equipment_items" as never).update(payload).eq("id",editing.id); if(error) throw error; }
    else { const { error } = await supabase.from("equipment_items" as never).insert(payload); if(error) throw error; }
  }, onSuccess:()=>{qc.invalidateQueries({queryKey:["equipment_items"]});toast.success(editing?"Equipment updated":"Equipment added");setOpen(false);reset();}, onError:(e:Error)=>toast.error(e.message)});

  const remove = useMutation({ mutationFn:async(id:string)=>{const {error}=await supabase.from("equipment_items" as never).delete().eq("id",id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["equipment_items"]});toast.success("Equipment removed");},onError:(e:Error)=>toast.error(e.message)});
  const openNew=()=>{reset();setOpen(true);};

  return <AppShell title="Equipment" subtitle="Fitting locker">
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="lcars-label">Equipment locker</p><h1 className="font-display text-2xl text-primary">Ship fittings</h1><p className="text-sm text-muted-foreground">Store gear once, then assign it to any loadout.</p></div>
        <Button onClick={openNew}><Plus className="mr-1 size-4"/> Add equipment</Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search weapons, consoles, sets…"/></div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className="sm:w-48"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="All">All categories</SelectItem>{categories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(e=><div key={e.id} className="rounded-lg border border-border bg-card/70 p-4 transition hover:border-primary/50">
          <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{e.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{e.category}</Badge>{e.rarity&&<Badge variant="outline">{e.rarity}</Badge>}{e.mark&&<Badge variant="outline">{e.mark}</Badge>}</div></div><Button size="icon" variant="ghost" onClick={()=>remove.mutate(e.id)}><Trash2 className="size-4 text-destructive"/></Button></div>
          {e.slot&&<p className="mt-3 text-xs text-muted-foreground">Slot: {e.slot}</p>}{e.mods&&<p className="mt-1 text-xs text-muted-foreground">Mods: {e.mods}</p>}<p className="mt-2 text-xs text-muted-foreground">Qty {e.quantity}{e.character_id?" • Character-bound":" • Account"}</p><div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><Boxes className="size-3"/> Ready for loadout fitting</div>
          <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={()=>edit(e)}><Package className="mr-1 size-4"/> Edit fitting</Button>
        </div>)}
      </div>
{equipment.isError?<div className="panel p-6 text-center text-destructive">Unable to load equipment. Refresh and try again.</div>:equipment.isLoading?<div className="panel p-6 text-center text-muted-foreground">Scanning equipment locker…</div>:!filtered.length&&<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No equipment matches your search.</div>}
    </div>
    <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v)reset();}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle className="font-display text-primary">{editing?"Edit equipment":"Add equipment"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Agony Phaser Quad Cannon"/></div>
        <div className="space-y-1"><Label>Category</Label><Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Slot</Label><Input value={slot} onChange={e=>setSlot(e.target.value)} placeholder="Fore Weapon, Console…"/></div>
        <div className="space-y-1"><Label>Rarity</Label><Input value={rarity} onChange={e=>setRarity(e.target.value)} placeholder="Very Rare / Epic"/></div>
        <div className="space-y-1"><Label>Mark</Label><Input value={mark} onChange={e=>setMark(e.target.value)} placeholder="Mk XV"/></div>
        <div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div>
        <div className="space-y-1 sm:col-span-2"><Label>Character</Label><Select value={characterId} onValueChange={setCharacterId}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="account">Account-wide</SelectItem>{characters.data?.map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1 sm:col-span-2"><Label>Mods</Label><Input value={mods} onChange={e=>setMods(e.target.value)} placeholder="e.g. [CrtD]x3 [Dmg]"/></div>
        <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Theme restrictions, set bonus, source, upgrade notes…"/></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>{save.isPending?"Saving…":editing?"Save changes":"Add equipment"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </AppShell>;
}
