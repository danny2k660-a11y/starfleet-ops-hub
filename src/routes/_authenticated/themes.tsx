import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({ meta: [{ title: "Themes — STO Command Center" }] }),
  component: Page,
});

const presets = [
  { name: "Terran Empire", faction: "Terran", era: "Mirror Universe", priority: "Theme First", description: "Imperial Terran styling, ships, equipment and visual identity." },
  { name: "Romulan", faction: "Romulan", era: "Romulan", priority: "Theme First", description: "Romulan identity with room for non-themed performance builds." },
  { name: "Hur'q", faction: "Hur'q", era: "Dominion", priority: "Theme First", description: "Strict Hur'q carrier and swarm identity." },
  { name: "Discovery-era Terran", faction: "Terran", era: "Discovery", priority: "Theme First", description: "Discovery-era Terran Empire visual and equipment direction." },
  { name: "Canon / Screen Accurate", faction: "Any", era: "Any", priority: "Theme First", description: "Prioritise screen and canon accuracy over optimisation." },
];

function Page() {
  const qc=useQueryClient(); const [theme,setTheme]=useState(presets[0].name); const [type,setType]=useState("keyword"); const [value,setValue]=useState("");
  const rules=useQuery({queryKey:["theme_rules"],queryFn:async()=>{const {data,error}=await supabase.from("theme_rules" as never).select("*").order("theme_name").order("value");if(error)throw error;return data??[];}});
  const add=useMutation({mutationFn:async()=>{const {error}=await supabase.from("theme_rules" as never).insert({theme_name:theme,rule_type:type,value:value.trim()});if(error)throw error;},onSuccess:()=>{setValue("");qc.invalidateQueries({queryKey:["theme_rules"]});toast.success("Theme rule added");},onError:(e:Error)=>toast.error(e.message)});
  const remove=useMutation({mutationFn:async(id:string)=>{const {error}=await supabase.from("theme_rules" as never).delete().eq("id",id);if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:["theme_rules"]})});
  return <AppShell><div className="space-y-6"><div><h1 className="text-2xl font-semibold">Themes</h1><p className="text-sm text-muted-foreground">Define the rules your builds should follow. Nothing is forced — you control the theme.</p></div><div className="grid gap-4 sm:grid-cols-2">{presets.map((p)=><Card key={p.name} className="border-primary/20"><CardHeader><CardTitle className="text-base">{p.name}</CardTitle></CardHeader><CardContent><div className="mb-2 flex gap-2 text-xs"><span className="rounded border px-2 py-1">{p.faction}</span><span className="rounded border px-2 py-1">{p.era}</span><span className="rounded border border-primary/30 px-2 py-1 text-primary">{p.priority}</span></div><p className="text-sm text-muted-foreground">{p.description}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle className="text-base">Custom compliance rules</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-4"><select value={theme} onChange={e=>setTheme(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">{presets.map(p=><option key={p.name}>{p.name}</option>)}</select><select value={type} onChange={e=>setType(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="required">Required</option><option value="allowed">Allowed</option><option value="forbidden">Forbidden</option><option value="keyword">Keyword</option></select><Input value={value} onChange={e=>setValue(e.target.value)} placeholder="Item or keyword" /><Button disabled={!value.trim()||add.isPending} onClick={()=>add.mutate()}><Plus className="mr-1 h-4 w-4"/>Add rule</Button></div><div className="mt-4 space-y-2">{(rules.data as any[]||[]).map(r=><div key={r.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"><span><b>{r.theme_name}</b><span className="ml-2 text-muted-foreground">{r.rule_type}</span><span className="ml-2 text-primary">{r.value}</span></span><Button variant="ghost" size="icon" onClick={()=>remove.mutate(r.id)}><Trash2 className="h-4 w-4"/></Button></div>)}</div></CardContent></Card></div></AppShell>;
}{rules.isError&&<div className="panel mb-4 p-4 text-center text-sm text-destructive">Unable to load theme rules. Refresh and try again.</div>}
  
