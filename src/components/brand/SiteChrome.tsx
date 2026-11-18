import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/compare", label: "Compare" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="hero" size="sm"><Link to="/dashboard">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth">Sign in</Link></Button>
              <Button asChild variant="hero" size="sm"><Link to="/auth" search={{ mode: "signup" }}>Try it free</Link></Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}><Menu /></Button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent" onClick={() => setOpen(false)}>{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <Logo />
          <p>Scope, revision, approval and change-request records for freelancers. RevisionShield creates project records — it is not legal advice and does not guarantee payment.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2">
          <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link to="/compare" className="hover:text-foreground">Compare</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          <Link to="/whop-setup" className="hover:text-foreground">Whop setup (admin)</Link>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground/70">© {new Date().getFullYear()} RevisionShield</p>
    </footer>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
