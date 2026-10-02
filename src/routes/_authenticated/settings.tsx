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
import { User, Shield, Database, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — STO Command Center" }, { name: "description", content: "Account details and application preferences." }] }),
  component: Page,
});

function Page() {
  const account = useQuery({ queryKey:["settings-account"], queryFn: async () => { const { data, error } = await supabase.auth.getUser(); if(error) throw error; return data.user; } });
  const [displayName,setDisplayName]=useState("");
  const profile = useQuery({ queryKey:["settings-profile", account.data?.id], enabled:!!account.data, queryFn: async () => { const { data,error } = await supabase.from("profiles").select("display_name").eq("id",account.data!.id).maybeSingle(); if(error) throw error; return data; } });
  useEffect(() => {
    if (profile.data?.display_name) setDisplayName(profile.data.display_name);
  }, [profile.data?.display_name]);
  const [saving,setSaving]=useState(false);
  const [exporting,setExporting]=useState(false);
  const exportFleetData=async()=>{
    if(!account.data) return;
    setExporting(true);
    try{
      const tables=["profiles","characters","sto_ships","user_ships","ship_instances","builds","loadouts","equipment_items","inventory_items","loadout_equipment","loadout_traits","loadout_boffs","theme_rules","projects","project_tasks","resource_balances"] as const;
      const result:Record<string,unknown>={exported_at:new Date().toISOString(),schema_version:1};
      for(const table of tables){
        let query=supabase.from(table).select("*");
        if(table!=="sto_ships" && table!=="theme_rules") query=query.eq("user_id",account.data.id);
        const {data,error}=await query;
        if(error) throw new Error(`${table}: ${error.message}`);
        result[table]=data??[];
      }
      const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");
      anchor.href=url;
      anchor.download=`sto-command-center-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Fleet backup exported");
    }catch(e){
      toast.error(e instanceof Error?e.message:"Could not export fleet data");
    }finally{setExporting(false);}
  };
  const saveProfile=async()=>{ if(!account.data) return; setSaving(true); const {error}=await supabase.from("profiles").update({display_name:displayName.trim()||null}).eq("id",account.data.id); setSaving(false); if(error) toast.error(error.message); else toast.success("Profile updated"); };
  return <AppShell title="Settings" subtitle="Account and preferences"><div className="mx-auto max-w-3xl space-y-5">
    <section className="panel p-5"><div className="flex items-center gap-3"><User className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Profile</h2><p className="text-sm text-muted-foreground">Your Command Center identity.</p></div></div><Separator className="my-4"/><div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1"><Label>Email</Label><Input value={account.data?.email??""} readOnly/></div>
      <div className="space-y-1"><Label>Display name</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Fleet commander"/></div>
    </div><Button className="mt-4" onClick={saveProfile} disabled={!account.data||saving}>{saving?"Saving…":"Save profile"}</Button></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Security</h2><p className="text-sm text-muted-foreground">Authentication remains managed by Supabase.</p></div></div><Separator className="my-4"/><div className="grid gap-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Signed in as</span><span className="truncate">{account.data?.email??"Loading…"}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span>{account.data?.app_metadata?.provider??"Account"}</span></div></div></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Database className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Data</h2><p className="text-sm text-muted-foreground">Your fleet data stays in the existing backend.</p></div></div><Separator className="my-4"/><p className="text-sm text-muted-foreground">Create a local JSON backup of your Command Center data. Ship catalog definitions are included, while account-owned records remain scoped to your captain account.</p><Button className="mt-4" variant="outline" onClick={exportFleetData} disabled={exporting||!account.data}><Download className="mr-2 size-4"/>{exporting?"Preparing backup…":"Export fleet backup"}</Button></section>
  </div></AppShell>;
}
