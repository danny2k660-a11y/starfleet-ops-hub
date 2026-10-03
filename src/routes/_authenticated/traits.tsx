import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Sparkles, UserRound, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const categoryLabels: Record<string,string> = {
  personal: "Personal",
  starship: "Starship",
  reputation: "Reputation",
  activereputation: "Active Reputation",
  species: "Species",
  other: "Other",
};
const domainLabels: Record<string,string> = { space: "Space", ground: "Ground" };
const personalCategoryLabel = (type: string, domain: string, active = false) => {
  if (type === "reputation") return `${domainLabels[domain] ?? domain} Reputation`;
  if (type === "activereputation") return `Active ${domainLabels[domain] ?? domain} Reputation`;
  if (type === "reputation") return `${active ? "Active " : ""}${domainLabels[domain] ?? domain} Reputation`;
  return `Personal ${domainLabels[domain] ?? domain}`;
};
const personalBuckets = [
  { key: "space", title: "Personal Space Traits", types: ["personal"], domain: "space", availability: "general" },
  { key: "ground", title: "Personal Ground Traits", types: ["personal"], domain: "ground", availability: "general" },
  { key: "space-species", title: "Species-specific Space Traits", types: ["personal"], domain: "space", availability: "species" },
  { key: "ground-species", title: "Species-specific Ground Traits", types: ["personal"], domain: "ground", availability: "species" },
  { key: "space-innate", title: "Innate / Required Space Traits", types: ["personal"], domain: "space", availability: "innate" },
  { key: "ground-innate", title: "Innate / Required Ground Traits", types: ["personal"], domain: "ground", availability: "innate" },
  { key: "space-reputation", title: "Passive Space Reputation", types: ["reputation"], domain: "space", active: false },
  { key: "ground-reputation", title: "Passive Ground Reputation", types: ["reputation"], domain: "ground", active: false },
  { key: "space-active", title: "Active Space Reputation", types: ["reputation"], domain: "space", active: true },
  { key: "ground-active", title: "Active Ground Reputation", types: ["reputation"], domain: "ground", active: true },
] as const;

