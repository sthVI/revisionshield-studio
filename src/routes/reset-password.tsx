import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — RevisionShield" }, { name: "description", content: "Choose a new RevisionShield account password." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Reset password — RevisionShield" }, { property: "og:description", content: "Choose a new RevisionShield account password." }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/dashboard", replace: true });
  }
  return <MarketingLayout><section className="mx-auto max-w-md px-5 py-20"><div className="rounded-2xl border border-border bg-card p-7"><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use at least 8 characters. This opens from your recovery email.</p><form onSubmit={submit} className="mt-6 space-y-4"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button variant="hero" className="w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button></form><Button asChild variant="ghost" className="mt-3 w-full"><Link to="/auth">Back to sign in</Link></Button></div></section></MarketingLayout>;
}
