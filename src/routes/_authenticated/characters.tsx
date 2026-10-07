import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserRound, Trash2, Rocket, Package } from "lucide-react";
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

type Character = Tables<"characters"> & { elite_captain?: boolean };

export const Route = createFileRoute("/_authenticated/characters")({
  head: () => ({ meta: [{ title: "Characters — STO Command Center" }, { name: "description", content: "Manage your STO captains and keep every character's ships and equipment separated." }] }),
  component: CharactersPage,
});

function CharactersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);
  const characters = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => (characters.data ?? []).filter(c =>
    `${c.name} ${c.faction ?? ""} ${c.career ?? ""} ${c.species ?? ""}`.toLowerCase().includes(q.toLowerCase())
  ), [characters.data, q]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("characters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters"] }); toast.success("Character removed"); setSelected(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Characters" subtitle="Your STO captains">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="lcars-label">Personnel registry</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Characters</h2></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowSearch(v => !v)}><Search className="mr-1 size-4" /> Search by character, species, faction and career</Button>
            <Button onClick={() => { setSelected(null); setOpen(true); }} className="glow-primary"><Plus className="mr-1 size-4" /> Add character</Button>
          </div>
        </div>
        {showSearch && <div className="panel p-4"><div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input autoFocus className="pl-8" placeholder="Search by character, species, faction and career" value={q} onChange={e => setQ(e.target.value)} /></div></div>}
        {characters.isError ? <div className="panel p-6 text-center text-destructive">Unable to load the personnel registry. Refresh and try again.</div> : characters.isLoading ? <p className="text-muted-foreground">Loading personnel registry…</p> :
          filtered.length === 0 ? <div className="panel p-8 text-center text-muted-foreground"><UserRound className="mx-auto mb-2 size-8 text-primary" />{characters.data?.length ? "No characters match your search." : "No characters yet. Add your first captain."}</div> :
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(c =>
            <button key={c.id} onClick={() => { setSelected(c); setOpen(true); }} className="panel p-5 text-left transition hover:border-primary">
              <div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{c.faction ?? "Faction not set"}</p><h3 className="font-display text-xl text-primary">{c.name}</h3></div><UserRound className="size-5 text-accent" /></div>
              <div className="mt-3 flex flex-wrap gap-2">{c.career && <Badge variant="outline">{c.career}</Badge>}{c.species && <Badge variant="outline">{c.species}</Badge>}{c.level != null && <Badge variant="secondary">Lv {c.level}</Badge>}</div>
            </button>
          )}</div>}
        <CharacterDialog
          key={selected?.id ?? "new"}
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            // Closing a character must only close the UI. It must never trigger
            // character/ship registry writes or leave a stale ops panel mounted.
            if (!value) setSelected(null);
          }}
          character={selected}
          onDeleted={() => remove.mutate(selected!.id)}
        />
        {selected && <CharacterOps characterId={selected.id} characterName={selected.name} />}
      </div>
    </AppShell>
  );
}