export const Route = createFileRoute("/_authenticated/traits")({
  head: () => ({ meta: [{ title: "Traits — STO Command Center" }, { name: "description", content: "Track personal ground and space traits, reputation traits and starship traits." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [q,setQ] = useState("");
  const [open,setOpen] = useState(false);
  const [mode,setMode] = useState<"personal"|"starship">("personal");
  const [name,setName] = useState("");
  const [catalogId,setCatalogId] = useState("");
  const [category,setCategory] = useState("personal");
  const [domain,setDomain] = useState("space");
  const [slotIndex,setSlotIndex] = useState("");
  const [notes,setNotes] = useState("");
  const [characterId,setCharacterId] = useState("");
  const [loadoutId,setLoadoutId] = useState("");
  const [repExtra,setRepExtra] = useState(false);

  const syncCatalog = useMutation({ mutationFn: async () => { const { data, error } = await supabase.functions.invoke("sync-trait-catalog", { body: {} }); if (error) throw error; if (!data?.ok) throw new Error(data?.error ?? "Trait catalogue sync failed"); return data; }, onSuccess: (data) => { qc.invalidateQueries({ queryKey:["trait_catalog"] }); toast.success(`Trait catalogue synced: ${data.imported} records`); }, onError: (e:Error) => toast.error(e.message) });
  const catalog = useQuery({ queryKey:["trait_catalog"], queryFn:async()=>{ const {data,error}=await supabase.from("trait_catalog" as never).select("*").order("name"); if(error)throw error; return (data??[]) as any[]; }});
  const characters = useQuery({ queryKey:["trait_characters"], queryFn:async()=>{ const {data,error}=await supabase.from("characters").select("id,name,level,species,elite_captain").order("name"); if(error)throw error; return data??[]; }});
  const loadouts = useQuery({ queryKey:["trait_loadouts"], queryFn:async()=>{ const {data,error}=await supabase.from("loadouts").select("id,name,build_id").order("updated_at",{ascending:false}); if(error)throw error; return data??[]; }});
  const builds = useQuery({ queryKey:["trait_builds"], queryFn:async()=>{ const {data,error}=await supabase.from("builds").select("id,name,user_ship_id").order("updated_at",{ascending:false}); if(error)throw error; return data??[]; }});
  const userShips = useQuery({ queryKey:["trait_user_ships"], queryFn:async()=>{ const {data,error}=await supabase.from("user_ships").select("id,character_id,custom_name,sto_ships(name)").order("created_at",{ascending:false}); if(error)throw error; return data??[] as any[]; }});
  const slotUnlocks = useQuery({ queryKey:["character_trait_slot_unlocks"], queryFn:async()=>{ const {data,error}=await supabase.from("character_trait_slot_unlocks" as never).select("*"); if(error)throw error; return (data??[]) as any[]; }});
  const characterTraits = useQuery({ queryKey:["character_traits"], queryFn:async()=>{ const {data,error}=await supabase.from("character_traits" as never).select("*").order("created_at",{ascending:false}); if(error)throw error; return (data??[]) as any[]; }});
  const loadoutTraits = useQuery({ queryKey:["loadout_traits"], queryFn:async()=>{ const {data,error}=await supabase.from("loadout_traits" as never).select("*").order("created_at",{ascending:false}); if(error)throw error; return (data??[]) as any[]; }});

  const catalogById = useMemo(()=>new Map((catalog.data??[]).map(t=>[t.id,t])),[catalog.data]);
  const characterById = useMemo(()=>new Map((characters.data??[]).map((c:any)=>[c.id,c])),[characters.data]);
  const buildById = useMemo(()=>new Map((builds.data??[]).map((b:any)=>[b.id,b])),[builds.data]);
  const loadoutById = useMemo(()=>new Map((loadouts.data??[]).map((l:any)=>[l.id,l])),[loadouts.data]);
  const shipById = useMemo(()=>new Map((userShips.data??[]).map((s:any)=>[s.id,s])),[userShips.data]);

  const reset=()=>{setName("");setCatalogId("");setCategory(mode==="personal"?"personal":"starship");setDomain("space");setSlotIndex("");setNotes("");setCharacterId("");setLoadoutId("");setRepExtra(false);};
  const selectedCharacter = useMemo(()=> (characters.data??[]).find((c:any)=>c.id===characterId),[characters.data,characterId]);
  const personalSlotLimit = (character:any) => {
    const level = Number(character?.level ?? 1);
    const alien = String(character?.species ?? "").toLowerCase() === "alien";
    const base = 3 + Math.min(6, Math.floor(level / 10));
    const speciesBonus = alien ? 1 : 0;
    const eliteBonus = character?.elite_captain ? 1 : 0;
    return base + speciesBonus + eliteBonus;
  };
  const reputationSlotLimit = (characterId:string, group:string) => 4 + ((slotUnlocks.data??[]).some((u:any)=>u.character_id===characterId && u.slot_group===group && u.unlocked) ? 1 : 0);

  const traitMatchesCharacter = (t:any, character:any) => {
    if (!character) return false;
    const norm = (v:any) => String(v ?? "").trim().toLowerCase();
    const restriction = norm(t.species_restriction);
    if (restriction && restriction !== "all" && restriction !== norm(character.species)) return false;
    const careerRestriction = norm(t.career_restriction);
    if (careerRestriction && careerRestriction !== "all" && careerRestriction !== norm(character.career)) return false;
    const factionRestriction = norm(t.faction_restriction);
    if (factionRestriction && factionRestriction !== "all" && factionRestriction !== norm(character.faction)) return false;
    const availability = norm(t.availability_type || t.availability);
    if (availability === "species" && !t.species_restriction && !String(character.species ?? "").trim()) return false;
    return true;
  };

  const personalTraits = useMemo(()=> (characterTraits.data??[]).filter((t:any)=>{
    const c:any=catalogById.get(t.trait_id);
    const text=(String(c?.name??t.name??"")+" "+String(c?.trait_type??t.trait_category??"")+" "+String(c?.domain??t.domain??"")+" "+String(t.notes??"")+" "+String(characterById.get(t.character_id)?.name??"")).toLowerCase();
    return text.includes(q.toLowerCase());
  }),[characterTraits.data,catalogById,characterById,q]);

  const shipTraits = useMemo(()=> (loadoutTraits.data??[]).filter((t:any)=>{
    const c:any=catalogById.get(t.trait_id);
    const l:any=loadoutById.get(t.loadout_id); const b:any=buildById.get(l?.build_id); const s:any=shipById.get(b?.user_ship_id);
    const text=(String(c?.name??t.name??"")+" "+String(b?.name??"")+" "+String(s?.custom_name??s?.sto_ships?.name??"")).toLowerCase();
    return text.includes(q.toLowerCase());
  }),[loadoutTraits.data,catalogById,loadoutById,buildById,shipById,q]);

  const savePersonal = useMutation({ mutationFn:async()=>{
    const {data:u}=await supabase.auth.getUser(); if(!u.user)throw new Error("Not signed in");
    if(!characterId||!name.trim())throw new Error("Character and trait name are required");
    const cat:any = catalogId ? catalogById.get(catalogId) : null;
    const traitDomain = cat?.domain ?? domain;
    const traitCategory = cat?.trait_type ?? category;
    const isActiveRep = traitCategory === "activereputation" || (traitCategory === "reputation" && Boolean(cat?.is_active_ability));
    const slotGroup = traitCategory === "reputation" || traitCategory === "activereputation"
      ? `${traitDomain}_${isActiveRep ? "active_reputation" : "reputation"}`
      : `${traitDomain}_personal`;
    const limit = traitCategory === "reputation" || traitCategory === "activereputation" ? reputationSlotLimit(characterId, slotGroup) : personalSlotLimit(selectedCharacter);
    const requestedSlot = slotIndex ? Number(slotIndex) : null;
    if (requestedSlot !== null && (requestedSlot < 1 || requestedSlot > limit)) throw new Error(`Slot must be between 1 and ${limit} for this character/category`);
    const payload:any={user_id:u.user.id,character_id:characterId,trait_id:catalogId||null,source:"manual",notes:notes.trim()||null,active:true,slot_index:requestedSlot,domain:traitDomain,trait_category:traitCategory,availability_type:cat?.availability_type??"general",slot_group:slotGroup};
    const {error}=await supabase.from("character_traits" as never).insert(payload); if(error)throw error;
    if ((traitCategory === "reputation" || traitCategory === "activereputation") && repExtra) { const {error:unlockError}=await supabase.from("character_trait_slot_unlocks" as never).upsert({user_id:u.user.id,character_id:characterId,slot_group:slotGroup,source:"Fleet Research Lab",unlocked:true},{onConflict:"character_id,slot_group,source"}); if(unlockError)throw unlockError; }
  },onSuccess:()=>{qc.invalidateQueries({queryKey:["character_traits"]});qc.invalidateQueries({queryKey:["character_trait_slot_unlocks"]});toast.success("Personal trait added");setOpen(false);reset();setRepExtra(false);},onError:(e:Error)=>toast.error(e.message)});

  const saveStarship = useMutation({ mutationFn:async()=>{
    if(!loadoutId||!name.trim())throw new Error("Loadout and trait name are required");
    const cat:any= catalogById.get(catalogId);
    if(catalogId && cat?.trait_type!=="starship")throw new Error("Only starship traits can be assigned to a ship loadout");
    const {error}=await supabase.from("loadout_traits" as never).insert({loadout_id:loadoutId,trait_id:catalogId||null,trait_type:"starship",name:name.trim(),slot:slotIndex.trim()||null}); if(error)throw error;
  },onSuccess:()=>{qc.invalidateQueries({queryKey:["loadout_traits"]});toast.success("Starship trait assigned");setOpen(false);reset();},onError:(e:Error)=>toast.error(e.message)});

  const removePersonal=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from("character_traits" as never).delete().eq("id",id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["character_traits"]});toast.success("Personal trait removed")},onError:(e:Error)=>toast.error(e.message)});
  const removeStarship=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from("loadout_traits").delete().eq("id",id);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["loadout_traits"]});toast.success("Starship trait removed")},onError:(e:Error)=>toast.error(e.message)});

  const openPersonal=()=>{setMode("personal");reset();setOpen(true)};
  const openStarship=()=>{setMode("starship");reset();setOpen(true)};

  return <AppShell title="Traits" subtitle="Personal ground/space traits and starship traits"><div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="lcars-label">Trait control</p><h1 className="font-display text-2xl text-primary">Traits</h1><p className="text-sm text-muted-foreground">Personal traits are character-owned. Starship traits belong to the ship loadout. Ground and space are tracked separately.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>syncCatalog.mutate()} disabled={syncCatalog.isPending}><RefreshCw className={`mr-1 size-4 ${syncCatalog.isPending?"animate-spin":""}`}/> {syncCatalog.isPending?"Syncing…":"Sync canonical catalogue"}</Button><Button onClick={openPersonal}><UserRound className="mr-1 size-4"/> Add personal trait</Button><Button variant="outline" onClick={openStarship}><Plus className="mr-1 size-4"/> Assign starship trait</Button></div>
    </div>
    <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search traits, characters, builds or ships…" value={q} onChange={e=>setQ(e.target.value)}/></div>
    {(catalog.isError||characters.isError||loadouts.isError||builds.isError||characterTraits.isError||loadoutTraits.isError) && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-medium text-destructive">Trait data could not be fully loaded.</p><p className="mt-1 text-muted-foreground">Refresh the page and try again.</p></div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel p-4 lg:col-span-2"><div className="mb-4 flex items-center justify-between"><div><p className="lcars-label">Character-owned</p><h2 className="font-display text-lg text-primary">Personal Traits</h2><p className="text-xs text-muted-foreground">Separate Space and Ground traits, including Reputation and Active Reputation traits.</p></div><Badge variant="secondary">{personalTraits.length}</Badge></div><div className="grid gap-4 md:grid-cols-2">
        {personalBuckets.map(bucket=>{const bucketTraits=personalTraits.filter((t:any)=>{const ct:any=catalogById.get(t.trait_id);const availability = String(ct?.availability_type ?? "general"); const wanted = String((bucket as any).availability ?? "general"); const active = Boolean(ct?.is_active_ability) || ct?.trait_type === "activereputation"; const bucketActive = (bucket as any).active; return (ct?.domain??t.domain)===(bucket.domain) && bucket.types.includes((ct?.trait_type??t.trait_category) as any) && wanted === availability && (bucketActive === undefined || bucketActive === active)});return <div key={bucket.key} className="rounded-lg border border-border bg-card/40 p-3"><div className="mb-3 flex items-center justify-between"><div><p className="font-medium text-primary">{bucket.title}</p><p className="text-xs text-muted-foreground">{bucket.domain==="space"?"Space":"Ground"} environment</p></div><Badge variant="outline">{bucketTraits.length}</Badge></div><div className="grid gap-2">
          {bucketTraits.map((t:any)=>{const ct:any=catalogById.get(t.trait_id);return <div key={t.id} className="rounded border border-border bg-card/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{ct?.name??"Unnamed trait"}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">{domainLabels[ct?.domain??t.domain]??"Unknown"}</Badge><Badge variant="outline">{categoryLabels[ct?.trait_type??t.trait_category]??"Personal"}</Badge>{t.active&&<Badge variant="outline">Active</Badge>}</div></div><Button size="icon" variant="ghost" onClick={()=>removePersonal.mutate(t.id)}><Trash2 className="size-4 text-destructive"/></Button></div><p className="mt-2 text-xs text-muted-foreground">{characterById.get(t.character_id)?.name??"Unknown character"}{t.slot_index!=null?" • Slot "+t.slot_index:""}{t.slot_group?` • ${t.slot_group.replaceAll("_"," ")}`:""}</p>{ct?.description&&<p className="mt-2 text-xs text-muted-foreground">{ct.description}</p>}</div>})}
          {!bucketTraits.length&&<div className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">No traits assigned.</div>}
        </div></div>})}
      </div></section>
      <section className="panel p-4"><div className="mb-3 flex items-center justify-between"><div><p className="lcars-label">Ship loadouts</p><h2 className="font-display text-lg text-primary">Starship Traits</h2></div><Badge variant="secondary">{shipTraits.length}</Badge></div><div className="grid gap-3 sm:grid-cols-2">
        {shipTraits.map((t:any)=>{const c:any=catalogById.get(t.trait_id);const l:any=loadoutById.get(t.loadout_id);const b:any=buildById.get(l?.build_id);const s:any=shipById.get(b?.user_ship_id);return <div key={t.id} className="rounded-lg border border-border bg-card/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{c?.name??t.name??"Unnamed trait"}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="secondary">Starship</Badge>{t.slot&&<Badge variant="outline">{t.slot}</Badge>}</div></div><Button size="icon" variant="ghost" onClick={()=>removeStarship.mutate(t.id)}><Trash2 className="size-4 text-destructive"/></Button></div><p className="mt-2 text-xs text-muted-foreground">{b?.name??"Build"} • {s?.custom_name||s?.sto_ships?.name||"Ship"} • {l?.name??"Loadout"}</p></div>})}
        {!shipTraits.length&&<div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"><Sparkles className="mx-auto mb-2 size-5"/>No starship traits assigned yet.</div>}
      </div></section>
    </div>
    <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v)reset()}}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle className="font-display text-primary">{mode==="personal"?"Add personal trait":"Assign starship trait"}</DialogTitle></DialogHeader><div className="grid gap-4">
      {mode==="personal" ? <>
        <div className="space-y-1"><Label>Character</Label><Select value={characterId} onValueChange={setCharacterId}><SelectTrigger><SelectValue placeholder="Choose character"/></SelectTrigger><SelectContent>{(characters.data??[]).map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name}{c.level!=null?" — Lv "+c.level:""}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Catalogue personal trait</Label><Select value={catalogId} onValueChange={v=>{setCatalogId(v);const t:any=(catalog.data??[]).find((x:any)=>x.id===v);if(t){setName(t.name);setCategory(t.trait_type??"personal");setDomain(t.domain??"space");setNotes(t.description??"");}}}><SelectTrigger><SelectValue placeholder="Choose an eligible personal, species or reputation trait"/></SelectTrigger><SelectContent>{(catalog.data??[]).filter((t:any)=>t.trait_type!=="starship" && traitMatchesCharacter(t, selectedCharacter)).map((t:any)=><SelectItem key={t.id} value={t.id}>{t.name} — {personalCategoryLabel(t.trait_type, t.domain, Boolean(t.is_active_ability))}</SelectItem>)}</SelectContent></Select></div>
        <div className="rounded border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">Personal traits are stored on the character, not on the ship. At level 65 the normal personal pool is 9 Ground + 9 Space slots; Alien characters receive one additional Ground + Space slot, and Elite Captains receive one additional Ground + Space slot. Reputation has separate 4-slot Passive Ground, Passive Space, Active Ground and Active Space categories, with separate Fleet Research Lab expansions.</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Environment</Label><Select value={domain} onValueChange={setDomain}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="space">Space</SelectItem><SelectItem value="ground">Ground</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(categoryLabels).filter(([k])=>k!=="starship").map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="space-y-1"><Label>Slot number</Label><Input type="number" min="1" value={slotIndex} onChange={e=>setSlotIndex(e.target.value)} placeholder="Optional slot"/><p className="text-xs text-muted-foreground">Personal {domain === "space" ? "Space" : "Ground"} slots: {selectedCharacter ? personalSlotLimit(selectedCharacter) : "choose a character first"}.</p></div><div className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" checked={repExtra} onChange={e=>setRepExtra(e.target.checked)} disabled={category!=="reputation" && category!=="activereputation"} /><span>Fleet Research Lab +1 reputation slot for this Ground/Space category</span></div>
      </> : <>
        <div className="space-y-1"><Label>Loadout</Label><Select value={loadoutId} onValueChange={setLoadoutId}><SelectTrigger><SelectValue placeholder="Choose a ship loadout"/></SelectTrigger><SelectContent>{(loadouts.data??[]).map((l:any)=>{const b:any=buildById.get(l.build_id);const s:any=shipById.get(b?.user_ship_id);return <SelectItem key={l.id} value={l.id}>{b?.name??"Build"} — {s?.custom_name||s?.sto_ships?.name||"Ship"} — {l.name}</SelectItem>})}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Catalogue starship trait</Label><Select value={catalogId} onValueChange={v=>{setCatalogId(v);const t:any=(catalog.data??[]).find((x:any)=>x.id===v);if(t){setName(t.name);setNotes(t.description??"");}}}><SelectTrigger><SelectValue placeholder="Choose a canonical starship trait"/></SelectTrigger><SelectContent>{(catalog.data??[]).filter((t:any)=>t.trait_type==="starship").map((t:any)=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Trait name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Starship trait name"/></div>
        <div className="space-y-1"><Label>Trait slot</Label><Input value={slotIndex} onChange={e=>setSlotIndex(e.target.value)} placeholder="1, 2, 3, 4, extra…"/></div>
      </>}
      <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Source, theme role, or setup notes…"/></div>
    </div><DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button onClick={()=>mode==="personal"?savePersonal.mutate():saveStarship.mutate()} disabled={savePersonal.isPending||saveStarship.isPending}>{savePersonal.isPending||saveStarship.isPending?"Saving…":"Save trait"}</Button></DialogFooter></DialogContent></Dialog>
  </div></AppShell>;
}
