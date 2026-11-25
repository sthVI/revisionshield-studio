import { Link, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, LayoutDashboard, LogOut, Plus, RotateCcw, Settings, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { isDemoMode, resetDemoState, setDemoMode } from "@/lib/demo";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/lib/auth";
import { PageLoading } from "@/components/brand/LoadingScreen";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-cyan/10 px-4 py-2 text-center text-xs text-cyan">
      <strong>Demo mode:</strong> sample data is stored only in this browser. Nothing is sent to your account.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const demo = isDemoMode();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (demo) setDemoMode(false);
    else await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function resetDemo() {
    resetDemoState();
    queryClient.invalidateQueries();
    toast.success("Demo data reset");
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur print-hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo to="/dashboard" />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Workspace">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/dashboard"><LayoutDashboard />Projects</Link></Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex"><Link to="/freelancer"><BriefcaseBusiness />Freelancer tools</Link></Button>
            <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Freelancer Intelligence"><Link to="/freelancer"><BriefcaseBusiness /></Link></Button>
            <Button asChild variant="hero" size="sm"><Link to="/projects/new"><Plus /><span className="hidden xs:inline">New project</span><span className="xs:hidden">New</span></Link></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Settings"><Link to="/settings"><Settings /></Link></Button>
            {demo && <Button variant="ghost" size="icon" aria-label="Reset demo data" onClick={resetDemo}><RotateCcw /></Button>}
            <Button variant="ghost" size="icon" aria-label={demo ? "Exit demo" : "Sign out"} onClick={signOut}><LogOut /></Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 print:max-w-none print:p-0">{children}</main>
      <footer className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-8 text-xs text-muted-foreground print-hidden sm:px-6"><ShieldCheck className="size-4 text-cyan" />Clear records. Calm client conversations.</footer>
    </div>
  );
}

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { user, ready } = useUser();
  const navigate = useNavigate();
  if (!ready) return <PageLoading />;
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-glow">
          <div className="mx-auto mb-5 w-fit"><Logo /></div>
          <ShieldCheck className="mx-auto size-9 text-cyan" />
          <h1 className="mt-4 text-2xl font-semibold">Your project records, in one place</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to open your workspace, or explore a fully interactive demo stored only in this browser.</p>
          <Button asChild variant="hero" className="mt-6 w-full"><Link to="/auth">Sign in or create an account</Link></Button>
          <Button variant="glass" className="mt-3 w-full" onClick={() => { setDemoMode(true); navigate({ to: "/dashboard" }); }}>Explore the demo</Button>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
