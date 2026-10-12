import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { recordAuditEvent } from "@/lib/audit";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — STO Command Center" }] }),
  component: Page,
});

const PROJECT_TYPES = ["build", "ship acquisition", "upgrade", "reputation", "campaign", "collection", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "critical"] as const;
type ProjectType = (typeof PROJECT_TYPES)[number];
type Priority = (typeof PRIORITIES)[number];
type FleetProject = {
  id: string; user_id: string; name: string; project_type: ProjectType; description: string | null;
  status: "active" | "paused" | "complete" | "archived"; priority: Priority; progress: number;
  created_at: string; updated_at: string;
};
type ProjectTask = { id: string; user_id: string; project_id: string; title: string; done: boolean; sort_order: number; created_at: string };

function Page() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("build");
  const [priority, setPriority] = useState<Priority>("normal");
  const [description, setDescription] = useState("");

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("projects").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FleetProject[];
    },
  });
  const tasks = useQuery({
    queryKey: ["project_tasks"],
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { data, error } = await supabase.from("project_tasks").select("*").eq("user_id", auth.user.id).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as ProjectTask[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user || !name.trim()) throw new Error("Project name is required.");
      const { error } = await supabase.from("projects").insert({
        user_id: auth.user.id, name: name.trim(), project_type: type, priority,
        description: description.trim() || null, status: "active",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await recordAuditEvent("project_created", "project", null, "Created project: " + name.trim(), { project_type: type, priority });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false); setName(""); setDescription(""); setType("build"); setPriority("normal");
      toast.success("Project created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addTask = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const title = window.prompt("Task name");
      if (!title?.trim()) return;
      const { data: existing, error: readError } = await supabase.from("project_tasks").select("sort_order").eq("user_id", auth.user.id).eq("project_id", projectId).order("sort_order", { ascending: false }).limit(1);
      if (readError) throw readError;
      const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { error } = await supabase.from("project_tasks").insert({ user_id: auth.user.id, project_id: projectId, title: title.trim(), sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_tasks"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (task: ProjectTask) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { error } = await supabase.from("project_tasks").update({ done: !task.done }).eq("id", task.id).eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_tasks"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("Not signed in.");
      const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project_tasks"] });
      toast.success("Project removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => projects.data ?? [], [projects.data]);

  return (
    <AppShell title="Projects" subtitle="Fleet goals, acquisition plans and long-term operations">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="lcars-label">Operations planning</p><h1 className="font-display text-2xl text-primary">Projects</h1><p className="text-sm text-muted-foreground">Track ship builds, purchases, upgrades, reputation, campaigns and collections.</p></div>
          <Button onClick={() => setOpen(!open)}><Plus className="mr-1 size-4" /> New project</Button>
        </div>
        {open && <div className="panel space-y-3 p-4">
          <Input placeholder="Project name" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={type} onValueChange={(value) => setType(value as ProjectType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          </div>
          <Textarea placeholder="Notes / target outcome" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button onClick={() => create.mutate()} disabled={create.isPending || !name.trim()}>Create project</Button>
        </div>}
        {projects.isLoading ? <div className="panel p-8 text-center text-muted-foreground">Loading projects…</div>
          : projects.isError ? <div className="panel p-8 text-center text-destructive">Could not load projects: {(projects.error as Error).message}</div>
          : rows.length === 0 ? <div className="panel p-10 text-center text-muted-foreground">No projects yet. Create your first build or acquisition plan.</div>
          : <div className="grid gap-4 lg:grid-cols-2">{rows.map((project) => {
            const projectTasks = (tasks.data ?? []).filter((task) => task.project_id === project.id);
            const done = projectTasks.filter((task) => task.done).length;
            return <div key={project.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="lcars-label">{project.project_type} • {project.priority}</p><h2 className="font-display text-lg text-primary">{project.name}</h2>{project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}</div><Button size="icon" variant="ghost" aria-label={`Delete ${project.name}`} onClick={() => remove.mutate(project.id)} disabled={remove.isPending}><Trash2 className="size-4 text-destructive" /></Button></div>
              <div className="mt-4 space-y-2">{projectTasks.map((task) => <button key={task.id} className="flex w-full items-center gap-2 text-left text-sm" onClick={() => toggle.mutate(task)} disabled={toggle.isPending}><CheckCircle2 className={task.done ? "size-4 text-primary" : "size-4 text-muted-foreground"} /><span className={task.done ? "line-through text-muted-foreground" : ""}>{task.title}</span></button>)}<Button variant="outline" size="sm" onClick={() => addTask.mutate(project.id)} disabled={addTask.isPending}><Plus className="mr-1 size-3" /> Add task</Button></div>
              <p className="mt-3 text-xs text-muted-foreground">{done}/{projectTasks.length} tasks complete</p>
            </div>;
          })}</div>}
      </div>
    </AppShell>
  );
}
