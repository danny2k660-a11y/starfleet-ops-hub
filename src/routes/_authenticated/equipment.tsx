import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Package, RefreshCw, Database, Library } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CatalogItem = {
  id: string;
  canonical_key?: string | null;
  name: string;
  category: string;
  domain: string;
  slot: string | null;
  weapon_type: string | null;
  energy_type: string | null;
  mark_level: number | null;
  rarity: string | null;
  source_type: string | null;
  source_name: string | null;
  source_group: string | null;
  reputation_name: string | null;
  currency_type: string | null;
  set_name: string | null;
  set_piece: string | null;
  upgradeable: boolean;
  max_mark: number | null;
  faction_restriction: string | null;
  career_restriction: string | null;
  species_restriction: string | null;
  unique_item: boolean;
  description: string | null;
  modifiers: unknown;
  properties: unknown;
  source_reference: string | null;
  data_version: string | null;
  data_quality_status: string | null;
  data_quality_notes: string | null;
};

type Equipment = {
  id: string;
  catalog_item_id: string | null;
  name: string;
  category: string | null;
  slot: string | null;
  rarity: string | null;
  mark: string | null;
  mods: string | null;
  quantity: number;
  character_id: string | null;
  notes: string | null;
};

const categories = ["Weapon", "Console", "Deflector", "Impulse Engines", "Warp Core", "Shields", "Experimental", "Device", "Ground Weapon", "Armor", "Kit", "Kit Module", "Personal Shield", "Other"];

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({ meta: [{ title: "Equipment — STO Command Center" }, { name: "description", content: "Structured STO equipment catalogue and your fitting locker." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<"catalog" | "locker">("catalog");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [name, setName] = useState("");
  const [cat, setCat] = useState("Weapon");
  const [slot, setSlot] = useState("");
  const [rarity, setRarity] = useState("");
  const [mark, setMark] = useState("");
  const [mods, setMods] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [characterId, setCharacterId] = useState("account");
  const [notes, setNotes] = useState("");

  const catalog = useQuery({
    queryKey: ["equipment_catalog"],
    queryFn: async () => {
      const all: CatalogItem[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("equipment_catalog" as never).select("*").order("name").range(from, from + 999);
        if (error) throw error;
        const page = (data ?? []) as unknown as CatalogItem[];
        all.push(...page);
        if (page.length < 1000) break;
      }
      return all;
    },
  });

  const equipment = useQuery({
    queryKey: ["equipment_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_items" as never).select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Equipment[];
    },
  });

  const characters = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const syncCatalog = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-equipment-catalog", { body: {} });
      if (error) throw error;
      return data as { imported?: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["equipment_catalog"] });
      toast.success(`Equipment catalogue synced: ${data?.imported ?? 0} records processed`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = () => {
    setEditing(null); setName(""); setCat("Weapon"); setSlot(""); setRarity(""); setMark(""); setMods("");
    setQuantity("1"); setCharacterId("account"); setNotes("");
  };

  const edit = (e: Equipment) => {
    setEditing(e); setName(e.name); setCat(e.category ?? "Other"); setSlot(e.slot ?? ""); setRarity(e.rarity ?? "");
    setMark(e.mark ?? ""); setMods(e.mods ?? ""); setQuantity(String(e.quantity ?? 1));
    setCharacterId(e.character_id ?? "account"); setNotes(e.notes ?? ""); setOpen(true);
  };

  const addCatalogItem = useMutation({
    mutationFn: async (item: CatalogItem) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        user_id: u.user.id,
        catalog_item_id: item.id,
        name: item.name,
        category: item.category,
        slot: item.slot,
        rarity: item.rarity,
        mark: item.mark_level ? `Mk ${item.mark_level}` : null,
        mods: null,
        quantity: 1,
        character_id: null,
        notes: [item.source_type, item.source_name, item.reputation_name].filter(Boolean).join(" • ") || null,
      };
      const { error } = await supabase.from("equipment_items" as never).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment_items"] });
      toast.success("Added to account locker");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        user_id: u.user.id, name: name.trim(), category: cat, slot: slot.trim() || null,
        rarity: rarity.trim() || null, mark: mark.trim() || null, mods: mods.trim() || null,
        quantity: Math.max(1, Number(quantity) || 1), character_id: characterId === "account" ? null : characterId,
        notes: notes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("equipment_items" as never).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment_items" as never).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment_items"] });
      toast.success(editing ? "Equipment updated" : "Equipment added");
      setOpen(false); reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_items" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment_items"] }); toast.success("Equipment removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const catalogItems = (catalog.data ?? []).filter(e =>
    (domain === "All" || e.domain === domain) &&
    (category === "All" || e.category === category) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  const lockerItems = (equipment.data ?? []).filter(e =>
    (category === "All" || e.category === category) && e.name.toLowerCase().includes(search.toLowerCase())
  );
  const catalogCategories = Array.from(new Set((catalog.data ?? []).map(e => e.category))).sort();

  return (
    <AppShell title="Equipment" subtitle="Complete equipment catalogue + fitting locker">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="lcars-label">Equipment database</p>
            <h1 className="font-display text-2xl text-primary">Space & ground gear</h1>
            <p className="text-sm text-muted-foreground">Weapons, consoles, reputation gear, Lobi, lockbox, fleet, mission, event and ground equipment all use the same structured catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={view === "catalog" ? "default" : "outline"} onClick={() => setView("catalog")}><Database className="mr-1 size-4" /> Catalogue ({catalog.data?.length ?? 0})</Button>
            <Button variant={view === "locker" ? "default" : "outline"} onClick={() => setView("locker")}><Library className="mr-1 size-4" /> My locker ({equipment.data?.length ?? 0})</Button>
            <Button variant="outline" disabled={syncCatalog.isPending} onClick={() => syncCatalog.mutate()}><RefreshCw className={`mr-1 size-4 ${syncCatalog.isPending ? "animate-spin" : ""}`} /> {syncCatalog.isPending ? "Syncing…" : "Sync catalogue"}</Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search weapons, consoles, sets, reputation gear…" /></div>
          <Select value={domain} onValueChange={setDomain}><SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All domains</SelectItem><SelectItem value="space">Space</SelectItem><SelectItem value="ground">Ground</SelectItem></SelectContent></Select>
          <Select value={category} onValueChange={setCategory}><SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All categories</SelectItem>{(catalogCategories.length ? catalogCategories : categories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </div>

        {view === "catalog" ? (
          <>
            <div className="panel p-4 text-xs text-muted-foreground">
              The catalogue stores canonical item data separately from what you actually own. The first sync imports the current STOCD SETS equipment dataset; fields such as Mark, source, reputation, currency and set membership are retained for later authoritative enrichment rather than being guessed.
            </div>
            {catalog.isLoading ? <div className="panel p-8 text-center text-muted-foreground">Loading equipment catalogue…</div> :
              catalog.isError ? <div className="panel p-8 text-center text-destructive">Unable to load the equipment catalogue.</div> :
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catalogItems.slice(0, 300).map(e => (
                  <div key={e.id} className="rounded-lg border border-border bg-card/70 p-4 transition hover:border-primary/50">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-medium">{e.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{e.category}</Badge><Badge variant="outline">{e.domain}</Badge>{e.rarity && <Badge variant="outline">{e.rarity}</Badge>}{e.mark_level && <Badge variant="outline">Mk {e.mark_level}</Badge>}</div></div>
                    </div>
                    {(e.weapon_type || e.energy_type) && <p className="mt-2 text-xs text-muted-foreground">{[e.weapon_type, e.energy_type].filter(Boolean).join(" • ")}</p>}
                    {(e.source_type || e.source_name || e.reputation_name || e.currency_type) && <p className="mt-2 text-xs text-muted-foreground">{[e.source_type, e.source_name, e.reputation_name, e.currency_type].filter(Boolean).join(" • ")}</p>}
                    {e.set_name && <p className="mt-1 text-xs text-muted-foreground">Set: {e.set_name}{e.set_piece ? ` — ${e.set_piece}` : ""}</p>}
                    <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => addCatalogItem.mutate(e)} disabled={addCatalogItem.isPending}><Plus className="mr-1 size-4" /> Add to my locker</Button>
                  </div>
                ))}
              </div>}
            {catalogItems.length > 300 && <p className="text-center text-xs text-muted-foreground">Showing the first 300 matches. Refine the search to narrow the catalogue.</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between"><div><p className="lcars-label">Owned equipment</p><p className="text-sm text-muted-foreground">Actual items you have available for fitting.</p></div><Button onClick={() => { reset(); setOpen(true); }}><Plus className="mr-1 size-4" /> Add equipment</Button></div>
            {equipment.isLoading ? <div className="panel p-8 text-center text-muted-foreground">Scanning equipment locker…</div> :
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lockerItems.map(e => <div key={e.id} className="rounded-lg border border-border bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{e.name}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{e.category}</Badge>{e.rarity && <Badge variant="outline">{e.rarity}</Badge>}{e.mark && <Badge variant="outline">{e.mark}</Badge>}</div></div><Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}><Trash2 className="size-4 text-destructive" /></Button></div>
                  {e.slot && <p className="mt-3 text-xs text-muted-foreground">Slot: {e.slot}</p>}
                  {e.mods && <p className="mt-1 text-xs text-muted-foreground">Mods: {e.mods}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">Qty {e.quantity}{e.character_id ? " • Character-bound" : " • Account"}</p>
                  <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => edit(e)}><Package className="mr-1 size-4" /> Edit fitting</Button>
                </div>)}
              </div>}
            {!equipment.isLoading && !lockerItems.length && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No equipment in your locker matches the current filters.</div>}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-primary">{editing ? "Edit equipment" : "Add equipment"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Agony Phaser Quad Cannon" /></div>
            <div className="space-y-1"><Label>Category</Label><Input value={cat} onChange={e => setCat(e.target.value)} placeholder="Weapon, Console, Armor…" /></div>
            <div className="space-y-1"><Label>Slot</Label><Input value={slot} onChange={e => setSlot(e.target.value)} placeholder="Fore Weapon, Universal Console…" /></div>
            <div className="space-y-1"><Label>Rarity</Label><Input value={rarity} onChange={e => setRarity(e.target.value)} placeholder="Very Rare / Epic" /></div>
            <div className="space-y-1"><Label>Mark</Label><Input value={mark} onChange={e => setMark(e.target.value)} placeholder="Mk XV" /></div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Character</Label><Select value={characterId} onValueChange={setCharacterId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="account">Account-wide</SelectItem>{characters.data?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1 sm:col-span-2"><Label>Mods</Label><Input value={mods} onChange={e => setMods(e.target.value)} placeholder="[CrtD]x3 [Dmg]" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Source, set bonus, theme restrictions, upgrade notes…" /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : editing ? "Save changes" : "Add equipment"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
