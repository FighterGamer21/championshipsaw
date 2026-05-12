import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Skull, Activity, Users } from "lucide-react";
import { STATUS_STYLES, type PlayerStatus } from "@/lib/event";

export const Route = createFileRoute("/live")({
  component: LivePage,
  head: () => ({
    meta: [
      { title: "Live — ARCTIXMC Championship" },
      { name: "description", content: "Live updates from the ARCTIXMC Championship." },
    ],
  }),
});

type Player = { id: string; ign: string; status: PlayerStatus; current_day: number; current_round: string | null };
type Elimination = { id: string; player_id: string; day: number; round_name: string; created_at: string };

function LivePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [elims, setElims] = useState<Elimination[]>([]);
  const [settings, setSettings] = useState<{ current_day: number; current_round: string | null; event_status: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: e }, { data: s }] = await Promise.all([
        supabase.from("players").select("id,ign,status,current_day,current_round").order("ign"),
        supabase.from("eliminations").select("id,player_id,day,round_name,created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("settings").select("current_day,current_round,event_status").eq("id", 1).maybeSingle(),
      ]);
      setPlayers((p ?? []) as Player[]);
      setElims((e ?? []) as Elimination[]);
      setSettings(s as typeof settings);
    };
    load();
    const ch = supabase
      .channel("live")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "eliminations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const byStatus = (s: PlayerStatus[]) => players.filter((p) => s.includes(p.status));
  const alive = byStatus(["ALIVE", "QUALIFIED", "SEMI_FINALIST", "FINALIST", "TOP_3"]);
  const eliminated = byStatus(["ELIMINATED", "DISQUALIFIED"]);
  const qualified = byStatus(["QUALIFIED", "SEMI_FINALIST", "FINALIST", "TOP_3"]);
  const top3 = byStatus(["TOP_3"]);
  const champion = players.find((p) => p.status === "CHAMPION");
  const ignFor = (id: string) => players.find((p) => p.id === id)?.ign ?? "Unknown";

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs tracking-[0.3em] text-[#00d4ff]">
            <Activity className="h-3 w-3 animate-pulse" /> LIVE
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">Live Updates</h1>
          {settings && (
            <p className="text-muted-foreground mt-3">
              {settings.current_day > 0 ? `Day ${settings.current_day}` : "Pre-event"} · {settings.current_round ?? "Standby"} · Status: <span className="text-[#00d4ff]">{settings.event_status}</span>
            </p>
          )}
        </div>

        {champion && (
          <div className="mt-10 glass-strong rounded-2xl p-10 text-center glow-cyan-strong">
            <Crown className="h-14 w-14 mx-auto text-yellow-300" />
            <div className="text-xs tracking-[0.4em] text-[#00d4ff] mt-3">CHAMPION</div>
            <div className="font-display text-5xl mt-2 text-gradient-brand">{champion.ign}</div>
          </div>
        )}

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Users} label="Total" value={players.length} />
          <Stat icon={Activity} label="Alive" value={alive.length} accent />
          <Stat icon={Skull} label="Eliminated" value={eliminated.length} />
          <Stat icon={Crown} label="Top 3" value={top3.length} />
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <PlayerList title="Alive Players" players={alive} />
          <PlayerList title="Qualified" players={qualified} />
          <PlayerList title="Top 3 Finalists" players={top3} />
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display tracking-widest text-sm text-[#00d4ff]">LATEST ELIMINATIONS</h3>
            <ul className="mt-4 space-y-2">
              {elims.length === 0 && <li className="text-sm text-muted-foreground">No eliminations yet.</li>}
              {elims.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-cyan/10">
                  <div className="flex items-center gap-2">
                    <Skull className="h-4 w-4 text-rose-400" />
                    <span className="font-medium">{ignFor(e.player_id)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">D{e.day} · {e.round_name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 glass-strong rounded-2xl p-6">
          <h3 className="font-display tracking-widest text-sm text-[#00d4ff]">ALL PLAYERS</h3>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between glass rounded-lg px-3 py-2 text-sm">
                <span className="font-medium truncate">{p.ign}</span>
                <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[p.status]}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`glass rounded-xl p-5 ${accent ? "glow-cyan" : ""}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-[#00d4ff]" />
        <span className="text-xs tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="font-display text-4xl mt-3">{value}</div>
    </div>
  );
}

function PlayerList({ title, players }: { title: string; players: Player[] }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <h3 className="font-display tracking-widest text-sm text-[#00d4ff]">{title.toUpperCase()} ({players.length})</h3>
      <ul className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-2">
        {players.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
        {players.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-cyan/10">
            <span className="font-medium">{p.ign}</span>
            <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[p.status]}`}>{p.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
