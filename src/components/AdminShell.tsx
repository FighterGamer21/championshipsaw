import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useRole } from "@/hooks/use-role";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Swords, Settings as SettingsIcon, LogOut, Snowflake, Newspaper, Ban, ShieldCheck } from "lucide-react";

type Link = { to: string; label: string; icon: typeof LayoutDashboard; roles: ("owner" | "admin" | "moderator")[] };

const allLinks: Link[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "admin", "moderator"] },
  { to: "/admin/players", label: "Players", icon: Users, roles: ["owner", "admin", "moderator"] },
  { to: "/admin/rounds", label: "Rounds", icon: Swords, roles: ["owner", "admin"] },
  { to: "/admin/posts", label: "Posts", icon: Newspaper, roles: ["owner", "admin"] },
  { to: "/admin/bans", label: "Bans", icon: Ban, roles: ["owner", "admin"] },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, roles: ["owner", "admin"] },
  { to: "/admin/users", label: "Users", icon: ShieldCheck, roles: ["owner"] },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { loading, error, userId, isOwner, isAdmin, isModerator, refresh } = useRole();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !error && (!userId || !isModerator)) nav({ to: "/admin/login" });
  }, [loading, error, userId, isModerator, nav]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading admin...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-strong rounded-2xl p-6 max-w-md text-center">
          <div className="font-display text-xl">Admin session problem</div>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={refresh} className="bg-[#00d4ff] text-[#07111f] hover:bg-[#00d4ff]/90">Try Again</Button>
            <Button onClick={() => nav({ to: "/admin/login" })} variant="outline" className="border-cyan">Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isModerator) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Redirecting to admin login...</div>;
  }

  const links = allLinks.filter((l) =>
    l.roles.some((r) => (r === "owner" && isOwner) || (r === "admin" && isAdmin) || (r === "moderator" && isModerator))
  );

  const logout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-strong border-b border-cyan/20 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
              <Snowflake className="h-4 w-4 text-[#07111f]" />
            </div>
            <div className="font-display text-sm tracking-widest">ARCTIXMC <span className="text-[#00d4ff]">{isOwner ? "OWNER" : isAdmin ? "ADMIN" : "MOD"}</span></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${path === l.to ? "bg-cyan-400/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            ))}
          </nav>
          <Button onClick={logout} variant="outline" size="sm" className="border-cyan"><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>
        <nav className="md:hidden flex overflow-x-auto px-2 pb-2 gap-1 border-t border-cyan/10">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 whitespace-nowrap ${path === l.to ? "bg-cyan-400/10 text-foreground" : "text-muted-foreground"}`}>
              <l.icon className="h-3.5 w-3.5" />{l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
