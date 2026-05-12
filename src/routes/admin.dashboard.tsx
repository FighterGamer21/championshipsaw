import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ClipboardCheck, Activity, Skull, Crown, Trophy, Award, Medal } from "lucide-react";
import type { PlayerStatus } from "@/lib/event";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin Dashboard — ARCTIXMC" }, { name: "robots", content: "noindex" }] }),
});

function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("players").select("status");
      const c: Record<string, number> = { total: data?.length ?? 0 };
      (data ?? []).forEach((r: { status: PlayerStatus }) => { c[r.status] = (c[r.status] ?? 0) + 1; });
      setCounts(c);
    };
    load();
    const ch = supabase.channel("admin-stats").on("postgres_changes", { event: "*", schema: "public", table: "players" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const cards = [
    { l: "Total Registered", v: counts.total ?? 0, i: Users },
    { l: "Checked In", v: counts.CHECKED_IN ?? 0, i: ClipboardCheck },
    { l: "Alive", v: (counts.ALIVE ?? 0) + (counts.SEMI_FINALIST ?? 0) + (counts.FINALIST ?? 0) + (counts.TOP_3 ?? 0), i: Activity },
    { l: "Eliminated", v: (counts.ELIMINATED ?? 0) + (counts.DISQUALIFIED ?? 0), i: Skull },
    { l: "Qualified", v: counts.QUALIFIED ?? 0, i: Award },
    { l: "Finalists", v: counts.FINALIST ?? 0, i: Medal },
    { l: "Top 3", v: counts.TOP_3 ?? 0, i: Trophy },
    { l: "Champion", v: counts.CHAMPION ?? 0, i: Crown },
  ];

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Live stats across the championship.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.l} className="glass-strong rounded-2xl p-6 hover:glow-cyan transition">
              <div className="flex items-center justify-between">
                <c.i className="h-5 w-5 text-[#00d4ff]" />
                <span className="text-[10px] tracking-widest text-muted-foreground">{c.l.toUpperCase()}</span>
              </div>
              <div className="font-display text-5xl mt-4">{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
