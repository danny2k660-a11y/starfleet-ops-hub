import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, Radar } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { navItems } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-border hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{
            className:
              "border-primary/40 bg-sidebar-accent text-primary glow-primary",
          }}
        >
          <item.icon className="size-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/50 text-primary glow-primary">
        <Radar className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold tracking-widest text-foreground">
          STO
        </p>
        <p className="lcars-label truncate">Command Center</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-sidebar/70 backdrop-blur lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <Brand />
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavList />
        </div>
        <div className="border-t border-border p-3">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto]">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-border bg-sidebar p-0">
              <Brand />
              <div className="px-3 pb-6">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-wide text-foreground sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Sign out"
            onClick={handleSignOut}
          >
            <LogOut className="size-5" />
          </Button>
        </header>

        <main className="min-w-0 flex-1 p-3 pb-8 sm:p-6 sm:pb-8">{children}</main>
      </div>
    </div>
  );
}

export function PlaceholderPage({
  title,
  subtitle,
  description,
  planned,
}: {
  title: string;
  subtitle?: string | undefined;
  description: string;
  planned: string[];
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="panel max-w-3xl p-6">
        <p className="lcars-label">Module status</p>
        <h2 className="mt-1 text-xl text-primary">Standing by</h2>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {planned.map((item) => (
            <li
              key={item}
              className="rounded-md border border-border bg-surface-2/50 px-3 py-2 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
