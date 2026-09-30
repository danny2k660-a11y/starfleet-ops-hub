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
import { User, Shield, Database } from "lucide-react";

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
  const saveProfile=async()=>{ if(!account.data) return; setSaving(true); const {error}=await supabase.from("profiles").update({display_name:displayName.trim()||null}).eq("id",account.data.id); setSaving(false); if(error) toast.error(error.message); else toast.success("Profile updated"); };
  return <AppShell title="Settings" subtitle="Account and preferences"><div className="mx-auto max-w-3xl space-y-5">
    <section className="panel p-5"><div className="flex items-center gap-3"><User className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Profile</h2><p className="text-sm text-muted-foreground">Your Command Center identity.</p></div></div><Separator className="my-4"/><div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1"><Label>Email</Label><Input value={account.data?.email??""} readOnly/></div>
      <div className="space-y-1"><Label>Display name</Label><Input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Fleet commander"/></div>
    </div><Button className="mt-4" onClick={saveProfile} disabled={!account.data||saving}>{saving?"Saving…":"Save profile"}</Button></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Shield className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Security</h2><p className="text-sm text-muted-foreground">Authentication remains managed by Supabase.</p></div></div><Separator className="my-4"/><div className="grid gap-2 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Signed in as</span><span className="truncate">{account.data?.email??"Loading…"}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span>{account.data?.app_metadata?.provider??"Account"}</span></div></div></section>
    <section className="panel p-5"><div className="flex items-center gap-3"><Database className="size-5 text-primary"/><div><h2 className="font-display text-xl text-primary">Data</h2><p className="text-sm text-muted-foreground">Your fleet data stays in the existing backend.</p></div></div><Separator className="my-4"/><p className="text-sm text-muted-foreground">Data export and destructive account actions are intentionally kept separate from routine settings so they cannot be triggered accidentally.</p></section>
  </div></AppShell>;
}
