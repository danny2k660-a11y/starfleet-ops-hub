import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recordAuditEvent } from "@/lib/audit";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/reputation")({
  head: () => ({ meta: [{ title: "Reputation — STO Command Center" }] }),
  component: ReputationPage,
});

type Character = { id: string; name: string };
type Reputation = { id: string; user_id: string; character_id: string; reputation_name: string; tier: number; progress: number; daily_claimed: boolean; notes: string | null; updated_at: string };

function ReputationPage() {
  const qc = useQueryClient();
  const [filterCharacter, setFilterCharacter] = useState("all");
  const [characterId, setCharacterId] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState("0");
  const [progress, setProgress] = useState("0");
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [notes, setNotes] = useState("");

  const characters = useQuery({
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
  const reputations = useQuery({
    queryKey: ["character_reputations"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("character_reputations").select("*").eq("user_id", auth.user.id).order("reputation_name");
      if (error) throw error;
      return (data ?? []) as Reputation[];
    },
  });
  const characterNames = useMemo(() => new Map((characters.data ?? []).map((character) => [character.id, character.name])), [characters.data]);
  const visible = useMemo(() => (reputations.data ?? []).filter((item) => filterCharacter === "all" || item.character_id === filterCharacter), [reputations.data, filterCharacter]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      if (!characterId) throw new Error("Choose a character.");
      if (!name.trim()) throw new Error("Enter the exact reputation name.");
      const tierValue = Number(tier), progressValue = Number(progress);
      if (!Number.isInteger(tierValue) || tierValue < 0 || tierValue > 6) throw new Error("Tier must be between 0 and 6.");
      if (!Number.isInteger(progressValue) || progressValue < 0 || progressValue > 100) throw new Error("Progress must be between 0 and 100.");
      const { data: existing, error: findError } = await supabase.from("character_reputations").select("id")
        .eq("user_id", auth.user.id).eq("character_id", characterId).eq("reputation_name", name.trim()).limit(1).maybeSingle();
      if (findError) throw findError;
      const payload = { tier: tierValue, progress: progressValue, daily_claimed: dailyClaimed, notes: notes.trim() || null };
      if (existing?.id) {
        const { error } = await supabase.from("character_reputations").update(payload).eq("id", existing.id).eq("user_id", auth.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("character_reputations").insert({ ...payload, user_id: auth.user.id, character_id: characterId, reputation_name: name.trim() });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await recordAuditEvent("reputation_progress_saved", "character_reputation", null, "Saved reputation progress: " + name.trim(), { character_id: characterId, tier: Number(tier), progress: Number(progress) });
      qc.invalidateQueries({ queryKey: ["character_reputations"] });
      setName(""); setTier("0"); setProgress("0"); setDailyClaimed(false); setNotes("");
      toast.success("Reputation progress saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { error } = await supabase.from("character_reputations").delete().eq("id", id).eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character_reputations"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return <AppShell title="Reputation" subtitle="Character-specific reputation tiers and daily progress">
    <div className="space-y-5">
      <div><p className="lcars-label">Captain progression</p><h2 className="font-display text-2xl text-primary">Reputation tracker</h2><p className="text-sm text-muted-foreground">Enter the exact reputation names you use in STO. The app does not invent reputation records or assume your tier.</p></div>
      <div className="panel grid gap-3 p-4 sm:grid-cols-2">
        <div className="space-y-1"><Label>Character</Label><Select value={characterId} onValueChange={setCharacterId}><SelectTrigger><SelectValue placeholder="Choose character" /></SelectTrigger><SelectContent>{(characters.data ?? []).map((character) => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Reputation name</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Exact in-game reputation name" /></div>
        <div className="space-y-1"><Label>Tier (0–6)</Label><Select value={tier} onValueChange={setTier}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 7 }, (_, value) => <SelectItem key={value} value={String(value)}>{value === 0 ? "Not started" : "Tier " + value}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Progress (%)</Label><Input type="number" min="0" max="100" step="1" value={progress} onChange={(event) => setProgress(event.target.value)} /></div>
        <div className="flex items-center gap-2 sm:col-span-2"><input id="reputation-daily-claimed" type="checkbox" checked={dailyClaimed} onChange={(event) => setDailyClaimed(event.target.checked)} /><Label htmlFor="reputation-daily-claimed">Daily reputation project claimed today</Label></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Project status, missing marks or next step" /></div>
        <div className="sm:col-span-2"><Button onClick={() => save.mutate()} disabled={save.isPending || !characterId || !name.trim()}><Plus className="mr-1 size-4" /> Save reputation</Button></div>
      </div>
      <div className="flex items-center gap-3"><Label>Filter by character</Label><Select value={filterCharacter} onValueChange={setFilterCharacter}><SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All characters</SelectItem>{(characters.data ?? []).map((character) => <SelectItem key={character.id} value={character.id}>{character.name}</SelectItem>)}</SelectContent></Select></div>
      {reputations.isLoading ? <div className="panel p-8 text-center text-muted-foreground">Loading reputation records…</div>
        : reputations.isError ? <div className="panel p-8 text-center text-destructive">Could not load reputation records: {(reputations.error as Error).message}</div>
        : visible.length === 0 ? <div className="panel p-8 text-center text-muted-foreground">No reputation records yet. Add the exact in-game names and your current progress.</div>
        : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <div key={item.id} className="panel p-4">
          <div className="flex items-start justify-between gap-2"><div><p className="lcars-label">{characterNames.get(item.character_id) ?? "Character"}</p><h3 className="font-display text-lg text-primary">{item.reputation_name}</h3></div><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={"Edit " + item.reputation_name} onClick={() => { setCharacterId(item.character_id); setName(item.reputation_name); setTier(String(item.tier)); setProgress(String(item.progress)); setDailyClaimed(item.daily_claimed); setNotes(item.notes ?? ""); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={"Delete " + item.reputation_name} onClick={() => { if (window.confirm("Delete this reputation record?")) remove.mutate(item.id); }}><Trash2 className="size-4 text-destructive" /></Button></div></div>
          <div className="mt-3 flex items-center justify-between text-sm"><span>Tier {item.tier}</span><span className="tabular-nums">{item.progress}%</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: item.progress + "%" }} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{item.daily_claimed ? "Daily project marked claimed" : "Daily project not marked claimed"}</p>
          {item.notes && <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>}
        </div>)}</div>}
    </div>
  </AppShell>;
}
