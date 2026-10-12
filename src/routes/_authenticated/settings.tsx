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
import { User, Shield, Database, Download, Upload, Activity, ClipboardList } from "lucide-react";
import { recordAuditEvent } from "@/lib/audit";

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
  const diagnostics = useQuery({
    queryKey: ["settings-diagnostics", account.data?.id],
    enabled: !!account.data,
    queryFn: async () => {
      if (!account.data) throw new Error("Not signed in.");
      const userId = account.data.id;
      const [characters, ships, builds, loadouts, inventory, projects, resources, catalogue] = await Promise.all([
        supabase.from("characters").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_ships").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("ownership_status", "owned"),
        supabase.from("builds").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("loadouts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("resource_balances").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("sto_ships").select("id", { count: "exact", head: true }),
      ]);
      const errors = [characters, ships, builds, loadouts, inventory, projects, resources, catalogue].filter((result) => result.error);
      const firstError = errors[0]?.error;
      if (firstError) throw firstError;
      return {
        characters: characters.count ?? 0, ownedShips: ships.count ?? 0, builds: builds.count ?? 0,
        loadouts: loadouts.count ?? 0, inventory: inventory.count ?? 0, projects: projects.count ?? 0,
        resources: resources.count ?? 0, catalogueShips: catalogue.count ?? 0,
      };
    },
  });
  const auditLogs = useQuery({
    queryKey: ["user_audit_log", account.data?.id],
    enabled: !!account.data,
    queryFn: async () => {
      if (!account.data) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("user_audit_log").select("id,action,entity_type,entity_id,summary,created_at")
        .eq("user_id", account.data.id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const exportFleetData=async()=>{
    if(!account.data) return;
    setExporting(true);
    try{
      const userId=account.data.id;
      const result:Record<string,unknown>={exported_at:new Date().toISOString(),schema_version:3,account_id:userId};
      const accountTables=["characters","user_ships","sto_ship_ownership","ship_instances","builds","build_versions","loadouts","equipment_items","inventory_items","loadout_equipment","projects","project_tasks","resource_balances","character_boffs","character_bridge_officers","character_reputations","character_traits","character_duty_officers","character_doffs","character_trait_slot_unlocks","build_ground_loadouts","theme_rules"] as const;
      const {data:profileRow,error:profileError}=await supabase.from("profiles").select("*").eq("id",userId).maybeSingle();
      if(profileError) throw new Error(`profiles: ${profileError.message}`);
      result["profiles"]=profileRow ? [profileRow] : [];
      const {data:catalog,error:catalogError}=await supabase.from("sto_ships").select("*");
      if(catalogError) throw new Error(`sto_ships: ${catalogError.message}`);
      result["sto_ships"]=catalog??[];
      for(const table of accountTables){
        const {data,error}=await supabase.from(table).select("*").eq("user_id",userId);
        if(error) throw new Error(`${table}: ${error.message}`);
        result[table]=data??[];
      }
      const loadoutIds=((result["loadouts"] as Array<{id:string}>|undefined)??[]).map(row=>row.id);
      const buildIds=((result["builds"] as Array<{id:string}>|undefined)??[]).map(row=>row.id);
      const groundIds=((result["build_ground_loadouts"] as Array<{id:string}>|undefined)??[]).map(row=>row.id);
      for(const [table,foreignKey,parentIds] of [
        ["loadout_traits","loadout_id",loadoutIds],
        ["loadout_boffs","loadout_id",loadoutIds],
        ["loadout_duty_officers","loadout_id",loadoutIds],
        ["loadout_hangar_pets","loadout_id",loadoutIds],
        ["build_doffs","build_id",buildIds],
        ["build_readiness_checks","build_id",buildIds],
        ["ground_loadout_equipment","loadout_id",groundIds],
      ] as const){
        if(!parentIds.length){result[table]=[];continue;}
        const {data,error}=await supabase.from(table as never).select("*").in(foreignKey as never,parentIds as never);
        if(error) throw new Error(`${table}: ${error.message}`);
        result[table]=data??[];
      }
      const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");
      anchor.href=url;
      anchor.download=`sto-command-center-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      await recordAuditEvent("backup_export", "backup", null, "Fleet backup exported", { schema_version: 3, table_count: accountTables.length });
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
      const sourceUserId=typeof parsed.account_id==="string"?parsed.account_id:userId;
      const order=["characters","ship_instances","builds","user_ships","sto_ship_ownership","build_versions","loadouts","equipment_items","inventory_items","loadout_equipment","projects","project_tasks","resource_balances","character_boffs","character_bridge_officers","character_reputations","character_traits","character_duty_officers","character_doffs","character_trait_slot_unlocks","build_ground_loadouts","theme_rules"];
      for(const table of order){
        const rows=Array.isArray(parsed[table])?parsed[table].filter((row:any)=>row && row.user_id===sourceUserId).map((row:any)=>{const mapped={...row,user_id:userId}; if(table==="builds") delete mapped.user_ship_id; if(table==="user_ships") delete mapped.current_build_id; return mapped;}):[];
        if(!rows.length) continue;
        const {error}=await supabase.from(table as never).upsert(rows as never,{onConflict:"id",ignoreDuplicates:table==="build_versions"});
        if(error) throw new Error(table+": "+error.message);
      }
      const childTables=[
        ["loadout_traits","loadout_id","loadouts"],["loadout_boffs","loadout_id","loadouts"],
        ["loadout_duty_officers","loadout_id","loadouts"],["loadout_hangar_pets","loadout_id","loadouts"],["build_doffs","build_id","builds"],
        ["build_readiness_checks","build_id","builds"],["ground_loadout_equipment","loadout_id","build_ground_loadouts"],
      ] as const;
      for(const [table,foreignKey,parentTable] of childTables){
        const parents=new Set(((parsed[parentTable] as Array<{id:string;user_id:string}>|undefined)??[]).filter(row=>row.user_id===sourceUserId).map(row=>row.id));
        const rows=Array.isArray(parsed[table])?parsed[table].filter((row:any)=>row && parents.has(row[foreignKey])).map((row:any)=>row.user_id ? {...row,user_id:userId} : row):[];
        if(!rows.length) continue;
        const {error}=await supabase.from(table as never).upsert(rows as never,{onConflict:"id"});
        if(error) throw new Error(table+": "+error.message);
      }
      // Restore the circular build/ship links only after both sides exist.
      for (const row of ((parsed.builds as Array<any> | undefined) ?? []).filter((item) => item && item.user_id === sourceUserId)) {
        const { error } = await supabase.from("builds").update({ user_ship_id: row.user_ship_id ?? null }).eq("id", row.id).eq("user_id", userId);
        if (error) throw new Error("builds ship link: " + error.message);
      }
      for (const row of ((parsed.user_ships as Array<any> | undefined) ?? []).filter((item) => item && item.user_id === sourceUserId)) {
        const { error } = await supabase.from("user_ships").update({ current_build_id: row.current_build_id ?? null }).eq("id", row.id).eq("user_id", userId);
        if (error) throw new Error("ship build link: " + error.message);
      }
      if(Array.isArray(parsed.profiles) && parsed.profiles[0] && (parsed.profiles[0].id===sourceUserId || parsed.profiles[0].id===userId)){const {error}=await supabase.from("profiles").upsert({...parsed.profiles[0],id:userId} as never,{onConflict:"id"});if(error) throw new Error("profiles: "+error.message);}
      await recordAuditEvent("backup_import", "backup", null, "Fleet backup imported", { schema_version: Number(parsed.schema_version ?? 1) });
      toast.success("Fleet backup imported");
    }catch(e){toast.error(e instanceof Error?e.message:"Could not import fleet backup");}
    finally{setImporting(false);}
  };
  const saveProfile=async()=>{ if(!account.data) return; setSaving(true); const {error}=await supabase.from("profiles").update({display_name:displayName.trim()||null}).eq("id",account.data.id); setSaving(false); if(error) toast.error(error.message); else { await recordAuditEvent("profile_update", "profile", account.data.id, "Profile display name updated"); toast.success("Profile updated"); } };
  return <AppShell title="Settings" subtitle="Account and preferences"><div className="mx-auto max-w-3xl space-y-5">
    <section className="panel p-5"><div className="flex items-center gap-3"><User className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Profile</h2><p className="text-sm text-muted-foreground">Your Command Center identity.</p></div></div><Separator className="my-4"/><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Email</Label><Input value={account.data?.email??""} readOnly/></div><div className="space-y-1"><Label>Display name</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Fleet commander"/></div></div><Button className="mt-4" onClick={saveProfile} disabled={!account.data||saving}>{saving?"Saving…":"Save profile"}</Button></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Security</h2><p className="text-sm text-muted-foreground">Authentication remains managed by Supabase.</p></div></div><Separator className="my-4"/><div className="grid gap-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Signed in as</span><span className="truncate">{account.data?.email??"Loading…"}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span>{account.data?.app_metadata?.provider??"Account"}</span></div></div></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Database className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Data</h2><p className="text-sm text-muted-foreground">Your fleet data stays in the existing backend.</p></div></div><Separator className="my-4"/><p className="text-sm text-muted-foreground">Create a local JSON backup of your Command Center data. Shared ship definitions and theme rules are included; account-owned records are explicitly scoped to the signed-in account.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={exportFleetData} disabled={exporting||!account.data}><Download className="mr-2 size-4"/>{exporting?"Preparing backup…":"Export fleet backup"}</Button><label className="inline-flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent/10"><Upload className="mr-2 size-4"/>{importing?"Importing…":"Import fleet backup"}<input type="file" accept=".json,application/json" className="hidden" disabled={importing||!account.data} onChange={e=>{const f=e.target.files?.[0];if(f) importFleetData(f);e.currentTarget.value="";}}/></label></div><p className="mt-2 text-xs text-muted-foreground">Restore remaps personal records to the current signed-in account and uses upserts; it does not delete existing rows or overwrite the shared ship catalogue.</p></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Activity className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">System diagnostics</h2><p className="text-sm text-muted-foreground">Read-only checks of account records and the shared ship catalogue.</p></div></div><Separator className="my-4"/>
      {diagnostics.isLoading ? <p className="text-sm text-muted-foreground">Checking database access…</p> : diagnostics.isError ? <p className="text-sm text-destructive">Diagnostics failed: {(diagnostics.error as Error).message}. Confirm the backend connection and migrations.</p> : <><p className="mb-3 text-xs text-muted-foreground">Database queries succeeded for this account.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries({Characters:diagnostics.data?.characters, "Owned ships":diagnostics.data?.ownedShips, Builds:diagnostics.data?.builds, Loadouts:diagnostics.data?.loadouts, Inventory:diagnostics.data?.inventory, Projects:diagnostics.data?.projects, Resources:diagnostics.data?.resources, "Catalogue ships":diagnostics.data?.catalogueShips}).map(([label,value])=><div key={label} className="rounded border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl text-primary">{value ?? "—"}</p></div>)}</div></>}
    </section>
    <section className="panel p-5"><div className="flex items-center gap-3"><ClipboardList className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Recent audit log</h2><p className="text-sm text-muted-foreground">Append-only history of important actions and backups.</p></div></div><Separator className="my-4"/>
      {auditLogs.isLoading ? <p className="text-sm text-muted-foreground">Loading audit history…</p> : auditLogs.isError ? <p className="text-sm text-destructive">Audit history is unavailable: {(auditLogs.error as Error).message}</p> : (auditLogs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No audit events recorded yet.</p> : <div className="space-y-2">{(auditLogs.data ?? []).map((entry) => <div key={entry.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2"><div><p className="text-sm font-medium">{entry.summary}</p><p className="text-xs text-muted-foreground">{entry.action} · {entry.entity_type}</p></div><time className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</time></div>)}</div>}
    </section>
  </div></AppShell>;
}
