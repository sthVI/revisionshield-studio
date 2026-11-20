import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Mail, Play, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { setDemoMode } from "@/lib/demo";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signin" | "signup" } => ({ mode: s["mode"] === "signup" ? "signup" : "signin" }),
  head: () => ({ meta: [{ title: "Sign in — RevisionShield" }, { name: "description", content: "Sign in to manage scope, revisions and client approvals with RevisionShield." }, { property: "og:title", content: "Sign in — RevisionShield" }, { property: "og:description", content: "Open your RevisionShield freelance workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (ready && user) navigate({ to: "/dashboard", replace: true }); }, [ready, user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setMessage(""); setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage("If that account exists, a password reset email is on its way.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t complete that request. Please try again.");
    } finally { setBusy(false); }
  }

  async function oauth(provider: "google" | "lovable") {
    setError(""); setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) { setError(result.error.message); setBusy(false); }
  }

  function demo() { setDemoMode(true); navigate({ to: "/dashboard" }); }

  return (
    <MarketingLayout>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-[1fr_420px] md:items-center md:py-20">
        <div className="hidden md:block"><div className="grid size-12 place-items-center rounded-xl border border-violet/30 bg-card"><ShieldCheck className="size-6 text-cyan" /></div><h1 className="mt-6 text-4xl font-semibold leading-tight">A calmer way to keep client work <span className="text-gradient">on the record.</span></h1><p className="mt-4 max-w-md text-muted-foreground">Scope, revisions, approvals and changes — without another complicated project management system.</p></div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-glow sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{forgot ? "Account recovery" : mode === "signup" ? "Create your workspace" : "Welcome back"}</p>
          <h2 className="mt-2 text-2xl font-semibold">{forgot ? "Reset your password" : mode === "signup" ? "Start with a clear scope" : "Sign in to RevisionShield"}</h2>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@studio.com" /></div></div>
            {!forgot && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === "signin" && <button type="button" className="text-xs text-cyan hover:underline" onClick={() => { setForgot(true); setError(""); setMessage(""); }}>Forgot password?</button>}</div><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>}
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{message}</p>}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}<ArrowRight /></Button>
          </form>
          {forgot ? <Button variant="ghost" className="mt-3 w-full" onClick={() => setForgot(false)}>Back to sign in</Button> : <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div>
            <div className="grid grid-cols-2 gap-3"><Button variant="google" disabled={busy} onClick={() => oauth("google")}>Google</Button><Button variant="glass" disabled={busy} onClick={() => oauth("lovable")}>Lovable</Button></div>
            <button className="mt-5 w-full text-center text-sm text-muted-foreground" onClick={() => navigate({ to: "/auth", search: { mode: mode === "signup" ? "signin" : "signup" } })}>{mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
          </>}
          <div className="mt-6 border-t border-border pt-5"><Button variant="outline" className="w-full" onClick={demo}><Play />Explore the interactive demo</Button><p className="mt-2 text-center text-xs text-muted-foreground">No account needed. Demo changes stay in this browser.</p></div>
        </div>
      </section>
    </MarketingLayout>
  );
}
