import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, Shield, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/ground-builds")({
  head: () => ({ meta: [{ title: "Ground Builds — STO Command Center" }, { name: "description", content: "Character ground loadouts for weapons, armor, shields, kits, modules and devices." }] }),
  component: GroundBuildsPage,
});

const SLOTS = [
  ["primary_weapon","Primary weapon"],["secondary_weapon","Secondary weapon"],["armor","Armor"],["personal_shield","Personal shield"],
  ["kit","Kit"],["kit_module_1","Kit module 1"],["kit_module_2","Kit module 2"],["kit_module_3","Kit module 3"],["kit_module_4","Kit module 4"],["kit_module_5","Kit module 5"],
  ["device_1","Device 1"],["device_2","Device 2"],
] as const;

type Character={id:string;name:string};
type Build={id:string;name:string;character_id:string|null};
type Loadout={id:string;build_id:string;name:string;notes:string|null};
type Equipment={id:string;name:string;character_id:string|null;rarity:string|null;mark:string|null};

function GroundBuildsPage(){
  const qc=useQueryClient();
  const [character,setCharacter]=useState("");
  const [name,setName]=useState("");
  const [notes,setNotes]=useState("");
  const [selectedLoadout,setSelectedLoadout]=useState("");
  const [slotValues,setSlotValues]=useState<Record<string,string>>({});
  const characters=useQuery({queryKey:["characters"],queryFn:async()=>{const {data,error}=await supabase.from("characters").select("id,name").order("name");if(error)throw error;return(data??[]) as Character[]}});
  const builds=useQuery({queryKey:["ground_builds"],queryFn:async()=>{const {data,error}=await supabase.from("builds").select("id,name,character_id").eq("build_domain","ground").order("updated_at",{ascending:false});if(error)throw error;return(data??[]) as Build[]}});
  const loadouts=useQuery({queryKey:["ground_loadouts"],queryFn:async()=>{const {data,error}=await supabase.from("build_ground_loadouts").select("*").order("updated_at",{ascending:false});if(error)throw error;return(data??[]) as Loadout[]}});
  const equipment=useQuery({queryKey:["equipment_items"],queryFn:async()=>{const {data,error}=await supabase.from("equipment_items").select("id,name,character_id,rarity,mark").order("name");if(error)throw error;return(data??[]) as Equipment[]}});
  const selected=loadouts.data?.find(x=>x.id===selectedLoadout);
  const currentBuild=builds.data?.find(x=>x.id===selected?.build_id);
  const characterEquipment=useMemo(()=>equipment.data?.filter(x=>!character||!x.character_id||x.character_id===character)??[],[equipment.data,character]);
  const create=useMutation({mutationFn:async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user)throw new Error("Not signed in");if(!character)throw new Error("Choose a character.");if(!name.trim())throw new Error("Name the ground build.");const {data:b,error:be}=await supabase.from("builds").insert({user_id:u.user.id,character_id:character,name:name.trim(),build_domain:"ground",status:"draft",role:"Ground",notes:notes.trim()||null} as never).select("id").single();if(be)throw be;const {data:l,error:le}=await supabase.from("build_ground_loadouts").insert({user_id:u.user.id,build_id:b.id,name:name.trim()+" Loadout",notes:notes.trim()||null,is_active:true}).select("id").single();if(le)throw le;setSelectedLoadout(l.id);setName("");},onSuccess:()=>{qc.invalidateQueries({queryKey:["ground_builds"]});qc.invalidateQueries({queryKey:["ground_loadouts"]});toast.success("Ground build created.");},onError:(e:Error)=>toast.error(e.message)});
  const save=useMutation({mutationFn:async()=>{if(!selected)throw new Error("Select a ground build.");const entries=Object.entries(slotValues).filter(([,v])=>v&&v!=="none");const {error:de}=await supabase.from("ground_loadout_equipment").delete().eq("loadout_id",selected.id);if(de)throw de;const rows=entries.map(([slot,equipment_item_id])=>({loadout_id:selected.id,equipment_item_id,slot}));if(rows.length){const {error:ie}=await supabase.from("ground_loadout_equipment").insert(rows as never[]);if(ie)throw ie;}const {error:ue}=await supabase.from("build_ground_loadouts").update({notes:notes.trim()||null} as never).eq("id",selected.id);if(ue)throw ue;},onSuccess:()=>{qc.invalidateQueries({queryKey:["ground_loadouts"]});toast.success("Ground loadout saved.");},onError:(e:Error)=>toast.error(e.message)});
  const remove=useMutation({mutationFn:async()=>{if(!currentBuild)throw new Error("Select a build.");const {error}=await supabase.from("builds").delete().eq("id",currentBuild.id);if(error)throw error;},onSuccess:()=>{setSelectedLoadout("");setSlotValues({});qc.invalidateQueries({queryKey:["ground_builds"]});qc.invalidateQueries({queryKey:["ground_loadouts"]});toast.success("Ground build removed.");},onError:(e:Error)=>toast.error(e.message)});
  const select=async(id:string)=>{setSelectedLoadout(id);setSlotValues({});const l=loadouts.data?.find(x=>x.id===id);setNotes(l?.notes??"");if(!l)return;const {data,error}=await supabase.from("ground_loadout_equipment").select("slot,equipment_item_id").eq("loadout_id",id);if(!error)setSlotValues(Object.fromEntries((data??[]).map((x:any)=>[x.slot,x.equipment_item_id])));};
  const buildsForCharacter=builds.data?.filter(b=>!character||b.character_id===character)??[];
  return <AppShell title="Ground Builds" subtitle="Complete character ground loadouts">
    <div className="space-y-6">
      <section className="panel p-4 sm:p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-primary"/><div><p className="lcars-label">Create</p><h2 className="font-display text-xl text-primary">Ground build</h2></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><div><Label>Character</Label><Select value={character} onValueChange={setCharacter}><SelectTrigger><SelectValue placeholder="Choose character"/></SelectTrigger><SelectContent>{(characters.data??[]).map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Build name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Terran Discovery Ground"/></div><div><Label>Theme / notes</Label><Input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Theme, role, restrictions…"/></div></div>
        <Button className="mt-3" onClick={()=>create.mutate()} disabled={create.isPending}><Plus className="mr-1 size-4"/>Create ground build</Button>
      </section>
      <section className="panel p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="lcars-label">Loadout editor</p><h2 className="font-display text-xl text-primary">Weapons, armour, kit & devices</h2></div><div className="w-full sm:w-72"><Select value={selectedLoadout} onValueChange={select}><SelectTrigger><SelectValue placeholder="Select ground build"/></SelectTrigger><SelectContent>{buildsForCharacter.map(b=>{const l=loadouts.data?.find(x=>x.build_id===b.id);return l?<SelectItem key={l.id} value={l.id}>{b.name}</SelectItem>:null})}</SelectContent></Select></div></div>
        {selected&&<><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SLOTS.map(([slot,label])=><div key={slot}><Label>{label}</Label><Select value={slotValues[slot]??""} onValueChange={v=>setSlotValues(x=>({...x,[slot]:v}))}><SelectTrigger><SelectValue placeholder="Not assigned"/></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{characterEquipment.map(item=><SelectItem key={item.id} value={item.id}>{item.name}{item.rarity?" · "+item.rarity:""}{item.mark?" · "+item.mark:""}</SelectItem>)}</SelectContent></Select></div>)}</div>
        <div className="mt-4"><Label>Loadout notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ground traits, kit strategy, visual/theme notes, etc."/></div>
        <div className="mt-4 flex flex-wrap gap-2"><Button onClick={()=>save.mutate()} disabled={save.isPending}><Save className="mr-1 size-4"/>Save loadout</Button><Button variant="destructive" onClick={()=>remove.mutate()} disabled={remove.isPending}><Trash2 className="mr-1 size-4"/>Delete build</Button></div></>}
        {!selected&&<p className="mt-4 text-sm text-muted-foreground">Create a ground build, then assign tracked equipment to each ground slot.</p>}
      </section>
      <section className="panel p-4 sm:p-5"><div className="flex items-center gap-3"><Crosshair className="size-5 text-primary"/><div><p className="lcars-label">Ground equipment</p><h2 className="font-display text-xl text-primary">12 tracked ground slots</h2></div></div><p className="mt-3 text-sm text-muted-foreground">Primary and secondary weapons, armor, personal shield, kit, five kit modules and two devices. Character-aware inventory is used so account/shared equipment can still be selected.</p></section>
    </div>
  </AppShell>;
}
