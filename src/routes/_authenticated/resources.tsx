import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route=createFileRoute("/_authenticated/resources")({head:()=>({meta:[{title:"Resources — STO Command Center"}]}),component:Page});
const RESOURCE_TYPES=["Zen","Dilithium","Energy Credits","Lobi","Fleet Credits","Reputation Marks","Phoenix Tokens","Experimental Tokens","T6 Ship Coupons","Event Campaign Progress","Upgrade Tokens","Other"];
function Page(){
 const qc=useQueryClient(); const [character,setCharacter]=useState("account"); const [type,setType]=useState("Zen"); const [amount,setAmount]=useState("");
 const chars=useQuery({queryKey:["characters"],queryFn:async()=>{const {data,error}=await supabase.from("characters").select("id,name").order("name");if(error)throw error;return data??[]}});
 const resources=useQuery({queryKey:["sto_resources"],queryFn:async()=>{const {data,error}=await supabase.from("sto_resource_balances").select("*,characters(name)").order("resource_type");if(error)throw error;return data??[]}});
 const save=useMutation({mutationFn:async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user)throw new Error("Not signed in");const cid=character==="account"?null:character;const {error}=await supabase.from("sto_resource_balances").upsert({user_id:u.user.id,character_id:cid,resource_type:type,amount:Number(amount)||0},{onConflict:"user_id,character_id,resource_type"} as any);if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:["sto_resources"]});toast.success("Resource balance saved");}});
 return <AppShell title="Resources" subtitle="Currencies, tokens and stockpiles"><div className="space-y-5">
 <div><p className="lcars-label">Resource ledger</p><h1 className="font-display text-2xl text-primary">Account & character resources</h1><p className="text-sm text-muted-foreground">Keep the values you actually have so projects and shopping lists can account for them.</p></div>
 <div className="panel p-4 grid gap-3 sm:grid-cols-4"><Select value={character} onValueChange={setCharacter}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="account">Account-wide</SelectItem>{(chars.data??[]).map((c:any)=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{RESOURCE_TYPES.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select><Input inputMode="decimal" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)}/><button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>save.mutate()}><Save className="mr-1 size-4"/> Save</button></div>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(resources.data??[]).map((r:any)=><div key={r.id} className="rounded-lg border border-border bg-card/70 p-4"><p className="lcars-label">{r.characters?.name??"Account-wide"}</p><p className="font-display text-lg text-primary">{r.resource_type}</p><p className="mt-1 text-2xl">{Number(r.amount).toLocaleString()}</p></div>)}</div>
 </div></AppShell>;
}
