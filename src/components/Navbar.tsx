import { Link } from "@tanstack/react-router";
import { Snowflake, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/news", label: "News" },
  { to: "/bracket", label: "Bracket" },
  { to: "/live", label: "Live" },
  { to: "/results", label: "Results" },
  { to: "/rules", label: "Rules" },
  { to: "/register", label: "Register" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-cyan/20">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
            <Snowflake className="h-5 w-5 text-[#07111f]" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-sm sm:text-base tracking-widest">ARCTIXMC</div>
            <div className="text-[10px] text-muted-foreground tracking-[0.3em]">CHAMPIONSHIP</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
              activeProps={{ className: "px-3 py-2 text-sm rounded-md text-foreground bg-cyan-400/10" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-cyan/20 px-4 py-3 flex flex-col gap-1 glass-strong">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded text-sm hover:bg-white/5">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
