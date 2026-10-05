import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User, Shield, Database, Download, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — STO Command Center" }, { name: "description", content: "Account details and application preferences." }] }),
  component: Page,
});

function Page() {
  const account = useQuery({ queryKey:["settings-account"], queryFn: async () => { const { data, error } = await supabase.auth.getUser(); if(error) throw error; return data.user; } });
  const [displayName,setDisplayName]=useState("");
  const profile = useQuery({ queryKey:["settings-profile", account.data?.id], enabled:!!account.data, queryFn: async () => { const { data,error } = await supabase.from("profiles").select("display_name").eq("id",account.data!.id).maybeSingle(); if(error) throw error; return data; } });
  useEffect(() => { if (profile.data?.display_name) setDisplayName(profile.data.display_name); }, [profile.data?.display_name]);
  const [saving,setSaving]=useState(false);
  const [exporting,setExporting]=useState(false);
  const [importing,setImporting]=useState(false);

  const exportFleetData=async()=>{
    if(!account.data) return;
    setExporting(true);
    try{
      const userId=account.data.id;
      const result:Record<string,unknown>={exported_at:new Date().toISOString(),schema_version:2};
      const accountTables=["characters","user_ships","ship_instances","builds","loadouts","equipment_items","inventory_items","loadout_equipment","loadout_traits","loadout_boffs","sto_projects","sto_project_tasks","sto_resource_balances","character_boffs","character_ship_unlocks"] as const;
      const {data:profileRow,error:profileError}=await supabase.from("profiles").select("*").eq("id",userId).maybeSingle();
      if(profileError) throw new Error(`profiles: ${profileError.message}`);
      result.profiles=profileRow ? [profileRow] : [];
      const {data:catalog,error:catalogError}=await supabase.from("sto_ships").select("*");
      if(catalogError) throw new Error(`sto_ships: ${catalogError.message}`);
      result.sto_ships=catalog??[];
      const {data:rules,error:rulesError}=await supabase.from("theme_rules" as never).select("*");
      if(rulesError) throw new Error(`theme_rules: ${rulesError.message}`);
      result.theme_rules=rules??[];
      for(const table of accountTables){
        const {data,error}=await supabase.from(table).select("*").eq("user_id",userId);
        if(error) throw new Error(`${table}: ${error.message}`);
        result[table]=data??[];
      }
      const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");
      anchor.href=url;
      anchor.download=`sto-command-center-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      toast.success("Fleet backup exported");
    }catch(e){ toast.error(e instanceof Error?e.message:"Could not export fleet data"); }
    finally{setExporting(false);}
  };


  const importFleetData=async(file:File)=>{
    if(!account.data) return;
    setImporting(true);
    try{
      const parsed=JSON.parse(await file.text());
      if(!parsed || typeof parsed !== "object" || !Array.isArray(parsed.characters) || !Array.isArray(parsed.user_ships) || !Array.isArray(parsed.builds)) throw new Error("This is not a valid STO Command Center backup.");
      const userId=account.data.id;
      const tables=["characters","user_ships","ship_instances","builds","loadouts","equipment_items","inventory_items","loadout_equipment","loadout_traits","loadout_boffs","sto_projects","sto_project_tasks","sto_resource_balances","character_boffs","character_ship_unlocks"];
      const order=["characters","ship_instances","user_ships","builds","loadouts","equipment_items","inventory_items","loadout_equipment","loadout_traits","loadout_boffs","sto_projects","sto_project_tasks","sto_resource_balances","character_boffs","character_ship_unlocks"];
      for(const table of order){
        const rows=Array.isArray(parsed[table])?parsed[table].filter((row:any)=>row && row.user_id===userId):[];
        if(!rows.length) continue;
        const {error}=await supabase.from(table as never).upsert(rows as never,{onConflict:"id"});
        if(error) throw new Error(table+": "+error.message);
      }
      if(Array.isArray(parsed.profiles) && parsed.profiles[0]?.id===userId){const {error}=await supabase.from("profiles").upsert(parsed.profiles[0] as never,{onConflict:"id"});if(error) throw new Error("profiles: "+error.message);}
      toast.success("Fleet backup imported");
    }catch(e){toast.error(e instanceof Error?e.message:"Could not import fleet backup");}
    finally{setImporting(false);}
  };
  const saveProfile=async()=>{ if(!account.data) return; setSaving(true); const {error}=await supabase.from("profiles").update({display_name:displayName.trim()||null}).eq("id",account.data.id); setSaving(false); if(error) toast.error(error.message); else toast.success("Profile updated"); };
  return <AppShell title="Settings" subtitle="Account and preferences"><div className="mx-auto max-w-3xl space-y-5">
    <section className="panel p-5"><div className="flex items-center gap-3"><User className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Profile</h2><p className="text-sm text-muted-foreground">Your Command Center identity.</p></div></div><Separator className="my-4"/><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Email</Label><Input value={account.data?.email??""} readOnly/></div><div className="space-y-1"><Label>Display name</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Fleet commander"/></div></div><Button className="mt-4" onClick={saveProfile} disabled={!account.data||saving}>{saving?"Saving…":"Save profile"}</Button></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Security</h2><p className="text-sm text-muted-foreground">Authentication remains managed by Supabase.</p></div></div><Separator className="my-4"/><div className="grid gap-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Signed in as</span><span className="truncate">{account.data?.email??"Loading…"}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span>{account.data?.app_metadata?.provider??"Account"}</span></div></div></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Database className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Data</h2><p className="text-sm text-muted-foreground">Your fleet data stays in the existing backend.</p></div></div><Separator className="my-4"/><p className="text-sm text-muted-foreground">Create a local JSON backup of your Command Center data. Shared ship definitions and theme rules are included; account-owned records are explicitly scoped to the signed-in account.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={exportFleetData} disabled={exporting||!account.data}><Download className="mr-2 size-4"/>{exporting?"Preparing backup…":"Export fleet backup"}</Button><label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent/10"><Upload className="mr-2 size-4"/>{importing?"Importing…":"Import fleet backup"}<input type="file" accept=".json,application/json" className="hidden" disabled={importing||!account.data} onChange={e=>{const f=e.target.files?.[0];if(f) importFleetData(f);e.currentTarget.value="";}}/></label></div><p className="mt-2 text-xs text-muted-foreground">Import only restores rows belonging to your signed-in account and never imports the shared ship catalogue.</p></section>
  </div></AppShell>;
}
