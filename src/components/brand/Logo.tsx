import { Link } from "@tanstack/react-router";

export function ShieldMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rs-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--violet)" />
          <stop offset="1" stopColor="var(--cyan)" />
        </linearGradient>
      </defs>
      <path d="M32 6 52 14v16c0 13-8.4 22.4-20 26C20.4 52.4 12 43 12 30V14z" fill="none" stroke="url(#rs-g)" strokeWidth="5" strokeLinejoin="round" />
      <path d="m23 31 6.5 6.5L42 25" fill="none" stroke="url(#rs-g)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ to = "/" as "/" | "/dashboard" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
      <ShieldMark />
      <span>
        Revision<span className="text-gradient">Shield</span>
      </span>
    </Link>
  );
}
