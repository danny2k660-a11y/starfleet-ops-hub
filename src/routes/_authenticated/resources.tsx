import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({ meta: [{ title: "Resources — STO Command Center" }] }),
  component: Page,
});

const RESOURCE_TYPES = ["Zen", "Dilithium", "Energy Credits", "Lobi", "Fleet Credits", "Reputation Marks", "Phoenix Tokens", "Experimental Tokens", "T6 Ship Coupons", "Event Campaign Progress", "Upgrade Tokens", "Other"] as const;
type ResourceName = (typeof RESOURCE_TYPES)[number];
type Character = { id: string; name: string };
type ResourceBalance = { id: string; user_id: string; character_id: string | null; name: string; category: string; quantity: number; target: number | null; notes: string | null; updated_at: string };

function Page() {
  const qc = useQueryClient();
  const [character, setCharacter] = useState("account");
  const [type, setType] = useState<ResourceName>("Zen");
  const [amount, setAmount] = useState("");

  const chars = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("characters").select("id,name").eq("user_id", auth.user.id).order("name");
      if (error) throw error;
      return (data ?? []) as Character[];
    },
  });
  const resources = useQuery({
    queryKey: ["resource_balances"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("resource_balances").select("*").eq("user_id", auth.user.id).order("name");
      if (error) throw error;
      return (data ?? []) as ResourceBalance[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const quantity = Number(amount);
      if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error("Enter a whole-number balance of zero or more.");
      const characterId = character === "account" ? null : character;
      let query = supabase.from("resource_balances").select("id").eq("user_id", auth.user.id).eq("name", type);
      query = characterId === null ? query.is("character_id", null) : query.eq("character_id", characterId);
      const { data: existing, error: readError } = await query.limit(1).maybeSingle();
      if (readError) throw readError;
      if (existing?.id) {
        const { error } = await supabase.from("resource_balances").update({ quantity, category: "Currency" }).eq("id", existing.id).eq("user_id", auth.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("resource_balances").insert({ user_id: auth.user.id, character_id: characterId, name: type, category: "Currency", quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource_balances"] });
      setAmount("");
      toast.success("Resource balance saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const characterNames = useMemo(() => new Map((chars.data ?? []).map((item) => [item.id, item.name])), [chars.data]);
  return (
    <AppShell title="Resources" subtitle="Currencies, tokens and stockpiles">
      <div className="space-y-5">
        <div><p className="lcars-label">Resource ledger</p><h1 className="font-display text-2xl text-primary">Account & character resources</h1><p className="text-sm text-muted-foreground">Record the balances you actually have so projects and shopping lists can account for them.</p></div>
        <div className="panel grid gap-3 p-4 sm:grid-cols-4">
          <Select value={character} onValueChange={setCharacter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="account">Account-wide</SelectItem>{(chars.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Select value={type} onValueChange={(value) => setType(value as ResourceName)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <Input type="number" min="0" step="1" inputMode="numeric" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <Button onClick={() => save.mutate()} disabled={save.isPending || amount.trim() === ""}><Save className="mr-1 size-4" /> Save balance</Button>
        </div>
        {resources.isLoading ? <div className="panel p-8 text-center text-muted-foreground">Loading resource balances…</div>
          : resources.isError ? <div className="panel p-8 text-center text-destructive">Could not load balances: {(resources.error as Error).message}</div>
          : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(resources.data ?? []).map((resource) => <div key={resource.id} className="rounded-lg border border-border bg-card/70 p-4"><p className="lcars-label">{resource.character_id ? characterNames.get(resource.character_id) ?? "Character" : "Account-wide"}</p><p className="font-display text-lg text-primary">{resource.name}</p><p className="mt-1 text-2xl tabular-nums">{Number(resource.quantity).toLocaleString()}</p></div>)}</div>}
      </div>
    </AppShell>
  );
}
