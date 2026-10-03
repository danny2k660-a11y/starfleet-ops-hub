import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = Tables<"equipment_items">;
type Character = Tables<"characters">;

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — STO Command Center" }, { name: "description", content: "Track stored Star Trek Online equipment and account stock." }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("__all__");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", slot: "", quantity: "1", rarity: "", mark: "", notes: "", source: "", characterId: "__account__" });

  const characters = useQuery({
    queryKey: ["inventory-characters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("*").order("name");
      if (error) throw error;
      return data as Character[];
    },
  });

  const items = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_items").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  const categories = useMemo(() => Array.from(new Set((items.data ?? []).map(i => i.category).filter(Boolean) as string[])).sort(), [items.data]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items.data ?? []).filter(i =>
      (!term || [i.name, i.category, i.slot, i.source, i.notes].filter(Boolean).some(v => String(v).toLowerCase().includes(term))) &&
      (category === "__all__" || i.category === category)
    );
  }, [items.data, q, category]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Item name is required.");
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("No signed-in user.");
      const payload: TablesInsert<"equipment_items"> = {
        user_id: user.user.id,
        name: form.name.trim(),
        category: form.category.trim() || null,
        slot: form.slot.trim() || null,
        quantity: Math.max(1, Number(form.quantity) || 1),
        rarity: form.rarity.trim() || null,
        mark: form.mark.trim() || null,
        notes: form.notes.trim() || null,
        source: form.source.trim() || null,
        character_id: form.characterId === "__account__" ? null : form.characterId,
      };
      const { error } = await supabase.from("equipment_items").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => { setOpen(false); setForm({ name: "", category: "", slot: "", quantity: "1", rarity: "", mark: "", notes: "", source: "", characterId: "__account__" }); await qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast.success("Inventory item added."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["inventory-items"] }); toast.success("Inventory item removed."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">Stored gear, consumables and equipment stock — separate from fitted loadouts.</p>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Search inventory..." /></div>
          <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="__all__">All categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>

        {items.isLoading ? <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Loading inventory…</div> :
          filtered.length === 0 ? <div className="rounded-lg border p-10 text-center"><Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No inventory items</p><p className="mt-1 text-sm text-muted-foreground">Add stored gear here without pretending it is fitted to a ship.</p></div> :
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item => {
            const owner = characters.data?.find(c => c.id === item.character_id);
            return <div key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{item.name}</h2><div className="mt-1 flex flex-wrap gap-1">{item.category && <Badge variant="secondary">{item.category}</Badge>}{item.rarity && <Badge variant="outline">{item.rarity}</Badge>}{item.mark && <Badge variant="outline">{item.mark}</Badge>}</div></div><Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)} disabled={remove.isPending}><Trash2 className="h-4 w-4" /></Button></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><span className="text-muted-foreground">Quantity</span><span className="text-right">{item.quantity}</span><span className="text-muted-foreground">Slot</span><span className="text-right">{item.slot || "—"}</span><span className="text-muted-foreground">Stored on</span><span className="text-right">{owner?.name || "Account"}</span><span className="text-muted-foreground">Source</span><span className="text-right">{item.source || "—"}</span></div>
              {item.notes && <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{item.notes}</p>}
            </div>;
          })}</div>}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="e.g. Phaser Beam Array Mk XV" /></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))} placeholder="Weapon, Console, Kit..." /></div><div><Label>Slot</Label><Input value={form.slot} onChange={e => setForm(f => ({...f, slot:e.target.value}))} placeholder="Fore, Deflector, Kit..." /></div></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><Label>Quantity</Label><Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity:e.target.value}))} /></div><div><Label>Rarity</Label><Input value={form.rarity} onChange={e => setForm(f => ({...f, rarity:e.target.value}))} placeholder="Very Rare, Epic..." /></div></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><Label>Mark</Label><Input value={form.mark} onChange={e => setForm(f => ({...f, mark:e.target.value}))} placeholder="Mk XV" /></div><div><Label>Source</Label><Input value={form.source} onChange={e => setForm(f => ({...f, source:e.target.value}))} placeholder="Reputation, Lockbox..." /></div></div>
              <div><Label>Stored on</Label><Select value={form.characterId} onValueChange={v => setForm(f => ({...f, characterId:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__account__">Account storage</SelectItem>{(characters.data ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder="Upgrade status, intended build, storage notes..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Add Item"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
