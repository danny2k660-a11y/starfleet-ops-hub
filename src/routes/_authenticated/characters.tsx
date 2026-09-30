import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserRound, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Character = Tables<"characters">;

export const Route = createFileRoute("/_authenticated/characters")({
  head: () => ({ meta: [{ title: "Characters — STO Command Center" }, { name: "description", content: "Manage your STO captains and keep every character's ships and equipment separated." }] }),
  component: CharactersPage,
});

function CharactersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);
  const characters = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("characters").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => (characters.data ?? []).filter(c =>
    `${c.name} ${c.faction ?? ""} ${c.career ?? ""} ${c.species ?? ""}`.toLowerCase().includes(q.toLowerCase())
  ), [characters.data, q]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("characters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters"] }); toast.success("Character removed"); setSelected(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Characters" subtitle="Your STO captains">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="lcars-label">Personnel registry</p><h2 className="font-display text-2xl text-primary sm:text-3xl">Characters</h2></div>
          <Button onClick={() => { setSelected(null); setOpen(true); }} className="glow-primary"><Plus className="mr-1 size-4" /> Add character</Button>
        </div>
        <div className="panel p-4"><div className="relative"><Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search name, faction, career or species…" value={q} onChange={e => setQ(e.target.value)} /></div></div>
        {characters.isLoading ? <p className="text-muted-foreground">Loading personnel registry…</p> :
          filtered.length === 0 ? <div className="panel p-8 text-center text-muted-foreground"><UserRound className="mx-auto mb-2 size-8 text-primary" />{characters.data?.length ? "No characters match your search." : "No characters yet. Add your first captain."}</div> :
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(c =>
            <button key={c.id} onClick={() => { setSelected(c); setOpen(true); }} className="panel p-5 text-left transition hover:border-primary">
              <div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{c.faction ?? "Faction not set"}</p><h3 className="font-display text-xl text-primary">{c.name}</h3></div><UserRound className="size-5 text-accent" /></div>
              <div className="mt-3 flex flex-wrap gap-2">{c.career && <Badge variant="outline">{c.career}</Badge>}{c.species && <Badge variant="outline">{c.species}</Badge>}{c.level != null && <Badge variant="secondary">Lv {c.level}</Badge>}</div>
            </button>
          )}</div>}
        <CharacterDialog open={open} onOpenChange={setOpen} character={selected} onDeleted={() => remove.mutate(selected!.id)} />
      </div>
    </AppShell>
  );
}

function CharacterDialog({ open, onOpenChange, character, onDeleted }: { open: boolean; onOpenChange: (v: boolean) => void; character: Character | null; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(character?.name ?? "");
  const [faction, setFaction] = useState(character?.faction ?? "");
  const [career, setCareer] = useState(character?.career ?? "");
  const [species, setSpecies] = useState(character?.species ?? "");
  const [level, setLevel] = useState(character?.level?.toString() ?? "");
  const [notes, setNotes] = useState(character?.notes ?? "");

  const reset = (c: Character | null) => { setName(c?.name ?? ""); setFaction(c?.faction ?? ""); setCareer(c?.career ?? ""); setSpecies(c?.species ?? ""); setLevel(c?.level?.toString() ?? ""); setNotes(c?.notes ?? ""); };
  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload = { name: name.trim(), faction: faction || null, career: career || null, species: species || null, level: level ? Number(level) : null, notes: notes || null };
      if (character) {
        const { error } = await supabase.from("characters").update(payload).eq("id", character.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("characters").insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["characters"] }); toast.success(character ? "Character updated" : "Character added"); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return <Dialog open={open} onOpenChange={v => { if (v) reset(character); onOpenChange(v); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle className="font-display text-primary">{character ? "Edit character" : "Add character"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Captain name" /></div>
        <div className="space-y-1"><Label>Faction</Label><Input value={faction} onChange={e => setFaction(e.target.value)} placeholder="Terran Empire, Romulan, Federation…" /></div>
        <div className="space-y-1"><Label>Career</Label><Select value={career} onValueChange={setCareer}><SelectTrigger><SelectValue placeholder="Select career" /></SelectTrigger><SelectContent><SelectItem value="Tactical">Tactical</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="Engineering">Engineering</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label>Species</Label><Input value={species} onChange={e => setSpecies(e.target.value)} placeholder="Species" /></div>
        <div className="space-y-1"><Label>Level</Label><Input type="number" min="1" max="65" value={level} onChange={e => setLevel(e.target.value)} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Theme rules, important character notes…" /></div>
      </div>
      <DialogFooter className="gap-2">{character && <Button variant="ghost" className="mr-auto text-destructive" onClick={() => { if (confirm("Remove this character? Their linked ships may also be affected.")) onDeleted(); }}><Trash2 className="mr-1 size-4" /> Remove</Button>}<Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : character ? "Save changes" : "Add character"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
