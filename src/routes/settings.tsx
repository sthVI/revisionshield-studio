import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Save, Settings2 } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { Panel } from "@/components/app/bits";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/format";
import { profileQuery, updateProfile } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "Settings — RevisionShield" }, { name: "description", content: "Manage your RevisionShield business details and project defaults." }, { property: "og:title", content: "Settings — RevisionShield" }, { property: "og:description", content: "RevisionShield workspace settings." }, { name: "twitter:card", content: "summary" }] }),
  component: () => <WorkspaceGate><AppShell><SettingsPage /></AppShell></WorkspaceGate>,
});

function SettingsPage() {
  const profile = useQuery(profileQuery());
  const queryClient = useQueryClient();
  const [business, setBusiness] = useState(""); const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD"); const [revisions, setRevisions] = useState("2");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile.data) { setBusiness(profile.data.business_name ?? ""); setName(profile.data.display_name ?? ""); setCurrency(profile.data.default_currency); setRevisions(String(profile.data.default_revisions)); } }, [profile.data]);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); try { await updateProfile({ business_name: business.trim() || null, display_name: name.trim() || null, default_currency: currency, default_revisions: Number(revisions), onboarded: true }); await queryClient.invalidateQueries(); toast.success("Settings saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "Settings couldn’t be saved"); } finally { setBusy(false); } }
  if (profile.isLoading) return <PageLoading />;
  if (profile.isError) return <Panel title="Settings couldn’t load"><p className="text-sm text-destructive">{profile.error.message}</p><Button className="mt-4" variant="outline" onClick={() => profile.refetch()}>Try again</Button></Panel>;
  return <div className="mx-auto max-w-2xl"><div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Workspace</p><h1 className="mt-2 text-3xl font-semibold">Settings</h1><p className="mt-2 text-sm text-muted-foreground">Business details appear on your own reports and client review pages.</p></div><Panel title="Business & defaults"><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="business">Business name</Label><Input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Your studio or business" /></div><div className="space-y-2"><Label htmlFor="display-name">Your display name</Label><Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="default-currency">Default currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger id="default-currency"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="default-revisions">Default included revisions</Label><Input id="default-revisions" type="number" min="0" max="99" required value={revisions} onChange={(e) => setRevisions(e.target.value)} /></div></div><Button variant="hero" disabled={busy}><Save />{busy ? "Saving…" : "Save settings"}</Button></form></Panel><div className="mt-5 flex gap-3 rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground"><Settings2 className="mt-0.5 size-4 shrink-0 text-cyan" /><p>Membership checkout and Whop access syncing are not connected. These settings do not change billing or account access.</p></div></div>;
}