function CharacterDialog({ open, onOpenChange, character, onDeleted }: { open: boolean; onOpenChange: (v: boolean) => void; character: Character | null; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(character?.name ?? "");
  const [faction, setFaction] = useState(character?.faction ?? "");
  const [career, setCareer] = useState(character?.career ?? "");
  const [species, setSpecies] = useState(character?.species ?? "");
  const [level, setLevel] = useState(character?.level?.toString() ?? "");
  const [notes, setNotes] = useState(character?.notes ?? "");
  const [eliteCaptain, setEliteCaptain] = useState(character?.elite_captain ?? false);

  const reset = (c: Character | null) => { setName(c?.name ?? ""); setFaction(c?.faction ?? ""); setCareer(c?.career ?? ""); setSpecies(c?.species ?? ""); setLevel(c?.level?.toString() ?? ""); setNotes(c?.notes ?? ""); setEliteCaptain(c?.elite_captain ?? false); };
  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload = { name: name.trim(), faction: faction || null, career: career || null, species: species || null, level: level ? Number(level) : null, notes: notes || null, elite_captain: eliteCaptain };
      if (character) {
        const { error } = await supabase.from("characters").update(payload).eq("id", character.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("characters").insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters"] }); toast.success(character ? "Character updated" : "Character added"); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return <Dialog open={open} onOpenChange={v => { if (v) reset(character); onOpenChange(v); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle className="font-display text-primary">{character ? "Edit character" : "Add character"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Captain name" /></div>
        <div className="space-y-1"><Label>Faction</Label><Input value={faction} onChange={e => setFaction(e.target.value)} placeholder="Terran Empire, Romulan, Federation…" /></div>
        <div className="space-y-1"><Label>Career</Label><Select value={career} onValueChange={setCareer}><SelectTrigger><SelectValue placeholder="Select career" /></SelectTrigger><SelectContent><SelectItem value="Tactical">Tactical</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="Engineering">Engineering</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label>Species</Label><Input value={species} onChange={e => setSpecies(e.target.value)} placeholder="Species" /></div>
        <div className="space-y-1"><Label>Level</Label><Input type="number" min="1" max="65" value={level} onChange={e => setLevel(e.target.value)} /></div>
        <div className="space-y-1"><Label>Elite Captain</Label><label className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm"><input type="checkbox" checked={eliteCaptain} onChange={e => setEliteCaptain(e.target.checked)} /> Extra personal Ground + Space trait slots</label></div><div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Theme rules, important character notes…" /></div>
      </div>
      <DialogFooter className="gap-2">{character && <Button variant="ghost" className="mr-auto text-destructive" onClick={() => { if (confirm("Remove this character? Their linked ships may also be affected.")) onDeleted(); }}><Trash2 className="mr-1 size-4" /> Remove</Button>}<Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : character ? "Save changes" : "Add character"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}


function CharacterOps({ characterId, characterName }: { characterId: string; characterName: string }) {
  const qc = useQueryClient();
  const ships = useQuery({
    queryKey: ["character_ops_ships", characterId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in.");

      // Build the character fleet from every account-level ownership source.
      // Do not depend on sto_ship_ownership alone: older claims can exist only
      // as user_ships rows (including character_id = null).
      // Ownership is explicit: this query only reads existing character assignments.
      // Never infer ownership from ship catalogue/source metadata.
      const { data: existingShips, error: existingError } = await supabase
        .from("user_ships")
        .select("id,custom_name,ownership_status,sto_ship_id,character_id,date_acquired,acquisition_source,acquisition_group,usage_mode")
        .eq("user_id", u.user.id)
        .eq("ownership_status", "owned")
        .order("created_at", { ascending: false });
      if (existingError) throw existingError;

      const { data, error } = await supabase
        .from("user_ships")
        .select("id,custom_name,ownership_status,sto_ship_id,character_id,date_acquired,acquisition_source,acquisition_group,usage_mode,sto_ships(name,ship_class),builds(name,status)")
        .eq("user_id", u.user.id)
        .eq("character_id", characterId)
        .eq("ownership_status", "owned")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Older versions of the app incorrectly copied the entire account ownership
      // catalogue onto every captain and labelled those rows "Account unlock".
      // They are not explicit character assignments and must not count as registered
      // ships. New assignments use the real acquisition source instead.
      const registeredShips = (data ?? []).filter((row: any) =>
        String(row.acquisition_source ?? "") !== "Account unlock"
      );

      return registeredShips as any[];
    },
  });

  const shipUnlocks = useQuery({
    queryKey: ["character_ops_ship_unlocks", characterId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_ship_unlocks" as never)
        .select("id,sto_ship_id,unlock_type,name,source_name,sto_ships(name)")
        .eq("character_id", characterId)
        .order("unlock_type")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const equipment = useQuery({
    queryKey: ["character_ops_equipment", characterId],
    refetchOnMount: "always",
    staleTime: 0,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("equipment_items" as never)
        .select("id,name,category,slot,mark,rarity,mark_level,upgrade_level,catalog_item_id,character_id")
        .eq("user_id", u.user.id)
        .or(`character_id.eq.${characterId},character_id.is.null`)
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const personalTraits = useQuery({
    queryKey: ["character_ops_traits", characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_traits" as never)
        .select("id,trait_id,domain,trait_category,slot_index,active,trait_catalog(name,trait_type,domain)")
        .eq("character_id", characterId)
        .order("domain")
        .order("slot_index");
      if (error) throw error;
      return data as any[];
    },
  });

  const bridgeOfficers = useQuery({
    queryKey: ["character_ops_boffs", characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("character_boffs" as never)
        .select("id,name,species,career,rank,specialization,traits,abilities,notes,active")
        .eq("character_id", characterId)
        .order("created_at");
      if (error) throw error;
      return data as any[];
    },
  });

  const [traitSearch,setTraitSearch]=useState("");
  const characterTraitCatalog=useQuery({queryKey:["character_ops_trait_catalog"],queryFn:async()=>{const {data,error}=await supabase.from("trait_catalog" as never).select("id,name,trait_type,domain,trait_category,description").in("domain",["space","ground"]).order("name");if(error)throw error;return data as any[];}});
  const addCharacterTrait=useMutation({mutationFn:async(trait:any)=>{const {data:u}=await supabase.auth.getUser();if(!u.user)throw new Error("Not signed in");const {data:existing}=await supabase.from("character_traits" as never).select("id").eq("character_id",characterId).eq("trait_id",trait.id).maybeSingle();if(existing)throw new Error("That trait is already assigned");const {data:maxRow}=await supabase.from("character_traits" as never).select("slot_index").eq("character_id",characterId).eq("domain",trait.domain).order("slot_index",{ascending:false}).limit(1).maybeSingle();const {error}=await supabase.from("character_traits" as never).insert({user_id:u.user.id,character_id:characterId,trait_id:trait.id,active:true,slot_index:Number(maxRow?.slot_index||0)+1,domain:trait.domain,trait_category:trait.trait_category||trait.trait_type||"personal",slot_group:trait.domain,source_type:"catalog",source_name:trait.name});if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["character_ops_traits",characterId]});toast.success("Trait added to character");},onError:(e:any)=>toast.error(e?.message||"Could not add trait")});
  const removeCharacterTrait=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from("character_traits" as never).update({active:false}).eq("id",id);if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:["character_ops_traits",characterId]})});
  const [doffSearch,setDoffSearch]=useState("");
  const [boffName,setBoffName]=useState("");
  const [boffCareer,setBoffCareer]=useState("");
  const doffs=useQuery({enabled:Boolean(characterId),queryKey:["character_ops_doffs",characterId],queryFn:async()=>{const {data,error}=await supabase.from("character_doffs" as never).select("id,doff_id,active,notes,doff_catalog(id,name,department,specialization,domain,ability_data)").eq("character_id",characterId).eq("active",true).order("created_at");if(error)throw error;return data as any[];}});
  const doffCatalog=useQuery({queryKey:["character_ops_doff_catalog"],queryFn:async()=>{const {data,error}=await supabase.from("doff_catalog" as never).select("id,name,department,specialization,domain,ability_data").order("name");if(error)throw error;return data as any[];}});
  const addDoff=useMutation({mutationFn:async(id:string)=>{const {data:u}=await supabase.auth.getUser();if(!u.user)throw new Error("Not signed in");const {data:existing}=await supabase.from("character_doffs" as never).select("id").eq("character_id",characterId).eq("doff_id",id).maybeSingle();if(existing)throw new Error("That Duty Officer is already assigned");const {error}=await supabase.from("character_doffs" as never).insert({user_id:u.user.id,character_id:characterId,doff_id:id,active:true});if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["character_ops_doffs",characterId]});toast.success("Duty Officer added to character");},onError:(e:any)=>toast.error(e?.message||"Could not add Duty Officer")});
  const removeDoff=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from("character_doffs" as never).update({active:false}).eq("id",id);if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:["character_ops_doffs",characterId]})});
  const filteredDoffs=useMemo(()=>((doffCatalog.data as any[])||[]).filter((d:any)=>{const q=doffSearch.trim().toLowerCase();return !q||[d.name,d.department,d.specialization,d.domain].filter(Boolean).join(" ").toLowerCase().includes(q);}),[doffCatalog.data,doffSearch]);
  const shipCount = new Set(
    (ships.data ?? []).filter((ship: any) => ship.ownership_status === "owned").map((ship: any) => ship.sto_ship_id).filter(Boolean),
  ).size;
  const shipUnlockCount = shipUnlocks.data?.length ?? 0;
  const activeTraits = personalTraits.data?.filter((t: any) => t.active !== false).length ?? 0;
  const activeBoffs = bridgeOfficers.data?.filter((b: any) => b.active !== false).length ?? 0;

  return (
    <section className="panel space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="lcars-label">Captain operations</p>
          <h3 className="font-display text-lg text-primary">{characterName} — connected assets</h3>
          <p className="mt-1 text-xs text-muted-foreground">Character-scoped ships and equipment stay separated from every other captain.</p>
        </div>
        <div className="text-xs text-accent">{shipCount} owned ships · {equipment.data?.length ?? 0} equipment items</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <OpsCard icon={<Rocket className="size-4" />} label="Ships" value={shipCount} detail={(ships.data ?? []).filter((s: any) => s.ownership_status === "owned").slice(0, 3).map((s: any) => s.custom_name || s.sto_ships?.name).join(" · ") || "None registered"} />
        <OpsCard icon={<Package className="size-4" />} label="Equipment" value={equipment.data?.length ?? 0} detail={(equipment.data ?? []).slice(0, 3).map((e: any) => [e.name, e.mark_level ? `Mk${e.mark_level}` : e.mark, e.rarity].filter(Boolean).join(" ")).join(" · ") || "None assigned"} />
        <OpsCard icon={<Rocket className="size-4" />} label="Ship unlocks" value={shipUnlockCount} detail={(shipUnlocks.data ?? []).slice(0, 3).map((u: any) => u.name).filter(Boolean).join(" · ") || "No ship-derived unlocks"} />
        <OpsCard icon={<UserRound className="size-4" />} label="Personal traits" value={activeTraits} detail={(personalTraits.data ?? []).slice(0, 4).map((t: any) => t.trait_catalog?.name).filter(Boolean).join(" · ") || "No personal traits assigned"} />
        <OpsCard icon={<UserRound className="size-4" />} label="Bridge officers" value={activeBoffs} detail={(bridgeOfficers.data ?? []).slice(0, 4).map((b: any) => b.name).filter(Boolean).join(" · ") || "No bridge officers assigned"} />
        <OpsCard icon={<Package className="size-4" />} label="Duty officers" value={doffs.data?.length ?? 0} detail={(doffs.data ?? []).slice(0, 4).map((d:any)=>d.doff_catalog?.name).filter(Boolean).join(" · ") || "No Duty Officers assigned"} />
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="text-xs uppercase tracking-wider text-accent">Ship-derived unlocks</p><p className="text-[11px] text-muted-foreground">Traits, unique consoles and special/experimental weapons provided by ships assigned to this captain.</p></div>
          <span className="text-[11px] text-muted-foreground">{shipUnlockCount} recorded</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {(shipUnlocks.data ?? []).map((unlock: any) => (
            <div key={unlock.id} className="flex items-center justify-between gap-2 rounded border border-border bg-background/30 px-2 py-1.5 text-xs">
              <span className="min-w-0 truncate">{unlock.name}<span className="ml-2 text-muted-foreground">{unlock.sto_ships?.name ?? "Ship"}</span></span>
              <Badge variant="outline">{unlock.unlock_type === "ship_trait" ? "Trait" : unlock.unlock_type === "console" ? "Console" : "Special weapon"}</Badge>
            </div>
          ))}
          {!shipUnlocks.isLoading && (shipUnlocks.data ?? []).length === 0 && <p className="text-xs text-muted-foreground">No ship-derived unlocks recorded yet.</p>}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-accent">Bridge Officer roster</p><p className="text-[11px] text-muted-foreground">Record the actual BOFFs assigned to this captain.</p></div><span className="text-[11px] text-muted-foreground">{activeBoffs} assigned</span></div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2"><Input placeholder="BOFF name" value={boffName} onChange={e=>setBoffName(e.target.value)}/><Input placeholder="Career / specialization" value={boffCareer} onChange={e=>setBoffCareer(e.target.value)}/></div>
        <Button size="sm" className="mt-2" onClick={async()=>{if(!boffName.trim()){toast.error("Enter a BOFF name");return;}const {data:u}=await supabase.auth.getUser();if(!u.user)return;const {error}=await supabase.from("character_boffs" as never).insert({user_id:u.user.id,character_id:characterId,name:boffName.trim(),career:boffCareer.trim()||null,active:true});if(error)toast.error(error.message);else{setBoffName("");setBoffCareer("");toast.success("Bridge Officer added");qc.invalidateQueries({queryKey:["character_ops_boffs",characterId]});}}}>Add Bridge Officer</Button>
        <div className="mt-2 space-y-1">{(bridgeOfficers.data??[]).map((b:any)=><div key={b.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"><span>{b.name}{b.career?<span className="ml-2 text-muted-foreground">{b.career}</span>:""}</span><Button size="icon" variant="ghost" className="size-7" onClick={async()=>{const {error}=await supabase.from("character_boffs" as never).update({active:false}).eq("id",b.id);if(error)toast.error(error.message);else qc.invalidateQueries({queryKey:["character_ops_boffs",characterId]});}}><Trash2 className="size-3.5"/></Button></div>)}</div>
      </div>
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-accent">Personal trait roster</p><p className="text-[11px] text-muted-foreground">Search Space and Ground personal traits and assign them to this captain.</p></div><span className="text-[11px] text-muted-foreground">{activeTraits} assigned</span></div>
        <div className="relative mt-2"><Search className="absolute left-2 top-2 size-4 text-muted-foreground"/><Input className="h-8 pl-8" value={traitSearch} onChange={e=>setTraitSearch(e.target.value)} placeholder="Search personal traits…"/></div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{((characterTraitCatalog.data as any[])||[]).filter((t:any)=>{const q=traitSearch.trim().toLowerCase();return !q||[t.name,t.trait_type,t.domain,t.trait_category,t.description].filter(Boolean).join(" ").toLowerCase().includes(q);}).slice(0,40).map((t:any)=>{const assigned=(personalTraits.data??[]).some((x:any)=>x.trait_id===t.id&&x.active!==false);return <div key={t.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs"><span className="min-w-0 truncate">{t.name}<span className="ml-2 text-muted-foreground">{t.domain}</span></span><Button size="sm" variant="outline" disabled={assigned||addCharacterTrait.isPending} onClick={()=>addCharacterTrait.mutate(t)}>{assigned?"Added":"Add"}</Button></div>})}</div>
        <div className="mt-2 space-y-1">{(personalTraits.data??[]).filter((t:any)=>t.active!==false).map((t:any)=><div key={t.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"><span>{t.trait_catalog?.name||"Trait"}<span className="ml-2 text-muted-foreground">{t.domain}</span></span><Button size="icon" variant="ghost" className="size-7" onClick={()=>removeCharacterTrait.mutate(t.id)}><Trash2 className="size-3.5"/></Button></div>)}</div>
      </div>
      <div className="rounded-lg border border-border bg-muted/10 p-3">
        <div className="flex items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-accent">Duty Officer roster</p><p className="text-[11px] text-muted-foreground">Search the catalogue and assign DOffs to this captain.</p></div><span className="text-[11px] text-muted-foreground">{doffs.data?.length ?? 0} assigned</span></div>
        <div className="relative mt-2"><Search className="absolute left-2 top-2 size-4 text-muted-foreground"/><Input className="h-8 pl-8" value={doffSearch} onChange={e=>setDoffSearch(e.target.value)} placeholder="Search Duty Officers…"/></div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{filteredDoffs.slice(0,40).map((d:any)=>{const assigned=(doffs.data??[]).some((x:any)=>x.doff_id===d.id);return <div key={d.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs"><span className="min-w-0 truncate">{d.name}<span className="ml-2 text-muted-foreground">{d.department||d.specialization||d.domain||""}</span></span><Button size="sm" variant="outline" disabled={assigned||addDoff.isPending} onClick={()=>addDoff.mutate(d.id)}>{assigned?"Added":"Add"}</Button></div>})}</div>
        <div className="mt-2 space-y-1">{(doffs.data??[]).map((d:any)=><div key={d.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-xs"><span>{d.doff_catalog?.name||"Duty Officer"}</span><Button size="icon" variant="ghost" className="size-7" onClick={()=>removeDoff.mutate(d.id)}><Trash2 className="size-3.5"/></Button></div>)}</div>
      </div>
    </section>
  );
}

function OpsCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return (
    <div className="rounded border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-accent">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 font-display text-2xl text-primary">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
