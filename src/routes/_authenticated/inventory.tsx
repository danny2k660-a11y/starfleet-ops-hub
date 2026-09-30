import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [
    { title: "Inventory — STO Command Center" },
    { name: "description", content: "Track stored items by character, location and quantity." },
  ] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [character, setCharacter] = useState("all");
  const [location, setLocation] = useState("all");
  const [open, setOpen] = useState(false);
  const characters = useQuery({ queryKey: ["characters"], queryFn: async () => { const { data, error } = await supabase.from("characters").select("*").order("name"); if (error) throw error; return data ?? []; } });
  const items = useQuery({ queryKey: ["inventory_items"], queryFn: async () => { const { data, error } = await supabase.from("inventory_items").select("*").order("name"); if (error) throw error; return (data ?? []) as any[]; } });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("inventory_items").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory_items"] }); toast.success("Inventory item removed"); } });
  const filtered = useMemo(() => (items.data ?? []).filter(x => {
    const text = `${x.name} ${x.category ?? ""} ${x.location ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase()) && (character === "all" || x.character_id === character) && (location === "all" || x.location === location);
  }), [items.data, q, character, location]);
  const locations = Array.from(new Set((items.data ?? []).map(x => x.location).filter(Boolean)));
  return <AppShell title="Inventory" subtitle="Stored items and resources"><div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="lcars-label">Stores & cargo</p><h1 className="font-display text-2xl text-primary sm:text-3xl">Inventory</h1><p className="mt-1 text-sm text-muted-foreground">Keep account and character gear separated and ready for fitting.</p></div><Button className="glow-primary" onClick={() => setOpen(true)}><Plus className="mr-1 size-4" /> Add item</Button></div>
    <div className="panel grid gap-3 p-4 sm:grid-cols-3"><div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search inventory…" value={q} onChange={e => setQ(e.target.value)} /></div><Select value={character} onValueChange={setCharacter}><SelectTrigger><SelectValue placeholder="Character" /></SelectTrigger><SelectContent><SelectItem value="all">All characters</SelectItem>{(characters.data ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={location} onValueChange={setLocation}><SelectTrigger><SelectValue placeholder="Storage" /></SelectTrigger><SelectContent><SelectItem value="all">All storage</SelectItem>{locations.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    {items.isError ? <div className="panel p-6 text-center text-destructive">Unable to load inventory. Refresh and try again.</div> : items.isLoading ? <p className="text-muted-foreground">Scanning inventory…</p> : filtered.length === 0 ? <div className="panel p-10 text-center"><Package className="mx-auto mb-3 size-9 text-primary" /><h2 className="font-display text-lg text-primary">No inventory recorded</h2><p className="mt-1 text-sm text-muted-foreground">Add gear, resources or stored items as you acquire them.</p></div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(x => <div key={x.id} className="panel p-4"><div className="flex items-start justify-between gap-2"><div><p className="lcars-label">{x.category}</p><h3 className="font-display text-lg text-primary">{x.name}</h3></div><Button size="icon" variant="ghost" onClick={() => remove.mutate(x.id)}><Trash2 className="size-4 text-destructive" /></Button></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{x.location}</Badge><Badge variant="secondary"><Boxes className="mr-1 inline size-3"/> Stored</Badge><Badge variant="secondary">×{x.quantity}</Badge>{x.character_id && <Badge variant="outline">{(characters.data ?? []).find(c => c.id === x.character_id)?.name ?? "Character"}</Badge>}</div>{x.notes && <p className="mt-3 text-sm text-muted-foreground">{x.notes}</p>}</div>)}</div>}
    <InventoryDialog open={open} onOpenChange={setOpen} characters={characters.data ?? []} onSaved={() => qc.invalidateQueries({ queryKey: ["inventory_items"]})} />
  </div></AppShell>;
}

function InventoryDialog({ open, onOpenChange, characters, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; characters: any[]; onSaved: () => void }) {
  const qc = useQueryClient(); const [name,setName]=useState(""); const [category,setCategory]=useState("Equipment"); const [quantity,setQuantity]=useState("1"); const [location,setLocation]=useState("Character"); const [characterId,setCharacterId]=useState("account"); const [notes,setNotes]=useState("");
  const save=useMutation({ mutationFn: async()=>{ const { data:u }=await supabase.auth.getUser(); if(!u.user) throw new Error("Not signed in"); const payload={user_id:u.user.id,name:name.trim(),category,quantity:Math.max(1,Number(quantity)||1),location,character_id:characterId==="account"?null:characterId,notes:notes.trim()||null}; const { error }=await supabase.from("inventory_items").insert(payload); if(error) throw error; },onSuccess:()=>{qc.invalidateQueries({queryKey:["inventory_items"]});toast.success("Inventory item added");setName("");setNotes("");setQuantity("1");onSaved();onOpenChange(false)},onError:(e:Error)=>toast.error(e.message)});
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="font-display text-primary">Add inventory item</DialogTitle></DialogHeader><div className="space-y-4">
    <div className="space-y-1"><Label>Item name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Phaser Isomag, upgrade token, R&D material" /></div>
    <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["Equipment","Weapons","Consoles","Ship gear","Traits","Resources","Tokens","Other"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div></div>
    <div className="space-y-1"><Label>Storage</Label><Select value={location} onValueChange={setLocation}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["Character","Account Bank","Shared Bank","Mailbox","Other"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Owner</Label><Select value={characterId} onValueChange={setCharacterId}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="account">Account-wide</SelectItem>{characters.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Where it is, intended build, project notes…" /></div>
  </div><DialogFooter><Button variant="ghost" onClick={()=>onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim()||save.isPending} onClick={()=>save.mutate()}>{save.isPending?"Saving…":"Add item"}</Button></DialogFooter></DialogContent></Dialog>;
}
